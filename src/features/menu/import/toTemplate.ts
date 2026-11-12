import { normalizeHeading } from "./detectColumns";
import type { DraftItem } from "./types";

/**
 * Turns the dishes the vendor checked into the workbook the server's Excel
 * import takes, so the server's own checks and all-or-nothing import still
 * apply. The headings come from the live template, so a change to the
 * template's columns does not need a change here.
 */
export interface TemplateLayout {
  /** The sheet that holds one dish per row. */
  menuSheet: string;
  headers: string[];
  /** Other sheets the template has (e.g. Add-ons); sent with their headings only. */
  otherSheets: { name: string; headers: string[] }[];
}

/** The template as last seen; used when the live one cannot be read. */
export const defaultLayout: TemplateLayout = {
  menuSheet: "Menu Items",
  headers: [
    "Item Name", "Description", "category_name", "subcategory name", "price",
    "prep time in minutes", "discount_type", "discount percent", "flat discount",
    "food_served", "qty_types", "Image", "available now", "Item Code",
  ],
  otherSheets: [
    {
      name: "Addons",
      headers: ["Item Code", "Addon name", "Price", "is_available", "Image"],
    },
  ],
};

const headerCells = (row: unknown[] | undefined) => {
  const cells = (row ?? []).map((c) => String(c ?? "").trim());
  while (cells.length && !cells[cells.length - 1]) cells.pop();
  return cells;
};

/** Reads the sheet names and headings from the template the server provides. */
export async function readTemplateLayout(blob: Blob): Promise<TemplateLayout> {
  const XLSX = await import("xlsx"),
    book = XLSX.read(new Uint8Array(await blob.arrayBuffer()), { type: "array" }),
    heads = book.SheetNames.map((name) => ({
      name,
      headers: headerCells(
        (XLSX.utils.sheet_to_json(book.Sheets[name], { header: 1 }) as unknown[][])[0],
      ),
    })),
    menu = heads.find((h) => {
      const n = h.headers.map(normalizeHeading);
      return n.includes("itemname") && n.includes("price");
    });
  if (!menu) throw new Error("The template has no menu sheet.");
  return {
    menuSheet: menu.name,
    headers: menu.headers,
    otherSheets: heads.filter(
      (h) => h !== menu && h.headers.length && !/instruction/i.test(h.name),
    ),
  };
}

const foodLabel = { Veg: "Veg", "Non-veg": "Non-Veg", Egg: "Egg" } as const;

/** The price after the offer, for templates that ask for an "offer price". */
const offerPrice = (item: DraftItem) => {
  if (item.price === null || !item.discountType) return null;
  const off =
    item.discountType === "percent"
      ? (item.price * item.discPercent) / 100
      : item.flatAmount;
  return Math.round((item.price - off) * 100) / 100;
};

/** The code that links a dish to its rows in the Addons sheet. */
const itemCode = (index: number) => `ITEM${String(index + 1).padStart(3, "0")}`;

/** What goes under a heading for a dish; null leaves the cell empty. */
function cellFor(heading: string, item: DraftItem, index: number) {
  const key = normalizeHeading(heading);
  if (key === "itemcode") return itemCode(index);
  if (key.startsWith("offer")) return offerPrice(item);
  if (["itemname", "dishname", "name"].includes(key)) return item.name.trim();
  if (key === "description") return item.description.trim() || null;
  if (key.startsWith("subcategory")) return item.subCategory.trim() || null;
  if (key.startsWith("category")) return item.category.trim();
  if (key === "price" || key === "totalprice") return item.price;
  if (key.startsWith("prep")) return item.prepMinutes;
  if (key === "discounttype")
    return item.discountType ? item.discountType.toUpperCase() : null;
  if (key === "discountpercent")
    return item.discountType === "percent" ? item.discPercent : null;
  if (key === "flatdiscount" || key === "flatamount")
    return item.discountType === "flat" ? item.flatAmount : null;
  if (key === "foodserved" || key === "foodtype")
    return item.foodType ? foodLabel[item.foodType] : null;
  // "Half:120, Full:220", the form the template documents.
  if (key === "qtytypes")
    return item.sizes.length
      ? item.sizes.map((s) => `${s.name}:${s.price}`).join(", ")
      : null;
  if (key === "addons") return "[]";
  if (key.startsWith("available")) return item.available;
  return null;
}

/**
 * Builds the workbook. Pictures go inside the Image cell of each dish's row
 * (a PNG or JPEG anchored there, as Excel's Insert > Pictures does), which is
 * where the server reads them from. SheetJS cannot write pictures, so this
 * uses ExcelJS, the library the server reads the workbook with.
 */
