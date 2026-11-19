"use client";
import { Box, TextField, Typography } from "@mui/material";
import { tokens } from "@/core/theme/tokens";
import { importFieldLabels, type ImportField } from "../import/types";
import type { OwnFileImport } from "../viewmodels/useOwnFileImportViewModel";

/** Details every dish must have; when no column holds one, the vendor fills it in on the dishes. */
const required: ImportField[] = ["name", "price", "category", "prepMinutes", "foodType"];

/**
 * Which column each detail was read from, shown above the dishes instead of a
 * separate column-setup step. Details not found are listed so the vendor knows
 * to fill them in; the dishes already show them as missing.
 */
export function ImportColumnsSummary({ vm }: { vm: OwnFileImport }) {
  const { book, sheet, detection, columns } = vm;
  if (!book || !sheet || !detection || !columns) return null;
  const sizesFound = columns.sizes.length > 0,
    missing = required.filter(
      (f) => detection.mapping[f] === null && !(f === "price" && sizesFound),
    );
  return (
    <Box sx={{ p: 1.5, borderRadius: tokens.radius.input, bgcolor: tokens.color.sunken, fontSize: 13, display: "grid", gap: 1 }}>
      <Box sx={{ display: "flex", gap: 1.5, alignItems: "center", flexWrap: "wrap" }}>
        <span>{book.filename}</span>
        {book.sheets.length > 1 ? (
          <TextField
            select
            size="small"
            label="Sheet"
            value={detection.sheetIndex}
            onChange={(e) => vm.chooseSheet(Number(e.target.value))}
            slotProps={{ select: { native: true } }}
            sx={{ minWidth: 180, bgcolor: tokens.color.card }}
          >
            {book.sheets.map((s, i) => <option key={`${s.name}-${i}`} value={i}>{s.name}</option>)}
          </TextField>
        ) : (
          <span>· {sheet.name}</span>
        )}
        <span>· {detection.headerRow ? `Headings in row ${detection.headerRow}` : "No heading row"} · {vm.items.length} dishes</span>
      </Box>

      <Box>
        <b>Read from your file: </b>
        {columns.found.length || sizesFound
          ? [
              ...columns.found.map((c) => `${importFieldLabels[c.field]} ← ${c.column}`),
              ...(sizesFound ? [`Sizes ← ${columns.sizes.join(", ")}`] : []),
            ].join(" · ")
          : "nothing could be matched."}
      </Box>

      {missing.length > 0 && (
        <Box role="status" sx={{ color: tokens.color.error }}>
          <b>Not in your file: </b>
          {missing.map((f) => importFieldLabels[f]).join(", ")}. Every dish needs {missing.length === 1 ? "it" : "them"}; fill {missing.length === 1 ? "it" : "them"} in below.
        </Box>
      )}

      {detection.notes.map((n) => (
        <Typography key={n} sx={{ fontSize: 13, color: tokens.color.textMuted }}>{n}</Typography>
      ))}

      {columns.unused.length > 0 && (
        <Typography sx={{ fontSize: 13, color: tokens.color.textMuted }}>
          Not used: {columns.unused.join(", ")}. Their values are still shown under More details on each dish.
        </Typography>
      )}
    </Box>
  );
}
