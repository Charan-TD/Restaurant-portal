"use client";
import { useState } from "react";
import { Box, ButtonBase, CircularProgress, Dialog, Typography } from "@mui/material";
import CheckCircleOutlined from "@mui/icons-material/CheckCircleOutlined";
import CloseOutlined from "@mui/icons-material/CloseOutlined";
import DownloadOutlined from "@mui/icons-material/DownloadOutlined";
import ErrorOutlineOutlined from "@mui/icons-material/ErrorOutlineOutlined";
import UploadFileOutlined from "@mui/icons-material/UploadFileOutlined";
import { tokens, tokenScopeSx } from "@/core/theme/tokens";
import { CommonButton } from "@/shared/components/actions/CommonButton";
import { errorMessage } from "@/shared/utils/errors";
import { downloadMenuExcelTemplate } from "../services/menuItemApi";
import {
  EXCEL_MAX_ROWS,
  useMenuImportViewModel,
} from "../viewmodels/useMenuImportViewModel";

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

/** "New: Biryani, Starters" under a heading; nothing when the list is empty. */
function Names({ label, names }: { label: string; names: string[] }) {
  if (names.length === 0) return null;
  return (
    <Typography sx={{ fontSize: 13, color: tokens.color.textMuted }}>
      <b>{label}</b> {names.join(", ")}
    </Typography>
  );
}

/**
 * Import menu from Excel: download the template, fill it in, choose the file,
 * see what the server found, and add the dishes. If any row has a problem
 * nothing is imported until the sheet is fixed.
 */
