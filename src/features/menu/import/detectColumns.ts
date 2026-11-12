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
import { parsePrice } from "./parse";

// ── Headings ────────────────────────────────────────────────────────────────
// Headings are lower-cased with brackets, currency words and punctuation
// removed, so "Price (INR)" and "Dish Name" compare as "price" and "dishname".
const aliases: Record<ImportField, string[]> = {
  name: [
    "itemname", "name", "food", "dish", "product", "item", "dishname",
    "foodname", "fooditem", "dishfooditem", "dishitem", "menuitem",
    "menuitemname", "productname", "particulars",
  ],
  price: [
    "totalprice", "price", "rate", "cost", "amount", "sellingprice",
    "itemprice", "menuprice", "mrp",
  ],
  category: [
    "category", "group", "section", "menusection", "menucategory",
    "categoryname", "menugroup",
  ],
  subCategory: ["subcategory", "subcategoryname", "subgroup", "subsection"],
  description: [
    "description", "details", "notes", "itemdetails", "itemdescription",
    "fooddescription",
  ],
  prepMinutes: [
    "preparationtimeminutes", "preparationtime", "preptime", "prepminutes",
    "cookingtime", "preptimeinminutes", "preptimemin",
  ],
  foodType: [
    "foodserved", "foodtype", "type", "diet", "dietarytype", "vegnonveg",
    "vegnveg", "vegornonveg",
  ],
  available: [
    "ownerisavailable", "available", "availability", "isavailable",
    "availablenow",
  ],
  discountType: ["discounttype"],
  discPercent: ["discpercent", "discountpercent", "discountpercentage"],
  flatAmount: ["flatamount", "flatdiscount"],
  photoFile: [
    "photofile", "photo", "photoname", "imagefile", "image", "imagename",
    "picture", "picturefile", "filename", "img", "imgfile",
  ],
};

const isBlank = (v: RawValue | undefined) =>
  v === null || v === undefined || String(v).trim() === "";

export function normalizeHeading(heading: RawValue): string {
  return String(heading ?? "")
    .toLowerCase()
    .replace(/\([^)]*\)|\[[^\]]*\]/g, "")
    .replace(/\b(inr|usd|eur|rupees|rs)\b/g, "")
    .replace(/[^a-z0-9]/g, "");
}

/** Columns whose heading is a known name for the field. */
export function matchingColumns(headings: RawValue[], field: ImportField) {
  return headings.flatMap((h, i) =>
    aliases[field].includes(normalizeHeading(h)) ? [i] : [],
  );
}

/** The first column with a known heading for each field. */
export function suggestMapping(headings: RawValue[]): ColumnMapping {
  const mapping = emptyMapping();
  for (const field of importFields) {
    const found = matchingColumns(headings, field)[0];
    mapping[field] = found ?? null;
  }
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
  };
}

