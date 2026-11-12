"use client";
import NextLink from "next/link";
import { Box, Typography } from "@mui/material";
import ArrowBackOutlined from "@mui/icons-material/ArrowBackOutlined";
import CheckCircleOutlined from "@mui/icons-material/CheckCircleOutlined";
import { cardSx, tokens } from "@/core/theme/tokens";
import { CommonButton } from "@/shared/components/actions/CommonButton";
import { ScreenSurface } from "@/shared/components/layout/ScreenSurface";
import { ImportCheckStep } from "../components/ImportCheckStep";
import { ImportColumnsStep } from "../components/ImportColumnsStep";
import { ImportReviewStep } from "../components/ImportReviewStep";
import { ImportStepper } from "../components/ImportStepper";
import { ImportUploadStep } from "../components/ImportUploadStep";
import { useOwnFileImportViewModel } from "../viewmodels/useOwnFileImportViewModel";

/**
 * Bulk menu import from the vendor's own spreadsheet:
 * Upload → (Column setup) → Review & edit → Check menu → Done.
 */
export function MenuBulkImportView() {
  const vm = useOwnFileImportViewModel();
  return (
    <ScreenSurface>
      <Box sx={{ maxWidth: 1400, mx: "auto" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap", mb: 2 }}>
          <Box sx={{ flex: 1, minWidth: 240 }}>
            <Typography component="h1" sx={{ fontSize: 26, fontWeight: 700 }}>Import menu from a spreadsheet</Typography>
            <Typography sx={{ fontSize: 14, color: tokens.color.textMuted }}>
              Spreadsheet in, organised menu out. Use your own file, in any layout.
            </Typography>
          </Box>
          <CommonButton variant="outlined" startIcon={<ArrowBackOutlined />} href="/menu/items" LinkComponent={NextLink} disabled={vm.importing}>
            Back to menu
          </CommonButton>
        </Box>
        <ImportStepper stage={vm.stage} />
        {vm.stage === "choose" && <ImportUploadStep vm={vm} />}
        {vm.stage === "columns" && <ImportColumnsStep vm={vm} />}
        {vm.stage === "review" && <ImportReviewStep vm={vm} />}
        {vm.stage === "check" && <ImportCheckStep vm={vm} />}
        {vm.stage === "done" && vm.result && (
          <Box sx={{ ...cardSx, p: 3, display: "grid", gap: 2, justifyItems: "start" }}>
            <Box sx={{ display: "flex", gap: 1, color: tokens.color.success }}>
              <CheckCircleOutlined sx={{ mt: "2px" }} />
              <Box>
                <Typography sx={{ fontWeight: 700 }}>
                  {vm.result.created.items} {vm.result.created.items === 1 ? "dish" : "dishes"} added to your menu.
                </Typography>
                <Typography sx={{ fontSize: 13 }}>Add a picture to each dish from the menu when you are ready.</Typography>
              </Box>
            </Box>
            <Box sx={{ display: "flex", gap: 1.5 }}>
              <CommonButton variant="contained" href="/menu/items" LinkComponent={NextLink}>View menu</CommonButton>
              <CommonButton variant="outlined" onClick={vm.reset}>Import another file</CommonButton>
            </Box>
          </Box>
        )}
      </Box>
    </ScreenSurface>
  );
}
