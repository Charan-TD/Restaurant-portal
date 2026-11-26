"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Box, ButtonBase, CircularProgress, Typography } from "@mui/material";
import CheckCircleOutlined from "@mui/icons-material/CheckCircleOutlined";
import DownloadOutlined from "@mui/icons-material/DownloadOutlined";
import ErrorOutlineOutlined from "@mui/icons-material/ErrorOutlineOutlined";
import FileUploadOutlined from "@mui/icons-material/FileUploadOutlined";
import TableChartOutlined from "@mui/icons-material/TableChartOutlined";
import { tokens } from "@/core/theme/tokens";
import { CommonButton } from "@/shared/components/actions/CommonButton";
import { errorMessage } from "@/shared/utils/errors";
import { downloadMenuExcelTemplate } from "../services/menuItemApi";
import { useMenuImportViewModel } from "../viewmodels/useMenuImportViewModel";

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

/** "New: Biryani, Starters" under a heading; nothing when the list is empty. */
function Names({ label, names }: { label: string; names: string[] }) {
  if (names.length === 0) return null;
  return (
    <Typography sx={{ fontSize: 12, color: tokens.color.textMuted }}>
      <b>{label}</b> {names.join(", ")}
    </Typography>
  );
}

/** One numbered step: an orange number, a title and what to do. */
function Step({ n, title, children }: { n: number; title: string; children?: ReactNode }) {
  return (
    <Box sx={{ display: "grid", gridTemplateColumns: "22px minmax(0, 1fr)", columnGap: 1.25, rowGap: 0.5 }}>
      <Box
        component="span"
        sx={{
          width: 22,
          height: 22,
          display: "grid",
          placeItems: "center",
          borderRadius: "50%",
          fontSize: 11,
          fontWeight: 700,
          color: tokens.color.primary,
          bgcolor: tokens.color.primarySubtle,
          border: `1px solid ${tokens.color.primarySubtleBorder}`,
        }}
      >
        {n}
      </Box>
      <Typography sx={{ fontSize: 13, fontWeight: 700, lineHeight: "22px" }}>{title}</Typography>
      <Box />
      <Box sx={{ minWidth: 0 }}>{children}</Box>
    </Box>
  );
}

/**
 * Bulk upload with the server's own template, in three steps: download it,
 * fill it in, choose the file. The server checks every row; if any has a
 * problem nothing is imported until the sheet is fixed.
 */
