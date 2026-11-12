// Framework-free model for importing a vendor's own spreadsheet. Nothing here
// imports React or the app, so the logic can be tested on its own.
export type RawValue = string | number | boolean | null;
/** One spreadsheet row; `sourceRow` is the real 1-based row number. */
export interface RawRow {
  sourceRow: number;
  values: RawValue[];
}
export interface RawSheet {
  name: string;
  rows: RawRow[];
}
export interface RawWorkbook {
  filename: string;
  size: number;
  sheets: RawSheet[];
}

/** The dish details a spreadsheet column can supply. */
export const importFields = [
  "name",
  "price",
  "category",
  "subCategory",
  "description",
  "prepMinutes",
  "foodType",
  "available",
  "discountType",
  "discPercent",
  "flatAmount",
  "photoFile",
] as const;
export type ImportField = (typeof importFields)[number];
/** The column (0-based) each detail is read from; null when no column holds it. */
export type ColumnMapping = Record<ImportField, number | null>;

export const emptyMapping = (): ColumnMapping =>
  Object.fromEntries(importFields.map((f) => [f, null])) as ColumnMapping;

export type ImportFoodType = "Veg" | "Non-veg" | "Egg" | "";

/** One dish read from the sheet, before it is sent. Bad values stay visible so the vendor can fix them. */
export interface DraftItem {
  id: string;
  /** The row it came from, 0 for a dish added by hand. */
  sourceRow: number;
  name: string;
  category: string;
  subCategory: string;
  price: number | null;
  prepMinutes: number | null;
  foodType: ImportFoodType;
  /** What the sheet held when it is not a food type we know, kept for review. */
  foodTypeText: string;
  description: string;
  available: boolean;
  discountType: "percent" | "flat" | null;
  discPercent: number;
  flatAmount: number;
  /** Half / Full style prices, when the sheet has one column per size. */
  sizes: { name: string; price: number }[];
  /** The picture file the sheet names for this dish, used to match uploaded photos. */
  photoFile: string;
  /** The dish's picture (a JPEG, resized); the server requires one per dish. */
  photo: File | null;
  /** The sheet this dish came from and everything its row held, for the More details view. */
  sourceSheet: string;
  original: { heading: string; value: string }[];
  /** Extras offered with this dish. */
  addons: DraftAddon[];
}

/** An extra offered with a dish (the server's "Addons" sheet), e.g. Raita for ₹20. */
export interface DraftAddon {
  id: string;
  name: string;
  price: number | null;
  available: boolean;
  /** Optional picture, a resized JPEG. */
  photo: File | null;
}

/** Add-on rows one import takes (the server's limit). */
export const MAX_ADDON_ROWS = 5000;

export interface ImportIssue {
  itemId: string;
  field:
    | "name"
    | "category"
    | "price"
    | "prepMinutes"
    | "foodType"
    | "photo"
    | "discount"
    | "sizes"
    | "addons";
  message: string;
}

/** The most dishes one import takes (the server's limit). */
export const MAX_IMPORT_ROWS = 500;
/** The largest file the server accepts. */
export const MAX_IMPORT_BYTES = 5 * 1024 * 1024;
