import { normalizeHeading } from "./detectColumns";
import type { RawWorkbook } from "./types";

/**
 * True when a sheet has the server template's headings (Item Name and price),
 * so the server can read the file as it is. Any other layout needs its
 * columns matched first.
 */
export const isTemplateWorkbook = (book: RawWorkbook) =>
  book.sheets.some((sheet) => {
    const first = sheet.rows.find((r) => r.values.some((v) => v !== null && String(v).trim() !== ""));
    const headings = (first?.values ?? []).map(normalizeHeading);
    return headings.includes("itemname") && headings.includes("price");
  });

// A file chosen in the template dialog that is not in the template's layout,
// waiting for the own-file import page to pick it up.
let pending: File | null = null;
export const handOffFile = (file: File) => {
  pending = file;
};
/** The handed-over file, once; null when there is none. */
export const takeHandedOffFile = () => {
  const file = pending;
  pending = null;
  return file;
};
