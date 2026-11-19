import {
  emptyMapping,
  importFields,
  type ColumnMapping,
  type ImportField,
  type RawRow,
  type RawSheet,
  type RawValue,
  type RawWorkbook,
} from "./types";
import {
  looksLikeSize,
  parseAvailability,
  parseNamedPrices,
  parsePrice,
} from "./parse";

// ── Headings ────────────────────────────────────────────────────────────────
// Headings are lower-cased with brackets, currency words and punctuation
// removed, so "Price (INR)" and "Dish Name" compare as "price" and "dishname".
// A heading is first looked up whole (aliases), then by the words it contains
// (keywords), so "Name of the dish" and "Item Category" are understood too.
const aliases: Record<ImportField, string[]> = {
  name: [
    "itemname", "name", "food", "dish", "product", "item", "dishname",
    "foodname", "fooditem", "dishfooditem", "dishitem", "menuitem",
    "menuitemname", "productname", "particulars", "fooddish", "dishfood",
    "itemdish", "fooditemname", "dishes", "items", "menu",
  ],
  price: [
    "totalprice", "price", "rate", "cost", "amount", "sellingprice",
    "itemprice", "menuprice", "mrp", "sp", "saleprice", "dishprice",
  ],
  category: [
    "category", "group", "section", "menusection", "menucategory",
    "categoryname", "menugroup", "cuisine", "course", "typeofdish",
    "classification", "class", "itemcategory", "dishcategory",
  ],
  subCategory: ["subcategory", "subcategoryname", "subgroup", "subsection", "subcat"],
  description: [
    "description", "details", "notes", "itemdetails", "itemdescription",
    "fooddescription", "extrainfo", "info", "moreinfo", "additionalinfo",
    "remarks", "about", "ingredients", "desc",
  ],
  prepMinutes: [
    "preparationtimeminutes", "preparationtime", "preptime", "prepminutes",
    "cookingtime", "preptimeinminutes", "preptimemin", "readyin", "time",
    "timetaken", "servingtime",
  ],
  foodType: [
    "foodserved", "foodtype", "type", "diet", "dietarytype", "vegnonveg",
    "vegnveg", "vegornonveg", "foodchoice", "foodpreference", "veg",
    "vegnonvegegg", "isveg", "nonveg",
  ],
  available: [
    "ownerisavailable", "available", "availability", "isavailable",
    "availablenow", "instock", "stock", "active", "isactive", "enabled",
  ],
  discountType: ["discounttype", "offertype"],
  discPercent: ["discpercent", "discountpercent", "discountpercentage", "discount", "off", "offerpercent"],
  flatAmount: ["flatamount", "flatdiscount", "discountamount", "flatoff"],
  photoFile: [
    "photofile", "photo", "photoname", "imagefile", "image", "imagename",
    "picture", "picturefile", "filename", "img", "imgfile", "photos", "images",
  ],
  quantity: [
    "quantity", "qty", "qtytype", "qtytypes", "quantitytype", "quantitytypes",
    "size", "sizes", "portion", "portions", "portionsize", "servingsize",
    "serving", "serves", "variant", "variants", "platesize", "unit", "units",
    "sizedetails", "sizeprices", "sizesandprices", "portiondetails",
    "quantitydetails", "variantdetails", "sizeoptions",
  ],
  addons: [
    "addons", "addon", "extras", "toppings", "topping", "addonitems",
    "addonsextras", "customisations", "customizations", "addonswithprice",
    "addonchoices", "addondetails", "addonoptions", "optionaladdons", "extrachoices",
  ],
};

// Words found inside a heading. "name" is the weakest: "Category Name" is a category.
const keywords: Record<ImportField, string[]> = {
  name: ["dish", "item", "food", "product", "name", "particular"],
  price: ["price", "rate", "cost", "mrp", "amount"],
  category: ["category", "section", "group", "cuisine", "course"],
  subCategory: ["subcategory", "subcat", "subgroup", "subsection"],
  description: ["description", "desc", "detail", "info", "note", "remark", "ingredient"],
  prepMinutes: ["prep", "preparation", "cooking", "readyin", "duration", "time", "minutes", "mins"],
  foodType: ["veg", "diet", "foodtype", "foodserved"],
  available: ["avail", "stock", "active", "enabled"],
  discountType: ["discounttype", "offertype"],
  discPercent: ["percent", "discount"],
  flatAmount: ["flat"],
  photoFile: ["photo", "image", "picture", "img", "pic"],
  quantity: ["qty", "quantity", "size", "portion", "serving", "variant"],
  addons: ["addon", "extra", "topping", "customi"],
};

