"use client";
import { useState } from "react";
import { Popover } from "@mui/material";
import { tokenScopeSx } from "@/core/theme/tokens";
import { TemplateImportPane } from "./TemplateImportPane";

/**
 * Bulk upload: a panel under the "Bulk upload" button with the server's
 * template in three steps. A menu that is not in that layout is handed to the
 * full-page import at /menu/import, which matches its columns.
 */
export function MenuImportDialog({
  anchorEl,
  onClose,
}: {
  anchorEl: HTMLElement | null;
  onClose: () => void;
}) {
  const [busy, setBusy] = useState(false),
    close = () => {
      if (!busy) onClose();
    };
  return (
    <Popover
      open={!!anchorEl}
      anchorEl={anchorEl}
      onClose={close}
      anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      transformOrigin={{ vertical: "top", horizontal: "left" }}
      slotProps={{
        paper: { sx: { ...tokenScopeSx, mt: 1, borderRadius: "12px", maxWidth: "calc(100vw - 32px)" } },
      }}
    >
      {anchorEl && <TemplateImportPane onClose={close} onBusy={setBusy} />}
    </Popover>
  );
}