/** Fills only the fields still unmapped, from what the cells look like. Never reuses a column. */
function inferColumns(
  dataRows: RawRow[],
  start: ColumnMapping,
  describe: (index: number) => string,
) {
  const rows = dataRows.filter((r) => r.values.some((v) => !isBlank(v))),
    width = Math.max(0, ...rows.map((r) => r.values.length)),
    used = new Set(Object.values(start).filter((v) => v !== null)),
    profiles = Array.from({ length: width }, (_, i) => profile(rows, i)).filter(
      (p) => p.filled > 0,
    ),
    mapping = { ...start },
    notes: string[] = [],
    free = (p: Profile) => !used.has(p.index),
    take = (field: ImportField, p: Profile | undefined) => {
      if (p && mapping[field] === null) {
        mapping[field] = p.index;
        used.add(p.index);
      }
    };
  const priceColumns = profiles
    .filter((p) => p.numeric && !p.serial)
    // The fullest column is the price; on a tie the right-most (Full after Half).
    .sort((a, b) => b.filled - a.filled || b.index - a.index)
    .map((p) => p.index);
  if (mapping.price === null) {
    const candidates = priceColumns.filter((i) => !used.has(i));
    take("price", profiles.find((p) => p.index === candidates[0]));
    if (candidates.length > 1)
      notes.push(
        `Columns ${candidates.map(describe).join(" and ")} all hold prices. ${describe(candidates[0])} was chosen because it is filled for the most dishes; change it below if needed.`,
      );
  }
  const text = profiles.filter((p) => !p.numeric && free(p));
  take(
    "name",
    text
      .filter((p) => p.filled >= 0.8 && p.unique >= 0.8)
      .sort((a, b) => b.unique - a.unique || a.index - b.index)[0],
  );
  take(
    "category",
    text
      .filter(
        (p) => free(p) && p.unique <= 0.5 && p.avgLength <= 30 && rows.length > 1,
      )
      .sort((a, b) => a.index - b.index)[0],
  );
  take(
    "description",
    text
      .filter((p) => free(p) && p.avgLength > 0)
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
  /** True when the headings were clear and the vendor need not confirm columns. */
  automatic: boolean;
  recognized: number;
  records: number;
  notes: string[];
}

const dataRowsAfter = (sheet: RawSheet, headerRow: number) =>
  sheet.rows.filter((r) => r.sourceRow > headerRow);
const countRecords = (rows: RawRow[]) =>
  rows.filter((r) => r.values.some((v) => !isBlank(v))).length;

export function detectSheet(sheet: RawSheet, sheetIndex = 0): Detection {
  // Each of the first 50 rows is tried as the heading row.
  const candidates = sheet.rows.slice(0, 50).map((row) => {
    const mapping = suggestMapping(row.values),
      recognized = Object.values(mapping).filter((v) => v !== null).length,
      sizes = sizePriceColumns(row.values),
      prices = matchingColumns(row.values, "price").filter(
        (i) => !sizes.includes(i),
      ),
      automatic =
        matchingColumns(row.values, "name").length === 1 &&
        (prices.length === 1 || (!prices.length && sizes.length > 0)),
      dataRows = dataRowsAfter(sheet, row.sourceRow);
    if (prices.length === 1) mapping.price = prices[0];
    else if (sizes.length) {
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
  const best = candidates[0];
  return best?.automatic ? best : withInferredColumns(sheet, sheetIndex, best);
}

/** Headings were missing or unclear: pre-fill the column choices from the cell values. */
function withInferredColumns(
  sheet: RawSheet,
  sheetIndex: number,
  best: Detection | undefined,
): Detection {
  // No heading recognised anywhere: the file most likely has no heading row.
  const headerless = !best || best.recognized === 0,
    headerRow = headerless ? 0 : best.headerRow,
    headings = sheet.rows.find((r) => r.sourceRow === headerRow)?.values ?? [],
    describe = (i: number) => describeColumn(headings, i),
    start = headerless ? emptyMapping() : { ...best.mapping },
    notes: string[] = [];
  if (headerless)
    notes.push("This file has no heading row, so the columns were matched from their values.");
  else {
    for (const field of ["name", "price"] as const) {
      const found = matchingColumns(headings, field);
      if (found.length > 1) {
        start[field] = null;
        notes.push(
          `More than one column looks like the ${field === "name" ? "dish name" : "price"}: ${found.map(describe).join(", ")}.`,
        );
      } else if (!found.length)
        notes.push(
          `No heading was recognised as the ${field === "name" ? "dish name" : "price"}.`,
        );
    }
  }
  const dataRows = dataRowsAfter(sheet, headerRow),
    inferred = inferColumns(dataRows, start, describe);
  notes.push(...inferred.notes);
  const missing = (["name", "price"] as const)
    .filter((f) => inferred.mapping[f] === null)
    .map((f) => (f === "name" ? "dish name" : "price"));
  notes.push(
    missing.length
      ? `Choose the ${missing.join(" and ")} column below.`
      : "Check the columns below, then continue.",
  );
  return {
    sheetIndex,
    headerRow,
    mapping: inferred.mapping,
    automatic: false,
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
        b.recognized - a.recognized ||
        b.records - a.records ||
        a.sheetIndex - b.sheetIndex,
    )[0];
}

/** A mapped column used twice would copy one column into two details. */
export function mappingProblem(mapping: ColumnMapping): string | null {
  const chosen = Object.values(mapping).filter((v) => v !== null);
  return new Set(chosen).size !== chosen.length
    ? "Each column can only be used for one detail."
    : null;
}