// Serial numbers, codes and tax columns are never a dish detail.
const ignored = /(code|sku|hsn|barcode|gst|tax|vat|cgst|sgst|id)$|^(s|sl|sr|serial)(no|num|number)?$|^(no|num|number|index|serialnumber)$/;

const isBlank = (v: RawValue | undefined) =>
  v === null || v === undefined || String(v).trim() === "";

export function normalizeHeading(heading: RawValue): string {
  return String(heading ?? "")
    .toLowerCase()
    .replace(/\([^)]*\)|\[[^\]]*\]/g, "")
    .replace(/\b(inr|usd|eur|rupees|rs)\b/g, "")
    .replace(/[^a-z0-9]/g, "");
}

/** The detail a heading names, and whether it was an exact (whole-heading) match. */
export function fieldForHeading(
  heading: RawValue,
): { field: ImportField; exact: boolean } | null {
  const key = normalizeHeading(heading);
  if (!key) return null;
  for (const field of importFields)
    if (aliases[field].includes(key)) return { field, exact: true };
  if (ignored.test(key)) return null;
  const found = importFields
    .flatMap((field) =>
      keywords[field]
        .filter((word) => key.includes(word))
        .map((word) => ({ field, length: word.length })),
    )
    .sort((a, b) => b.length - a.length);
  // Any other detail beats the dish name: "Item Price" is a price.
  const best = found.find((f) => f.field !== "name") ?? found[0];
  if (!best) return null;
  // Two details matched by equally long words: too unclear to guess.
  if (found.some((f) => f.field !== best.field && f.field !== "name" && f.length === best.length))
    return null;
  return { field: best.field, exact: false };
}

/** Columns whose heading names the field: exact headings first, otherwise headings that contain one of its words. */
export function matchingColumns(headings: RawValue[], field: ImportField, skip: number[] = []) {
  const matched = headings.flatMap((h, i) => {
      const found = skip.includes(i) ? null : fieldForHeading(h);
      return found?.field === field ? [{ index: i, exact: found.exact }] : [];
    }),
    exact = matched.filter((m) => m.exact);
  return (exact.length ? exact : matched).map((m) => m.index);
}

/** The first column with a known heading for each field. */
export function suggestMapping(headings: RawValue[]): ColumnMapping {
  const mapping = emptyMapping(),
    sizes = sizePriceColumns(headings);
  for (const field of importFields)
    mapping[field] = matchingColumns(headings, field, sizes)[0] ?? null;
  return mapping;
}

const sizePattern =
  /^(?:price|rate|cost)?(half|full|quarter|small|medium|large|regular|single|double|mini|jumbo|family)(?:plate|price|portion|size|rate|serving|qty)?$/;

/** Columns priced per size ("Half Plate" / "Full Plate", "Small" / "Large"); two or more make a set. */
export function sizePriceColumns(headings: RawValue[]): number[] {
  const found = headings.flatMap((h, i) =>
    sizePattern.test(
      String(h ?? "")
        .toLowerCase()
        .replace(/(inr|usd|eur|rupees|rs)/g, "")
        .replace(/[^a-z0-9]/g, ""),
    )
      ? [i]
      : [],
  );
  return found.length >= 2 ? found : [];
}

export const columnLetter = (index: number): string =>
  (index >= 26 ? columnLetter(Math.floor(index / 26) - 1) : "") +
  String.fromCharCode(65 + (index % 26));

/** "B (“Dish Name”)": how a column is named to the vendor. */
export function describeColumn(headings: RawValue[], index: number) {
  const heading = headings[index];
  return isBlank(heading)
    ? columnLetter(index)
    : `${columnLetter(index)} (“${String(heading).trim()}”)`;
}