export function MenuImportDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const vm = useMenuImportViewModel(),
    [downloading, setDownloading] = useState(false),
    [templateError, setTemplateError] = useState(""),
    busy = vm.checking || vm.importing,
    summary = vm.preview;
  const close = () => {
    if (vm.importing) return;
    vm.reset();
    onClose();
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
        <ButtonBase aria-label="Close" disabled={vm.importing} onClick={close} sx={{ width: 32, height: 32, borderRadius: "50%" }}>
          <CloseOutlined sx={{ fontSize: 20 }} />
        </ButtonBase>
      </Box>
      <Box sx={{ p: 3, display: "grid", gap: 2.5, maxHeight: "70vh", overflowY: "auto" }}>
        <Box sx={{ display: "grid", gap: 1 }}>
          <Typography sx={{ fontSize: 14 }}>
            <b>1.</b> Download the template and add one dish per row (up to {EXCEL_MAX_ROWS}). Keep the columns as they are, and delete the example row.
          </Typography>
          <Box>
            <CommonButton
              variant="outlined"
              startIcon={downloading ? <CircularProgress size={16} /> : <DownloadOutlined />}
              disabled={downloading}
              onClick={async () => {
                setDownloading(true);
                setTemplateError("");
                try {
                  await downloadMenuExcelTemplate();
                } catch (e) {
                  setTemplateError(errorMessage(e));
                } finally {
                  setDownloading(false);
                }
              }}
            >
              Download template
            </CommonButton>
          </Box>
          {templateError && (
            <Typography sx={{ fontSize: 13, color: tokens.color.error }}>{templateError}</Typography>
          )}
          <Typography sx={{ fontSize: 12, color: tokens.color.textMuted }}>
            Quantities with their own prices go in the qty_types (JSON) column, e.g. [{`{"qty_type":"Half","price":150},{"qty_type":"Full","price":250}`}]. Categories, sub-categories and quantity types you have not used before are created for you. Pictures are added afterwards from each dish.
          </Typography>
        </Box>

        <Box sx={{ display: "grid", gap: 1 }}>
          <Typography sx={{ fontSize: 14 }}>
            <b>2.</b> Choose your filled-in file (.xlsx, up to 5 MB). We check it before anything is saved.
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
            <CommonButton
              component="label"
              variant="outlined"
              startIcon={<UploadFileOutlined />}
              disabled={busy}
            >
              {vm.fileName ? "Choose another file" : "Choose file"}
              <input
                hidden
                type="file"
                accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                onChange={(e) => {
                  void vm.pick(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
            </CommonButton>
            {vm.fileName && (
              <Typography sx={{ fontSize: 14, color: tokens.color.textMuted }} noWrap>
                {vm.fileName}
              </Typography>
            )}
            {vm.checking && <CircularProgress size={18} aria-label="Checking the file" />}
          </Box>
          {vm.problem && (
            <Typography role="alert" sx={{ fontSize: 13, color: tokens.color.error }}>
              {vm.problem}
            </Typography>
          )}
        </Box>

        {summary && !vm.done && (
          <Box sx={{ display: "grid", gap: 1.25 }}>
            <Typography sx={{ fontSize: 14 }}>
              <b>3.</b> {plural(summary.validRows, "dish")} ready
              {summary.invalidRows > 0 && (
                <Box component="span" sx={{ color: tokens.color.error }}>
                  {" "}
                  · {plural(summary.invalidRows, "row")} to fix first
                </Box>
              )}
            </Typography>
            <Names label="New categories:" names={summary.categories.new} />
            <Names label="New sub-categories:" names={summary.subcategories.new} />
            <Names label="New quantity types:" names={summary.quantityTypes.new} />
          </Box>
        )}

        {vm.errors.length > 0 && !vm.done && (
          <Box sx={{ display: "grid", gap: 1 }}>
            <Typography sx={{ fontSize: 13, color: tokens.color.error }}>
              Nothing is imported until every row is correct. Fix these rows in your sheet and choose the file again.
            </Typography>
            <Box sx={{ border: `1px solid ${tokens.color.border}`, borderRadius: tokens.radius.input, overflow: "hidden" }}>
              <Box sx={{ display: "grid", gridTemplateColumns: "56px 1.2fr 3fr", gap: 1, px: 2, py: 1, fontSize: 12, fontWeight: 700, bgcolor: tokens.color.muted, color: tokens.color.textMuted }}>
                <span>Row</span>
                <span>Dish</span>
                <span>Problem</span>
              </Box>
              {vm.errors.map((e) => (
                <Box
                  key={`${e.row}-${e.item}`}
                  sx={{ display: "grid", gridTemplateColumns: "56px 1.2fr 3fr", gap: 1, alignItems: "start", px: 2, py: 1, fontSize: 13, borderTop: `1px solid ${tokens.color.borderSubtle}`, bgcolor: tokens.color.errorBg }}
                >
                  <span>{e.row}</span>
                  <Box component="span" sx={{ overflowWrap: "anywhere" }}>{e.item || "—"}</Box>
                  <Box component="span" sx={{ display: "flex", gap: 0.5, color: tokens.color.error }}>
                    <ErrorOutlineOutlined sx={{ fontSize: 16, mt: "2px", flexShrink: 0 }} />
                    <span>{e.errors.join("; ")}</span>
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        )}

        {vm.done && vm.result && (
          <Box sx={{ display: "flex", gap: 1, alignItems: "flex-start", color: tokens.color.success }}>
            <CheckCircleOutlined sx={{ mt: "2px" }} />
            <Box>
              <Typography sx={{ fontWeight: 700 }}>
                {plural(vm.result.created.items, "dish")} added to your menu.
              </Typography>
              <Typography sx={{ fontSize: 13 }}>
                {[
                  vm.result.created.categories ? plural(vm.result.created.categories, "new category").replace("categorys", "categories") : "",
                  vm.result.created.subcategories ? plural(vm.result.created.subcategories, "new sub-category").replace("categorys", "categories") : "",
                  vm.result.created.quantityTypes ? plural(vm.result.created.quantityTypes, "new quantity type") : "",
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </Typography>
            </Box>
          </Box>
        )}
      </Box>
      <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1.5, p: 2.5, borderTop: `1px solid ${tokens.color.border}` }}>
        <CommonButton variant="text" disabled={vm.importing} onClick={close}>
          {vm.done ? "Close" : "Cancel"}
        </CommonButton>
        {!vm.done && (
          <CommonButton
            variant="contained"
            disabled={busy || !summary?.valid}
            onClick={() => void vm.start()}
          >
            {vm.importing
              ? "Importing…"
              : summary?.valid
                ? `Import ${plural(summary.validRows, "dish")}`
                : "Import dishes"}
          </CommonButton>
        )}
      </Box>
    </Dialog>
  );
}
