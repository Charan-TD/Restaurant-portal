"use client";
import { useState } from "react";
import { Box, CircularProgress, Typography } from "@mui/material";
import UploadFileOutlined from "@mui/icons-material/UploadFileOutlined";
import { cardSx, tokens } from "@/core/theme/tokens";
import { MAX_IMPORT_ROWS } from "../import/types";
import type { OwnFileImport } from "../viewmodels/useOwnFileImportViewModel";

/** Step 1: drop or browse for the vendor's menu file (.xlsx, .xls, .csv). */
export function ImportUploadStep({ vm }: { vm: OwnFileImport }) {
  const [over, setOver] = useState(false);
  return (
    <Box sx={{ ...cardSx, p: { xs: 2, md: 3 }, display: "grid", gap: 2 }}>
      <Box>
        <Typography component="h2" sx={{ fontSize: 22, fontWeight: 700 }}>Upload your menu</Typography>
        <Typography sx={{ fontSize: 14, color: tokens.color.textMuted }}>
          Use your file as it is: Excel (.xlsx, .xls) or CSV, up to 5 MB and {MAX_IMPORT_ROWS} dishes. We match your columns, you fill in anything missing, and nothing is saved until you confirm.
        </Typography>
      </Box>
      <Box
        component="label"
        onDragOver={(e) => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          void vm.pick(e.dataTransfer.files?.[0]);
        }}
        sx={{ display: "grid", placeItems: "center", gap: 1, py: 7, px: 2, textAlign: "center", cursor: "pointer", borderRadius: tokens.radius.card, border: `2px dashed ${over ? tokens.color.primary : tokens.color.dashed}`, bgcolor: over ? tokens.color.primarySubtle : tokens.color.sunken }}
      >
        {vm.reading ? <CircularProgress size={28} aria-label="Reading the file" /> : <UploadFileOutlined sx={{ fontSize: 36, color: tokens.color.primary }} />}
        <Typography sx={{ fontWeight: 700 }}>Drag your menu file here, or click to browse</Typography>
        <Typography sx={{ fontSize: 12, color: tokens.color.textMuted }}>.xlsx, .xls or .csv</Typography>
        <input
          hidden
          type="file"
          aria-label="Upload menu file"
          accept=".xlsx,.xls,.csv"
          disabled={vm.busy}
          onChange={(e) => {
            void vm.pick(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </Box>
      <Typography sx={{ fontSize: 12, color: tokens.color.textMuted }}>
        Every dish needs a name, category, price and prep time. Half / Full price columns become sizes. Pictures are added afterwards from each dish.
      </Typography>
      {vm.problem && (
        <Typography role="alert" sx={{ fontSize: 13, color: tokens.color.error }}>{vm.problem}</Typography>
      )}
    </Box>
  );
}