// ── Guessing from values ────────────────────────────────────────────────────
interface Profile {
  index: number;
  filled: number;
  numeric: boolean;
  serial: boolean;
  unique: number;
  avgLength: number;
  /** The share of filled cells that pass a test. */
  share: (test: (cell: RawValue) => boolean) => number;
}

function profile(rows: RawRow[], index: number): Profile {
  const cells = rows
      .map((r) => r.values[index])
      .filter((v) => !isBlank(v)) as Exclude<RawValue, null>[],
    prices = cells.map((v) => parsePrice(v)),
    numeric =
      cells.length > 0 &&
      prices.filter((p) => p !== null).length / cells.length >= 0.8,
    // 1, 2, 3 … is a serial number, not a price.
    serial =
      numeric &&
      cells.length > 1 &&
      prices.every(
        (p, i) =>
          p !== null && Number.isInteger(p) && (i === 0 || p === prices[i - 1]! + 1),
      ),
    texts = cells.map((v) => String(v).trim().toLowerCase());
  return {
    index,
    filled: rows.length ? cells.length / rows.length : 0,
    numeric,
    serial,
    unique: texts.length ? new Set(texts).size / texts.length : 0,
    avgLength: texts.length
      ? texts.reduce((n, t) => n + t.length, 0) / texts.length
      : 0,
    share: (test) =>
      cells.length ? cells.filter((c) => test(c)).length / cells.length : 0,
  };
}

const foodTypeWords = new Set([
  "veg", "v", "pureveg", "vegetarian", "nonveg", "nv", "nonvegetarian",
  "egg", "eggetarian", "containsegg", "vegan", "jain",
]);
const isFoodTypeWord = (cell: RawValue) =>
  foodTypeWords.has(String(cell).toLowerCase().replace(/[^a-z]/g, ""));
const isAvailabilityWord = (cell: RawValue) =>
  typeof parseAvailability(cell) === "boolean";
const isPhotoFile = (cell: RawValue) =>
  /\.(jpe?g|png|webp|gif|bmp|heic|avif)$/i.test(String(cell).trim());
const isMinutes = (cell: RawValue) =>
  /^\d+\s*(?:min|mins|minutes|m)\.?$/i.test(String(cell).trim());
/** "Half:120, Full:220" or "Raita 20, Papad 10": a list of names with prices. */
const isPriceList = (cell: RawValue) => {
  const parts = parseNamedPrices(cell);
  return (
    parts.some((p) => p.price !== null) &&
    (parts.length >= 2 || /[:=]/.test(String(cell)))
  );
};

/** Fills only the fields still unmapped, from what the cells look like. Never reuses a column. */
function inferColumns(
  dataRows: RawRow[],
  start: ColumnMapping,
  describe: (index: number) => string,
  skip: number[],
) {
  const rows = dataRows.filter((r) => r.values.some((v) => !isBlank(v))),
    width = Math.max(0, ...rows.map((r) => r.values.length)),
    used = new Set([...Object.values(start).filter((v) => v !== null), ...skip]),
    profiles = Array.from({ length: width }, (_, i) => profile(rows, i)).filter(
      (p) => p.filled > 0,
    ),
    mapping = { ...start },
    notes: string[] = [],
    free = (p: Profile) => !used.has(p.index),
    take = (field: ImportField, p: Profile | undefined) => {
      if (p && mapping[field] === null && free(p)) {
        mapping[field] = p.index;
        used.add(p.index);
      }
    };
  const firstFree = (test: (p: Profile) => boolean) =>
    profiles.filter((p) => free(p) && test(p)).sort((a, b) => b.filled - a.filled)[0];

  // Columns whose values say what they are, before anything is guessed by shape.
  take("available", firstFree((p) => p.share(isAvailabilityWord) >= 0.8 && p.unique < 1));
  take("photoFile", firstFree((p) => p.share(isPhotoFile) >= 0.8));
  take("prepMinutes", firstFree((p) => p.share(isMinutes) >= 0.8));
  take("foodType", firstFree((p) => !p.numeric && p.share(isFoodTypeWord) >= 0.8));
  const lists = profiles.filter((p) => free(p) && p.share(isPriceList) >= 0.5);
  for (const p of lists) {
    const names = rows.flatMap((r) => parseNamedPrices(r.values[p.index]).map((n) => n.name)),
      sizes = names.filter(looksLikeSize).length / Math.max(1, names.length);
    take(sizes >= 0.6 ? "quantity" : "addons", p);
  }

  const priceColumns = profiles
    .filter((p) => free(p) && p.numeric && !p.serial)
    // The fullest column is the price; on a tie the right-most (Full after Half).
    .sort((a, b) => b.filled - a.filled || b.index - a.index)
    .map((p) => p.index);
  if (mapping.price === null) {
    take("price", profiles.find((p) => p.index === priceColumns[0]));
    if (priceColumns.length > 1)
      notes.push(
        `Columns ${priceColumns.map(describe).join(" and ")} all hold numbers. ${describe(priceColumns[0])} was used as the price because it is filled for the most dishes.`,
      );
  }
  const text = () => profiles.filter((p) => !p.numeric && free(p));
  take(
    "name",
    text()
      .filter((p) => p.filled >= 0.8 && p.unique >= 0.8)
      .sort((a, b) => b.unique - a.unique || a.index - b.index)[0],
  );
  take(
    "category",
    text()
      .filter((p) => p.unique <= 0.5 && p.avgLength <= 30 && rows.length > 1)
      .sort((a, b) => a.index - b.index)[0],
  );
  take(
    "description",
    text()
      .filter((p) => p.avgLength >= 8)
      .sort((a, b) => b.avgLength - a.avgLength)[0],
  );
  return { mapping, notes };
}

