"use client";
import { useState } from "react";
import { Box, Checkbox, Typography } from "@mui/material";
import CheckCircleOutlined from "@mui/icons-material/CheckCircleOutlined";
import ErrorOutlineOutlined from "@mui/icons-material/ErrorOutlineOutlined";
import { cardSx, tokens } from "@/core/theme/tokens";
import { CommonButton } from "@/shared/components/actions/CommonButton";
import { customerPays } from "../import/pricing";
import { PhotoThumb } from "./ImportPhotoCell";
import type { OwnFileImport } from "../viewmodels/useOwnFileImportViewModel";

const chip = (color: string, bg = "transparent") => ({
  px: 1.5, py: 0.5, borderRadius: 99, fontSize: 12, fontWeight: 600, color, bgcolor: bg,
  border: `1px solid ${color === tokens.color.text ? tokens.color.border : color}`,
});
const th = { textAlign: "left", fontSize: 12, fontWeight: 700, p: 1.25, whiteSpace: "nowrap" } as const;

/** Step 3: a read-only look at what will be sent, with the price the customer pays. The vendor must tick that they checked it. */
export function ImportCheckStep({ vm }: { vm: OwnFileImport }) {
  const [checked, setChecked] = useState(false),
    bad = new Set(vm.issues.map((i) => i.itemId)),
    valid = vm.items.length - bad.size,
    canSend = checked && vm.issues.length === 0 && !vm.tooMany && !vm.busy;
  return (
    <Box sx={{ ...cardSx, p: { xs: 2, md: 3 }, display: "grid", gap: 2 }}>
      <Box>
        <Typography component="h2" sx={{ fontSize: 22, fontWeight: 700 }}>Review before submission</Typography>
        <Typography sx={{ fontSize: 14, color: tokens.color.textMuted }}>
          Check every dish, size and price. The server checks the file once more before anything is saved.
        </Typography>
      </Box>
      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
        <Box sx={chip(tokens.color.text, tokens.color.muted)}>{vm.items.length} dishes</Box>
        <Box sx={chip(tokens.color.success)}>{valid} valid</Box>
        <Box sx={chip(bad.size ? tokens.color.error : tokens.color.text)}>{bad.size} invalid</Box>
      </Box>
      {vm.issues.length === 0 ? (
        <Box sx={{ display: "flex", gap: 1, alignItems: "center", p: 1.5, borderRadius: tokens.radius.input, bgcolor: tokens.color.successBg, color: tokens.color.success, fontSize: 14 }}>
          <CheckCircleOutlined /> All dishes have the details we need.
        </Box>
      ) : (
        <Box role="alert" sx={{ display: "flex", gap: 1, alignItems: "center", p: 1.5, borderRadius: tokens.radius.input, bgcolor: tokens.color.errorBg, color: tokens.color.error, fontSize: 14 }}>
          <ErrorOutlineOutlined /> {bad.size} {bad.size === 1 ? "dish needs" : "dishes need"} fixing. Return to editing.
        </Box>
      )}

      <Box sx={{ overflowX: "auto", border: `1px solid ${tokens.color.border}`, borderRadius: tokens.radius.input }}>
        <Box component="table" sx={{ width: "100%", minWidth: 1200, borderCollapse: "collapse", "& td": { p: 1.25, fontSize: 13, verticalAlign: "top", borderTop: `1px solid ${tokens.color.borderSubtle}` } }}>
          <thead>
            <tr style={{ background: tokens.color.sunken }}>
              {["Source", "Name", "Price", "Category / subcategory", "Prep / availability", "Sizes → customer pays", "Discount", "Add-ons", "Food", "Photo"].map((h) => (
                <th key={h} style={th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {vm.items.map((item) => {
              const mine = vm.issuesById.get(item.id) ?? [];
              return (
                <tr key={item.id} style={mine.length ? { background: tokens.color.errorBg } : undefined}>
                  <td style={{ color: tokens.color.textMuted }}>{vm.sheet?.name} · {item.sourceRow ? `Row ${item.sourceRow}` : "added"}</td>
                  <td>
                    {item.name || "—"}
                    {mine.map((i) => (
                      <div key={i.message} style={{ color: tokens.color.error, fontSize: 12 }}>{i.message}</div>
                    ))}
                  </td>
                  <td>{item.price ?? "—"}</td>
                  <td>{[item.category, item.subCategory].filter(Boolean).join(" / ") || "—"}</td>
                  <td>{item.prepMinutes ?? "—"} min · {item.available ? "In stock" : "Out of stock"}</td>
                  <td>
                    {item.sizes.length
                      ? item.sizes.map((s) => (
                          <div key={s.name}>{s.name}: ₹{s.price} → <b>₹{customerPays(s.price, item)}</b></div>
                        ))
                      : item.price !== null
                        ? <>Single price → <b>₹{customerPays(item.price, item)}</b></>
                        : "—"}
                  </td>
                  <td>{item.discountType === "percent" ? `${item.discPercent}% off` : item.discountType === "flat" ? `₹${item.flatAmount} off` : "No discount"}</td>
                  <td>{(item.addons ?? []).length ? item.addons.map((a) => `${a.name} ₹${a.price}${a.available ? "" : " (off)"}`).join(", ") : "—"}</td>
                  <td>{item.foodType || "—"}</td>
                  <td><PhotoThumb file={item.photo} size={36} /></td>
                </tr>
              );
            })}
          </tbody>
        </Box>
      </Box>

      {vm.serverErrors.length > 0 && (
        <Box sx={{ display: "grid", gap: 1 }}>
          {Object.entries(
            Object.groupBy(vm.serverErrors, (e) => e.dish || `Row ${e.row}`),
          ).map(([dish, errors]) => (
            <Box key={dish} sx={{ display: "flex", gap: 0.75, fontSize: 13, color: tokens.color.error }}>
              <ErrorOutlineOutlined sx={{ fontSize: 16, mt: "2px", flexShrink: 0 }} />
              <Box>
                <b>{dish}</b>
                {errors?.map((e, i) => (
                  <div key={i}>
                    {e.column || "—"}: {e.error}
                    {e.suggestion && ` ${e.suggestion}`}
                  </div>
                ))}
              </Box>
            </Box>
          ))}
        </Box>
      )}
      {vm.problem && (
        <Typography role="alert" sx={{ fontSize: 13, color: tokens.color.error }}>{vm.problem}</Typography>
      )}

      <Box component="label" sx={{ display: "flex", alignItems: "center", gap: 1, p: 1.5, borderRadius: tokens.radius.input, bgcolor: tokens.color.infoBg, color: tokens.color.info, fontSize: 14, cursor: "pointer" }}>
        <Checkbox checked={checked} onChange={(e) => setChecked(e.target.checked)} />
        I have checked the name, price, sizes, discount and final customer price of every dish above.
      </Box>
      <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
        <CommonButton variant="outlined" onClick={vm.backToReview} disabled={vm.busy}>Return to editing</CommonButton>
        <CommonButton variant="contained" disabled={!canSend} onClick={() => void vm.send()}>
          {vm.checking ? "Checking…" : vm.importing ? "Importing…" : `Import ${vm.items.length} ${vm.items.length === 1 ? "dish" : "dishes"}`}
        </CommonButton>
      </Box>
    </Box>
  );
}
