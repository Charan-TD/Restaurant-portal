import type { RawRow, RawValue, RawWorkbook } from "./types";

/**
 * Reads an .xlsx, .xls or .csv file in the browser. Every cell is kept as it
 * is (formulas use their saved value) and rows keep their real row numbers.
 * SheetJS is loaded only when a file is chosen, so it stays out of the main bundle.
 */
export async function readSpreadsheet(file: File): Promise<RawWorkbook> {
  if (!/\.(xlsx|xls|csv)$/i.test(file.name))
    throw new Error("Choose an .xlsx, .xls or .csv file.");
  if (!file.size) throw new Error("This file is empty.");
  const XLSX = await import("xlsx"),
    bytes = new Uint8Array(await file.arrayBuffer());
  let book;
  try {
    if (/\.xlsx$/i.test(file.name) && bytes[0] !== 0x50)
      throw new Error("Not an xlsx file");
    if (/\.csv$/i.test(file.name)) {
      // Decode here so ₹ survives and the byte-order mark is dropped.
      const encoding =
        bytes[0] === 0xff && bytes[1] === 0xfe
          ? "utf-16le"
          : bytes[0] === 0xfe && bytes[1] === 0xff
            ? "utf-16be"
            : "utf-8";
      book = XLSX.read(new TextDecoder(encoding).decode(bytes), {
        type: "string",
        raw: true,
      });
    } else {
      book = XLSX.read(bytes, { type: "array", raw: true, cellDates: false });
    }
  } catch {
    throw new Error(
      "The spreadsheet could not be read. Check that it is a valid Excel or CSV file without a password.",
    );
  }
  const sheets = book.SheetNames.map((name) => {
    const sheet = book.Sheets[name],
      rows: RawRow[] = [];
    if (!sheet?.["!ref"]) return { name, rows };
    const range = XLSX.utils.decode_range(sheet["!ref"]);
    for (let r = range.s.r; r <= range.e.r; r++) {
      const values: RawValue[] = [];
      for (let c = 0; c <= range.e.c; c++) {
        const cell = sheet[XLSX.utils.encode_cell({ r, c })]?.v;
        values.push(cell === undefined ? null : (cell as RawValue));
      }
      rows.push({ sourceRow: r + 1, values });
    }
    return { name, rows };
  });
  const hasCells = sheets.some((s) =>
    s.rows.some((r) => r.values.some((v) => v !== null && v !== "")),
  );
  if (!hasCells) throw new Error("No usable cells were found in this file.");
  return { filename: file.name, size: file.size, sheets };
}