// ── Choosing the sheet, heading row and columns ─────────────────────────────
export interface Detection {
  sheetIndex: number;
  /** The heading row; 0 means the sheet has none and data starts at row 1. */
  headerRow: number;
  mapping: ColumnMapping;
  /** True when the headings alone named the dish name and price. */
  automatic: boolean;
  recognized: number;
  records: number;
  /** What the vendor should know about how the columns were read. */
  notes: string[];
}

const dataRowsAfter = (sheet: RawSheet, headerRow: number) =>
  sheet.rows.filter((r) => r.sourceRow > headerRow);
const countRecords = (rows: RawRow[]) =>
  rows.filter((r) => r.values.some((v) => !isBlank(v))).length;

/**
 * A heading row holds words, not prices, and its words do not repeat in the
 * rows below: a "Veg" that also appears further down its column is data.
 */
const couldBeHeadings = (row: RawRow, sheet: RawSheet) => {
  const cells = row.values.filter((v) => !isBlank(v));
  if (!cells.length || cells.some((v) => typeof v === "number" || parsePrice(v) !== null))
    return false;
  const text = (v: RawValue | undefined) => String(v ?? "").trim().toLowerCase(),
    below = sheet.rows.filter((r) => r !== row).slice(0, 200),
    found = row.values.flatMap((v, i) => {
      const f = isBlank(v) ? null : fieldForHeading(v);
      return f && !below.some((r) => text(r.values[i]) === text(v)) ? [f] : [];
    });
  // One exact heading, or two that contain a known word.
  return found.some((f) => f.exact) || found.length >= 2;
};

export function detectSheet(sheet: RawSheet, sheetIndex = 0): Detection {
  // Each of the first 50 rows is tried as the heading row.
  const candidates = sheet.rows
    .slice(0, 50)
    .filter((row) => couldBeHeadings(row, sheet))
    .map((row) => {
      const sizes = sizePriceColumns(row.values),
        mapping = suggestMapping(row.values),
        recognized = Object.values(mapping).filter((v) => v !== null).length,
        prices = matchingColumns(row.values, "price", sizes),
        automatic =
          matchingColumns(row.values, "name", sizes).length === 1 &&
          (prices.length === 1 || (!prices.length && sizes.length > 0)),
        dataRows = dataRowsAfter(sheet, row.sourceRow);
      if (prices.length === 1) mapping.price = prices[0];
      else if (!prices.length && sizes.length) {
        // The main price is the size filled for the most dishes; on a tie the right-most.
        const filled = (i: number) =>
          dataRows.filter((r) => !isBlank(r.values[i])).length;
        mapping.price = [...sizes].sort(
          (a, b) => filled(b) - filled(a) || b - a,
        )[0];
      }
      return {
        sheetIndex,
        headerRow: row.sourceRow,
        mapping,
        automatic,
        recognized,
        records: countRecords(dataRows),
        notes: [] as string[],
      };
    });
  candidates.sort(
    (a, b) =>
      Number(b.automatic) - Number(a.automatic) ||
      b.recognized - a.recognized ||
      a.headerRow - b.headerRow,
  );
  return completeDetection(sheet, sheetIndex, candidates[0]);
}

