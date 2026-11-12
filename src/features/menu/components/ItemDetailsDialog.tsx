"use client";
import { useState, type ReactNode } from "react";
import { Box, ButtonBase, Dialog, Typography } from "@mui/material";
import CheckCircleOutlined from "@mui/icons-material/CheckCircleOutlined";
import CloseOutlined from "@mui/icons-material/CloseOutlined";
import ErrorOutlineOutlined from "@mui/icons-material/ErrorOutlineOutlined";
import { tokens, tokenScopeSx } from "@/core/theme/tokens";
import { CommonButton } from "@/shared/components/actions/CommonButton";
import { CommonTextField } from "@/shared/components/form/CommonTextField";
import { emptyAddon, validateItem } from "../import/buildDraft";
import { backendFields } from "../import/toTemplate";
import { preparePhoto } from "../import/photos";
import { customerPays } from "../import/pricing";
import type { DraftAddon, DraftItem, ImportFoodType } from "../import/types";
import { ImportPhotoCell } from "./ImportPhotoCell";

const foodOptions: ImportFoodType[] = ["Veg", "Non-veg", "Egg"];
const native = { select: { native: true }, inputLabel: { shrink: true } } as const;

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <Box component="section" sx={{ border: `1px solid ${tokens.color.border}`, borderRadius: tokens.radius.input, p: 2, display: "grid", gap: 1.5 }}>
      <Box>
        <Typography component="h3" sx={{ fontSize: 15, fontWeight: 700 }}>{title}</Typography>
        {hint && <Typography sx={{ fontSize: 13, color: tokens.color.textMuted }}>{hint}</Typography>}
      </Box>
      {children}
    </Box>
  );
}

/**
 * The full editor for one dish ("More details"): details, price and sizes,
 * discount, description and photo. The panel at the top re-checks the dish
 * on every change. An unfinished dish can still be saved and finished later.
 */
