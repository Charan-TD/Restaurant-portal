"use client";
import { Box, TextField, Typography } from "@mui/material";
import { cardSx, tokens } from "@/core/theme/tokens";
import { CommonButton } from "@/shared/components/actions/CommonButton";
import { describeColumn } from "../import/detectColumns";
import { importFields, type ImportField } from "../import/types";
import type { OwnFileImport } from "../viewmodels/useOwnFileImportViewModel";

const labels: Record<ImportField, string> = {
  name: "Dish name",
  price: "Price",
  category: "Category",
  subCategory: "Sub-category",
  description: "Description",
  prepMinutes: "Prep time (minutes)",
  foodType: "Veg / Non-veg",
  available: "Available",
  discountType: "Discount type",
  discPercent: "Discount %",
  flatAmount: "Flat discount",
  photoFile: "Photo file name",
};
const required: ImportField[] = ["name", "price"];

/** Step 1b: shown only when the headings could not be matched on their own. */
export function ImportColumnsStep({ vm }: { vm: OwnFileImport }) {
  const { detection, sheet, book } = vm;
  if (!detection || !sheet) return null;
  const headings = sheet.rows.find((r) => r.sourceRow === detection.headerRow)?.values ?? [],
    width = Math.max(0, ...sheet.rows.slice(0, 60).map((r) => r.values.length)),
    example = (index: number) => {
      const found = sheet.rows.find(
        (r) => r.sourceRow > detection.headerRow && String(r.values[index] ?? "").trim(),
      );
      return found ? String(found.values[index]).trim().slice(0, 24) : "";
    };
  return (
    <Box sx={{ ...cardSx, p: { xs: 2, md: 3 }, display: "grid", gap: 2 }}>
      <Box>
        <Typography component="h2" sx={{ fontSize: 22, fontWeight: 700 }}>Tell us which column is which</Typography>
        {detection.notes.map((n) => (
          <Typography key={n} sx={{ fontSize: 14, color: tokens.color.textMuted }}>{n}</Typography>
        ))}
      </Box>
      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
        {book && book.sheets.length > 1 && (
          <TextField select size="small" label="Sheet" value={detection.sheetIndex} onChange={(e) => vm.chooseSheet(Number(e.target.value))} slotProps={{ select: { native: true } }} sx={{ minWidth: 200 }}>
            {book.sheets.map((s, i) => <option key={s.name} value={i}>{s.name}</option>)}
          </TextField>
        )}
        <TextField select size="small" label="Headings are in row" value={detection.headerRow} onChange={(e) => vm.chooseHeaderRow(Number(e.target.value))} slotProps={{ select: { native: true } }} sx={{ minWidth: 200 }}>
          <option value={0}>No heading row</option>
          {sheet.rows.slice(0, 20).map((r) => <option key={r.sourceRow} value={r.sourceRow}>Row {r.sourceRow}</option>)}
        </TextField>
      </Box>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 1.5 }}>
        {importFields.map((field) => (
          <TextField
            key={field}
            select
            size="small"
            label={labels[field] + (required.includes(field) ? " *" : "")}
            value={detection.mapping[field] ?? ""}
            error={required.includes(field) && detection.mapping[field] === null}
            onChange={(e) => vm.setMapping({ ...detection.mapping, [field]: e.target.value === "" ? null : Number(e.target.value) })}
            slotProps={{ select: { native: true }, inputLabel: { shrink: true } }}
          >
            <option value="">Not in my file</option>
            {Array.from({ length: width }, (_, i) => (
              <option key={i} value={i}>
                {describeColumn(headings, i)}
                {example(i) && ` — e.g. ${example(i)}`}
              </option>
            ))}
          </TextField>
        ))}
      </Box>
      {vm.mapProblem && (
        <Typography role="alert" sx={{ fontSize: 13, color: tokens.color.error }}>{vm.mapProblem}</Typography>
      )}
      {vm.problem && (
        <Typography role="alert" sx={{ fontSize: 13, color: tokens.color.error }}>{vm.problem}</Typography>
      )}
      <Box sx={{ display: "flex", gap: 1.5 }}>
        <CommonButton variant="outlined" onClick={vm.reset}>Choose another file</CommonButton>
        <CommonButton variant="contained" disabled={!vm.canExtract} onClick={vm.extract}>
          Extract menu items ({detection.records} rows)
        </CommonButton>
      </Box>
    </Box>
  );
}