/**
 * Fills the details the headings did not name from what the cells hold, so
 * every file goes straight to the dishes. Anything still not found is left
 * empty and shows as missing on each dish.
 */
function completeDetection(
  sheet: RawSheet,
  sheetIndex: number,
  best: Detection | undefined,
): Detection {
  const headerless = !best,
    headerRow = best?.headerRow ?? 0,
    headings = sheet.rows.find((r) => r.sourceRow === headerRow)?.values ?? [],
    describe = (i: number) => describeColumn(headings, i),
    sizes = sizePriceColumns(headings),
    start = best ? { ...best.mapping } : emptyMapping(),
    notes: string[] = [];
  if (headerless)
    notes.push("No heading row was found, so the columns were read from their values.");
  else if (!best.automatic)
    for (const field of ["name", "price"] as const) {
      let found = matchingColumns(headings, field, sizes);
      if (field === "name" && found.length > 1) {
        // "Product" and "Food" can both mean the dish name; a column of
        // Veg / Non Veg values is the food type, not the name.
        const rows = dataRowsAfter(sheet, headerRow),
          diet = found.filter((i) => profile(rows, i).share(isFoodTypeWord) >= 0.8);
        if (diet.length && start.foodType === null) start.foodType = diet[0];
        found = found.filter((i) => !diet.includes(i));
        if (found.length === 1) start.name = found[0];
      }
      if (found.length > 1) {
        start[field] = null;
        notes.push(
          `More than one column looks like the ${field === "name" ? "dish name" : "price"} (${found.map(describe).join(", ")}), so it was chosen from the values.`,
        );
      }
    }
  // Size columns are read as sizes; they are never another detail.
  const sizeSkip = sizes.filter((i) => i !== start.price);
  const dataRows = dataRowsAfter(sheet, headerRow),
    inferred = inferColumns(dataRows, start, describe, sizeSkip);
  notes.push(...inferred.notes);
  return {
    sheetIndex,
    headerRow,
    mapping: inferred.mapping,
    automatic: !!best?.automatic,
    recognized: Object.values(inferred.mapping).filter((v) => v !== null).length,
    records: countRecords(dataRows),
    notes,
  };
}

/** The sheet most likely to be the menu: clear headings first, then the most dishes. */
export function detectWorkbook(book: RawWorkbook): Detection {
  return book.sheets
    .map(detectSheet)
    .sort(
      (a, b) =>
        Number(b.automatic && b.records > 0) -
          Number(a.automatic && a.records > 0) ||
        Number(b.records > 0) - Number(a.records > 0) ||
        b.recognized - a.recognized ||
        b.records - a.records ||
        a.sheetIndex - b.sheetIndex,
    )[0];
}

/** Each detail and the column it was read from, plus the columns nothing was read from. */
export function describeDetection(sheet: RawSheet, detection: Detection) {
  const headings =
      sheet.rows.find((r) => r.sourceRow === detection.headerRow)?.values ?? [],
    sizes = sizePriceColumns(headings),
    used = new Set([
      ...Object.values(detection.mapping).filter((v) => v !== null),
      ...sizes,
    ]),
    width = Math.max(0, ...sheet.rows.map((r) => r.values.length)),
    filled = (i: number) =>
      dataRowsAfter(sheet, detection.headerRow).some((r) => !isBlank(r.values[i]));
  return {
    found: importFields.flatMap((field) =>
      detection.mapping[field] === null
        ? []
        : [{ field, column: describeColumn(headings, detection.mapping[field]!) }],
    ),
    sizes: sizes.length >= 2 ? sizes.map((i) => describeColumn(headings, i)) : [],
    unused: Array.from({ length: width }, (_, i) => i)
      .filter((i) => !used.has(i) && filled(i))
      .map((i) => describeColumn(headings, i)),
  };
}