/**
 * What each dish is sent as, one entry per server column, in the server's own
 * names and values (e.g. food_served "Non-Veg", discount_type "PERCENT",
 * qty_types "Half Plate:30, Full Plate:50"). Used to show the vendor exactly
 * what will be saved. Empty values are null.
 */
export function backendFields(
  item: DraftItem,
  layout: TemplateLayout = defaultLayout,
): { field: string; value: string | number | boolean | null }[] {
  const fields: { field: string; value: string | number | boolean | null }[] =
    layout.headers
      .filter((h) => normalizeHeading(h) !== "itemcode")
      .map((field) => ({
        field,
        value:
          normalizeHeading(field) === "image"
            ? item.photo
              ? "embedded picture"
              : null
            : cellFor(field, item, 0),
      }));
  // Add-ons go on their own sheet, one row each, linked by the dish's Item Code.
  const addonSheet = addonsSheetOf(layout);
  if (addonSheet)
    fields.push({
      field: `${addonSheet.name} sheet`,
      value: (item.addons ?? []).length
        ? item.addons
            .map((a) => `${a.name || "?"} ₹${a.price ?? "?"}${a.available ? "" : " (off)"}`)
            .join(", ")
        : null,
    });
  return fields;
}

/** The template's add-ons sheet, when it has one. */
const addonsSheetOf = (layout: TemplateLayout) =>
  layout.otherSheets.find((s) => s.headers.map(normalizeHeading).includes("addonname"));

export async function buildTemplateFile(
  items: DraftItem[],
  layout: TemplateLayout = defaultLayout,
): Promise<File> {
  const { default: ExcelJS } = await import("exceljs"),
    book = new ExcelJS.Workbook(),
    sheet = book.addWorksheet(layout.menuSheet),
    imageColumn = layout.headers.findIndex((h) => normalizeHeading(h) === "image");
  sheet.addRow(layout.headers);
  sheet.getRow(1).font = { bold: true };
  layout.headers.forEach((h, i) => {
    sheet.getColumn(i + 1).width = Math.max(18, h.length + 4);
  });
  for (const [index, item] of items.entries()) {
    const row = sheet.addRow(layout.headers.map((h) => cellFor(h, item, index)));
    if (item.photo && imageColumn >= 0) {
      const id = book.addImage({
        buffer: await item.photo.arrayBuffer(),
        extension: "jpeg",
      });
      row.height = 52;
      // 0-based column and row of the cell the picture's top-left corner sits in.
      sheet.addImage(id, {
        tl: { col: imageColumn, row: row.number - 1 },
        ext: { width: 64, height: 64 },
        editAs: "oneCell",
      });
    }
  }
  const addonLayout = addonsSheetOf(layout);
  for (const other of layout.otherSheets) {
    const extra = book.addWorksheet(other.name);
    extra.addRow(other.headers);
    if (other !== addonLayout) continue;
    const col = (name: string) =>
        other.headers.findIndex((h) => normalizeHeading(h) === name),
      picture = col("image");
    for (const [index, item] of items.entries())
      for (const addon of item.addons ?? []) {
        const values: (string | number | boolean | null)[] = other.headers.map(() => null);
        if (col("itemcode") >= 0) values[col("itemcode")] = itemCode(index);
        if (col("addonname") >= 0) values[col("addonname")] = addon.name.trim();
        if (col("price") >= 0) values[col("price")] = addon.price;
        if (col("isavailable") >= 0) values[col("isavailable")] = addon.available;
        const row = extra.addRow(values);
        if (addon.photo && picture >= 0) {
          const id = book.addImage({
            buffer: await addon.photo.arrayBuffer(),
            extension: "jpeg",
          });
          row.height = 52;
          extra.addImage(id, {
            tl: { col: picture, row: row.number - 1 },
            ext: { width: 64, height: 64 },
            editAs: "oneCell",
          });
        }
      }
  }
  const bytes = await book.xlsx.writeBuffer();
  return new File([bytes], "menu-import.xlsx", {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

/** The vendor's dish for a row the server reported (row 1 is the heading row). */
export const itemForTemplateRow = (items: DraftItem[], row: number) =>
  items[row - 2];

/** The dish and add-on behind a row of the Addons sheet. */
export const addonForTemplateRow = (items: DraftItem[], row: number) =>
  items.flatMap((item) => (item.addons ?? []).map((addon) => ({ item, addon })))[row - 2];
