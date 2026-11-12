"use client";
import { useState } from "react";
import NextLink from "next/link";
import { Box, ButtonBase, Dialog, Typography } from "@mui/material";
import CloseOutlined from "@mui/icons-material/CloseOutlined";
import { tokens, tokenScopeSx } from "@/core/theme/tokens";
import { CommonButton } from "@/shared/components/actions/CommonButton";
import { TemplateImportPane } from "./TemplateImportPane";

/**
 * Import menu from Excel with the server's template. A menu that is not in
 * that layout goes through the full-page import at /menu/import instead.
 */
export function MenuImportDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [busy, setBusy] = useState(false),
    close = () => {
      if (!busy) onClose();
    };
  return (
    <Dialog
      open={open}
      onClose={close}
      fullWidth
      maxWidth="md"
      slotProps={{ paper: { sx: { ...tokenScopeSx, borderRadius: "16px" } } }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 3, height: 64, borderBottom: `1px solid ${tokens.color.border}` }}>
        <Typography component="h2" sx={{ flex: 1, fontSize: 18, fontWeight: 700 }}>
          Import menu from Excel
        </Typography>
        <ButtonBase aria-label="Close" disabled={busy} onClick={close} sx={{ width: 32, height: 32, borderRadius: "50%" }}>
          <CloseOutlined sx={{ fontSize: 20 }} />
        </ButtonBase>
      </Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap", px: 3, py: 1.5, bgcolor: tokens.color.primarySubtle, borderBottom: `1px solid ${tokens.color.primarySubtleBorder}` }}>
        <Typography sx={{ flex: 1, minWidth: 220, fontSize: 14 }}>
          <b>Menu not in our format?</b> Upload your own Excel or CSV file; we match the columns for you.
        </Typography>
        <CommonButton variant="contained" href="/menu/import" LinkComponent={NextLink}>
          Upload my own file
        </CommonButton>
      </Box>
      <TemplateImportPane onClose={close} onBusy={setBusy} />
    </Dialog>
  );
}