export function TemplateImportPane({
  onClose,
  onBusy,
}: {
  onClose: () => void;
  onBusy: (busy: boolean) => void;
}) {
  const vm = useMenuImportViewModel(),
    [downloading, setDownloading] = useState(false),
    [templateError, setTemplateError] = useState(""),
    [dragging, setDragging] = useState(false),
    input = useRef<HTMLInputElement>(null),
    busy = vm.checking || vm.importing,
    summary = vm.preview;
  useEffect(() => onBusy(vm.importing), [vm.importing, onBusy]);
  const choose = (file?: File) => {
    if (!busy) void vm.pick(file);
  };
  return (
    <Box sx={{ p: 2.5, display: "grid", gap: 2, width: 380, maxWidth: "100%", maxHeight: "75vh", overflowY: "auto" }}>
      <Box>
        <Typography component="h2" sx={{ fontSize: 15, fontWeight: 700 }}>
          Upload menu from a file
        </Typography>
        <Typography sx={{ fontSize: 12, color: tokens.color.textMuted }}>
          Add many dishes at once using the TrainDhaba template.
        </Typography>
      </Box>

      <Step n={1} title="Download the template">
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.25,
            p: 1.25,
            borderRadius: tokens.radius.input,
            border: `1px solid ${tokens.color.border}`,
          }}
        >
          <TableChartOutlined sx={{ color: tokens.color.success }} />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography noWrap sx={{ fontSize: 13, fontWeight: 600 }}>
              Menu_template.xlsx
            </Typography>
            <Typography sx={{ fontSize: 11, color: tokens.color.textMuted }}>With sample dishes</Typography>
          </Box>
          <CommonButton
            variant="outlined"
            size="small"
            startIcon={downloading ? <CircularProgress size={14} /> : <DownloadOutlined />}
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
            Download
          </CommonButton>
        </Box>
        {templateError && (
          <Typography sx={{ mt: 0.5, fontSize: 12, color: tokens.color.error }}>{templateError}</Typography>
        )}
      </Step>

      <Step n={2} title="Fill in your dishes">
        <Typography sx={{ fontSize: 12, color: tokens.color.textMuted }}>
          Add name, category, price, veg or non-veg. Keep the column names as they are.
        </Typography>
      </Step>

      <Step n={3} title="Upload the filled file">
        <ButtonBase
          component="label"
          disabled={busy}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            choose(e.dataTransfer.files?.[0]);
          }}
          sx={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 0.25,
            py: 2.5,
            borderRadius: tokens.radius.input,
            border: `1.5px dashed ${dragging ? tokens.color.primary : tokens.color.borderStrong}`,
            bgcolor: dragging ? tokens.color.primarySubtle : tokens.color.page,
          }}
        >
          {vm.checking ? (
            <CircularProgress size={22} aria-label="Checking the file" />
          ) : (
            <FileUploadOutlined sx={{ color: tokens.color.primary }} />
          )}
          <Typography sx={{ fontSize: 13, fontWeight: 600, color: tokens.color.primary }}>
            {vm.fileName ? vm.fileName : "Choose file or drag it here"}
          </Typography>
          <Typography sx={{ fontSize: 11, color: tokens.color.textMuted }}>.xlsx or .csv · up to 5 MB</Typography>
          <input
            ref={input}
            hidden
            type="file"
            accept=".xlsx,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            onChange={(e) => {
              choose(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </ButtonBase>
        {vm.problem && (
          <Typography role="alert" sx={{ mt: 0.75, fontSize: 12, color: tokens.color.error }}>
            {vm.problem}
          </Typography>
        )}
      </Step>

      {summary && !vm.done && (
        <Box sx={{ display: "grid", gap: 0.75 }}>
          <Typography sx={{ fontSize: 13 }}>
            <b>{plural(summary.validRows, "dish")}</b> ready
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
        <Box sx={{ display: "grid", gap: 0.75 }}>
          <Typography sx={{ fontSize: 12, color: tokens.color.error }}>
            Nothing is imported until every row is correct. Fix these rows in your sheet and choose the file again.
          </Typography>
          <Box
            sx={{
              maxHeight: 200,
              overflowY: "auto",
              border: `1px solid ${tokens.color.border}`,
              borderRadius: tokens.radius.input,
            }}
          >
            {vm.errors.map((e, i) => (
              <Box
                key={`${e.row}-${e.cell}-${i}`}
                sx={{
                  display: "flex",
                  gap: 0.75,
                  alignItems: "flex-start",
                  px: 1.25,
                  py: 0.9,
                  fontSize: 12,
                  overflowWrap: "anywhere",
                  borderTop: i ? `1px solid ${tokens.color.borderSubtle}` : 0,
                  bgcolor: tokens.color.errorBg,
                }}
              >
                <ErrorOutlineOutlined sx={{ fontSize: 15, mt: "1px", flexShrink: 0, color: tokens.color.error }} />
                <span>
                  <b>
                    Row {e.row}
                    {e.column && ` · ${e.column}`}
                  </b>
                  {e.value && <span style={{ color: tokens.color.textMuted }}> ({e.value})</span>}
                  <Box component="span" sx={{ display: "block", color: tokens.color.error }}>
                    {e.error}
                  </Box>
                  {e.suggestion && (
                    <Box component="span" sx={{ display: "block", color: tokens.color.textMuted }}>
                      {e.suggestion}
                    </Box>
                  )}
                </span>
              </Box>
            ))}
          </Box>
        </Box>
      )}

      {vm.done && vm.result && (
        <Box sx={{ display: "flex", gap: 1, alignItems: "flex-start", color: tokens.color.success }}>
          <CheckCircleOutlined sx={{ mt: "2px" }} />
          <Box>
            <Typography sx={{ fontWeight: 700, fontSize: 14 }}>
              {plural(vm.result.created.items, "dish")} added to your menu.
            </Typography>
            <Typography sx={{ fontSize: 12 }}>
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

      {(summary || vm.done) && (
        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
          <CommonButton variant="text" disabled={vm.importing} onClick={onClose}>
            {vm.done ? "Close" : "Cancel"}
          </CommonButton>
          {!vm.done && (
            <CommonButton variant="contained" disabled={busy || !summary?.valid} onClick={() => void vm.start()}>
              {vm.importing
                ? "Importing…"
                : summary?.valid
                  ? `Import ${plural(summary.validRows, "dish")}`
                  : "Import dishes"}
            </CommonButton>
          )}
        </Box>
      )}

      <Typography
        sx={{ pt: 1.25, fontSize: 11, color: tokens.color.textMuted, borderTop: `1px solid ${tokens.color.borderSubtle}` }}
      >
        Our team checks the file before the dishes go live.
      </Typography>
    </Box>
  );
}