export function ItemDetailsDialog({
  item,
  categories,
  qtyNames,
  siblings,
  onClose,
  onSave,
}: {
  item: DraftItem;
  categories: string[];
  /** The quantity types the server accepts as size names. */
  qtyNames: string[];
  /** The other dishes in this import, to offer their add-ons again. */
  siblings: DraftItem[];
  onClose: () => void;
  onSave: (next: DraftItem) => void;
}) {
  const [draft, setDraft] = useState<DraftItem>({ ...item, sizes: item.sizes.map((s) => ({ ...s })) }),
    [photoError, setPhotoError] = useState(""),
    [amount, setAmount] = useState(
      String((item.discountType === "flat" ? item.flatAmount : item.discPercent) || ""),
    );
  const patch = (next: Partial<DraftItem>) => setDraft((d) => ({ ...d, ...next }));
  const value = Number(amount) || 0,
    withDiscount = {
      ...draft,
      discPercent: draft.discountType === "percent" ? value : 0,
      flatAmount: draft.discountType === "flat" ? value : 0,
    },
    issues = validateItem(withDiscount, qtyNames);
  const addons = draft.addons ?? [],
    setAddons = (next: DraftAddon[]) => patch({ addons: next }),
    changeAddon = (id: string, change: Partial<DraftAddon>) =>
      setAddons(addons.map((a) => (a.id === id ? { ...a, ...change } : a))),
    sameName = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase(),
    // Add-ons other dishes in this category already offer: one tap copies them, price and all.
    suggestions = [
      ...new Map(
        siblings
          .filter((s) => s.id !== item.id && sameName(s.category, draft.category))
          .flatMap((s) => s.addons ?? [])
          .filter((a) => a.name.trim() && !addons.some((x) => sameName(x.name, a.name)))
          .map((a) => [a.name.trim().toLowerCase(), a] as const),
      ).values(),
    ];
  const setDiscountType = (type: "" | "percent" | "flat") =>
    patch({ discountType: type || null });

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm" scroll="paper" slotProps={{ paper: { sx: { ...tokenScopeSx, borderRadius: "16px" } } }}>
      <Box sx={{ display: "flex", alignItems: "center", px: 3, height: 60, borderBottom: `1px solid ${tokens.color.border}` }}>
        <Typography component="h2" sx={{ flex: 1, fontSize: 17, fontWeight: 700 }} noWrap>
          Edit item · {item.sourceRow ? `source row ${item.sourceRow}` : "added here"}
        </Typography>
        <ButtonBase aria-label="Close" onClick={onClose} sx={{ width: 32, height: 32, borderRadius: "50%" }}>
          <CloseOutlined sx={{ fontSize: 20 }} />
        </ButtonBase>
      </Box>
      <Box sx={{ p: 3, display: "grid", gap: 2, overflowY: "auto" }}>
        {issues.length === 0 ? (
          <Box sx={{ display: "flex", gap: 1, p: 1.5, borderRadius: tokens.radius.input, bgcolor: tokens.color.successBg, color: tokens.color.success }}>
            <CheckCircleOutlined />
            <Box>
              <Typography sx={{ fontSize: 14, fontWeight: 600 }}>All fields pass validation</Typography>
              <Typography sx={{ fontSize: 13 }}>Still check the sizes, discount and final prices below; they are sent as shown.</Typography>
            </Box>
          </Box>
        ) : (
          <Box role="alert" sx={{ display: "flex", gap: 1, p: 1.5, borderRadius: tokens.radius.input, bgcolor: tokens.color.errorBg, color: tokens.color.error }}>
            <ErrorOutlineOutlined />
            <Box>
              <Typography sx={{ fontSize: 14, fontWeight: 600 }}>
                Check {issues.length} {issues.length === 1 ? "field" : "fields"} before submitting
              </Typography>
              {issues.map((i) => (
                <Typography key={i.message} sx={{ fontSize: 13 }}>{i.message}</Typography>
              ))}
            </Box>
          </Box>
        )}
        <Typography sx={{ fontSize: 12, color: tokens.color.textMuted }}>
          You can save an incomplete draft and finish it later. Dishes with problems cannot be submitted.
        </Typography>

        <Section title="1. Item details">
          <CommonTextField size="small" label="Item name" value={draft.name} onChange={(e) => patch({ name: e.target.value })} />
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1.5 }}>
            <CommonTextField size="small" label="Category" value={draft.category} onChange={(e) => patch({ category: e.target.value })} slotProps={{ htmlInput: { list: "item-dialog-categories" } }} />
            <CommonTextField size="small" label="Subcategory" value={draft.subCategory} onChange={(e) => patch({ subCategory: e.target.value })} />
            <CommonTextField size="small" type="number" label="Preparation time (minutes)" value={draft.prepMinutes ?? ""} onChange={(e) => patch({ prepMinutes: e.target.value === "" ? null : Number(e.target.value) })} />
            <CommonTextField select size="small" label="Food served" value={draft.foodType} onChange={(e) => patch({ foodType: e.target.value as ImportFoodType, foodTypeText: "" })} slotProps={native}>
              <option value="">{draft.foodTypeText ? `“${draft.foodTypeText}”?` : "Choose"}</option>
              {foodOptions.map((f) => <option key={f}>{f}</option>)}
            </CommonTextField>
            <CommonTextField select size="small" label="Owner availability" value={draft.available ? "yes" : "no"} onChange={(e) => patch({ available: e.target.value === "yes" })} slotProps={native}>
              <option value="yes">In stock</option>
              <option value="no">Out of stock</option>
            </CommonTextField>
          </Box>
          <datalist id="item-dialog-categories">
            {categories.map((c) => <option key={c} value={c} />)}
          </datalist>
        </Section>

        <Section title="2. Price and sizes" hint="Each size has its own price. The total price is used when no size is chosen.">
          <CommonTextField size="small" type="number" label="Total price" value={draft.price ?? ""} onChange={(e) => patch({ price: e.target.value === "" ? null : Number(e.target.value) })} helperText="Main price of the item. Usually the largest size." />
          {draft.sizes.length > 0 && (
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 120px 110px 32px", gap: 1, alignItems: "center", fontSize: 12, color: tokens.color.textMuted }}>
              <span>Size</span><span>Price</span><span>Customer pays</span><span />
            </Box>
          )}
          {draft.sizes.map((size, i) => (
            <Box key={i} sx={{ display: "grid", gridTemplateColumns: "1fr 120px 110px 32px", gap: 1, alignItems: "center" }}>
              <CommonTextField select size="small" aria-label="Size name" value={size.name} error={!!size.name && qtyNames.length > 0 && !qtyNames.some((n) => n.toLowerCase() === size.name.trim().toLowerCase())} onChange={(e) => patch({ sizes: draft.sizes.map((s, j) => (j === i ? { ...s, name: e.target.value } : s)) })} slotProps={{ select: { native: true } }}>
                <option value="">Choose size</option>
                {size.name && !qtyNames.some((n) => n.toLowerCase() === size.name.trim().toLowerCase()) && (
                  <option value={size.name}>{size.name} (not available)</option>
                )}
                {qtyNames.map((n) => <option key={n} value={n}>{n}</option>)}
              </CommonTextField>
              <CommonTextField size="small" type="number" aria-label="Size price" value={size.price} onChange={(e) => patch({ sizes: draft.sizes.map((s, j) => (j === i ? { ...s, price: Number(e.target.value) } : s)) })} />
              <Typography sx={{ fontSize: 13, fontWeight: 700 }}>₹{customerPays(size.price, withDiscount)}</Typography>
              <ButtonBase aria-label="Remove size" onClick={() => patch({ sizes: draft.sizes.filter((_, j) => j !== i) })} sx={{ width: 32, height: 32, borderRadius: "50%" }}>
                <CloseOutlined sx={{ fontSize: 16 }} />
              </ButtonBase>
            </Box>
          ))}
          <Box>
            <CommonButton variant="outlined" onClick={() => patch({ sizes: [...draft.sizes, { name: "", price: draft.price ?? 0 }] })}>
              + Add size
            </CommonButton>
          </Box>
        </Section>

        <Section title="3. Discount" hint="One discount applies to the whole item. A percent discount gives each size its own final price; a flat discount takes the same amount off every size.">
          <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
            <CommonTextField select size="small" label="Discount type" value={draft.discountType ?? ""} onChange={(e) => setDiscountType(e.target.value as "" | "percent" | "flat")} slotProps={native} sx={{ width: 200 }}>
              <option value="">No discount</option>
              <option value="percent">Percent (%)</option>
              <option value="flat">Flat amount (₹)</option>
            </CommonTextField>
            {draft.discountType && (
              <CommonTextField size="small" type="number" label={draft.discountType === "percent" ? "Percent off" : "Rupees off"} value={amount} onChange={(e) => setAmount(e.target.value)} sx={{ width: 160 }} />
            )}
          </Box>
          <Box sx={{ p: 1.5, borderRadius: tokens.radius.input, bgcolor: tokens.color.sunken, fontSize: 13 }}>
            <b>Customer pays</b>
            {draft.sizes.length
              ? draft.sizes.map((s, i) => (
                  <div key={i}>{s.name || "Size"}: ₹{s.price} → <b>₹{customerPays(s.price, withDiscount)}</b></div>
                ))
              : draft.price !== null && <div>Single price → <b>₹{customerPays(draft.price, withDiscount)}</b></div>}
          </Box>
        </Section>

        <Section title="4. More details">
          <CommonTextField size="small" multiline minRows={2} label="Description" value={draft.description} onChange={(e) => patch({ description: e.target.value })} />
        </Section>

        <Section
          title="5. Add-ons"
          hint="Extras offered with this dish, such as Raita or Extra egg. An add-on used on several dishes in one category must have the same price, availability and picture on each."
        >
          {addons.map((addon) => (
            <Box key={addon.id} sx={{ display: "flex", gap: 1, flexWrap: "wrap", alignItems: "flex-start", pb: 1.5, borderBottom: `1px solid ${tokens.color.borderSubtle}` }}>
              <CommonTextField size="small" label="Add-on name" value={addon.name} error={!addon.name.trim()} onChange={(e) => changeAddon(addon.id, { name: e.target.value })} sx={{ flex: 1, minWidth: 160 }} />
              <CommonTextField size="small" type="number" label="Price" value={addon.price ?? ""} error={addon.price === null || addon.price < 0} onChange={(e) => changeAddon(addon.id, { price: e.target.value === "" ? null : Number(e.target.value) })} sx={{ width: 100 }} />
              <CommonTextField select size="small" label="Availability" value={addon.available ? "yes" : "no"} onChange={(e) => changeAddon(addon.id, { available: e.target.value === "yes" })} slotProps={native} sx={{ width: 130 }}>
                <option value="yes">In stock</option>
                <option value="no">Out of stock</option>
              </CommonTextField>
              <ImportPhotoCell
                file={addon.photo}
                name={addon.name}
                missing={false}
                onPick={async (file) => {
                  if (!file) return;
                  try {
                    changeAddon(addon.id, { photo: await preparePhoto(file) });
                    setPhotoError("");
                  } catch (e) {
                    setPhotoError(e instanceof Error ? e.message : "That picture could not be used.");
                  }
                }}
                onRemove={() => changeAddon(addon.id, { photo: null })}
              />
              <ButtonBase aria-label={`Remove add-on ${addon.name}`} onClick={() => setAddons(addons.filter((a) => a.id !== addon.id))} sx={{ width: 32, height: 32, borderRadius: "50%", mt: 0.5 }}>
                <CloseOutlined sx={{ fontSize: 16 }} />
              </ButtonBase>
            </Box>
          ))}
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center" }}>
            <CommonButton variant="outlined" onClick={() => setAddons([...addons, emptyAddon()])}>
              + Add add-on
            </CommonButton>
            {suggestions.map((s) => (
              <ButtonBase key={s.id} onClick={() => setAddons([...addons, emptyAddon({ name: s.name, price: s.price, available: s.available, photo: s.photo })])} sx={{ px: 1.25, py: 0.5, borderRadius: 99, fontSize: 12, fontWeight: 700, color: tokens.color.primary, border: `1px solid ${tokens.color.primarySubtleBorder}` }}>
                + {s.name} ₹{s.price}
              </ButtonBase>
            ))}
          </Box>
        </Section>

        <Section title="6. Photo" hint="Required. It is resized to a small JPEG for you.">
          <ImportPhotoCell
            file={draft.photo}
            name={draft.name}
            missing={!draft.photo}
            onPick={async (file) => {
              if (!file) return;
              try {
                patch({ photo: await preparePhoto(file) });
                setPhotoError("");
              } catch (e) {
                setPhotoError(e instanceof Error ? e.message : "That picture could not be used.");
              }
            }}
            onRemove={() => patch({ photo: null })}
          />
          {photoError && <Typography role="alert" sx={{ fontSize: 13, color: tokens.color.error }}>{photoError}</Typography>}
        </Section>

        <Section title="7. Saved to the server as" hint="Exactly what is sent for this dish, in the server's own column names and values.">
          <Box sx={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "4px 16px", fontSize: 13 }}>
            {backendFields(withDiscount).map(({ field, value }) => (
              <Box key={field} sx={{ display: "contents" }}>
                <Box component="code" sx={{ color: tokens.color.textMuted }}>{field}</Box>
                <Box component="span" sx={{ color: value === null || value === "" ? tokens.color.textSubtle : tokens.color.text, overflowWrap: "anywhere" }}>
                  {value === null || value === "" ? "—" : String(value)}
                </Box>
              </Box>
            ))}
          </Box>
        </Section>

        {(item.original?.length ?? 0) > 0 && (
          <Box component="details" sx={{ fontSize: 13 }}>
            <Box component="summary" sx={{ cursor: "pointer", fontWeight: 600 }}>
              Original values · {item.sourceSheet}, row {item.sourceRow}
            </Box>
            <Box sx={{ mt: 1, display: "grid", gridTemplateColumns: "auto 1fr", gap: "4px 16px" }}>
              {item.original?.map((o, i) => (
                <Box key={i} sx={{ display: "contents" }}>
                  <Box component="span" sx={{ color: tokens.color.textMuted }}>{o.heading}</Box>
                  <span>{o.value}</span>
                </Box>
              ))}
            </Box>
          </Box>
        )}
      </Box>
      <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1.5, p: 2.5, borderTop: `1px solid ${tokens.color.border}` }}>
        <CommonButton variant="text" onClick={onClose}>Cancel</CommonButton>
        <CommonButton
          variant="contained"
          onClick={() => {
            onSave(withDiscount);
            onClose();
          }}
        >
          Save item
        </CommonButton>
      </Box>
    </Dialog>
  );
}
