"use client";
import { Fragment, useState } from "react";
import { Box, ButtonBase, Checkbox, TextField, Typography } from "@mui/material";
import DeleteOutlined from "@mui/icons-material/DeleteOutlined";
import { cardSx, tokens } from "@/core/theme/tokens";
import { CommonButton } from "@/shared/components/actions/CommonButton";
import { MAX_IMPORT_ROWS, type DraftItem, type ImportFoodType } from "../import/types";
import type { OwnFileImport } from "../viewmodels/useOwnFileImportViewModel";
import { ImportPhotoCell } from "./ImportPhotoCell";
import { ItemDetailsDialog } from "./ItemDetailsDialog";

const foodOptions: ImportFoodType[] = ["Veg", "Non-veg", "Egg"];
const filters = {
  all: "All items",
  attention: "Needs attention",
  ready: "Ready",
  prep: "Missing prep time",
  unassigned: "No category",
  photo: "Missing photos",
} as const;
type Filter = keyof typeof filters;

const chip = (color: string, bg = "transparent") => ({
  px: 1.5, py: 0.5, borderRadius: 99, fontSize: 12, fontWeight: 600, color, bgcolor: bg,
  border: `1px solid ${color === tokens.color.text ? tokens.color.border : color}`,
});
const cellSx = (error: boolean) => ({
  "& .MuiInputBase-root": { fontSize: 13, bgcolor: error ? tokens.color.errorBg : tokens.color.card },
  "& .MuiInputBase-input": { py: "7px", px: "10px" },
});
const th = { textAlign: "left", fontSize: 12, fontWeight: 700, p: 1.25, color: tokens.color.text, whiteSpace: "nowrap" } as const;

/** Step 2: every dish read from the file, grouped by category, with problem cells highlighted for fixing. */
export function ImportReviewStep({ vm }: { vm: OwnFileImport }) {
  const [search, setSearch] = useState(""),
    [filter, setFilter] = useState<Filter>("all"),
    [selected, setSelected] = useState<Set<string>>(new Set()),
    [editing, setEditing] = useState<DraftItem | null>(null),
    [bulkPrep, setBulkPrep] = useState(""),
    [bulkCategory, setBulkCategory] = useState(""),
    [addonName, setAddonName] = useState(""),
    [addonPrice, setAddonPrice] = useState(""),
    [renaming, setRenaming] = useState<{ from: string; value: string } | null>(null);
  const saveRename = () => {
    if (renaming?.value.trim()) vm.renameCategory(renaming.from, renaming.value);
    setRenaming(null);
  };

  const bad = new Set(vm.issues.map((i) => i.itemId)),
    categories = [...new Set(vm.items.map((i) => i.category.trim()).filter(Boolean))],
    unassigned = vm.items.filter((i) => !i.category.trim()).length,
    noPhoto = vm.items.filter((i) => !i.photo).length,
    query = search.trim().toLowerCase(),
    shown = vm.items.filter((i) => {
      if (query && ![i.name, i.category, i.subCategory, i.description].join(" ").toLowerCase().includes(query)) return false;
      if (filter === "attention") return bad.has(i.id);
      if (filter === "ready") return !bad.has(i.id);
      if (filter === "prep") return i.prepMinutes === null;
      if (filter === "unassigned") return !i.category.trim();
      if (filter === "photo") return !i.photo;
      return true;
    }),
    groups = [...new Set(shown.map((i) => i.category.trim()))].map((name) => ({
      name,
      rows: shown.filter((i) => i.category.trim() === name),
    })),
    ids = new Set([...selected].filter((id) => vm.items.some((i) => i.id === id)));
  const toggle = (id: string) =>
    setSelected((s) => {
      const next = new Set(s);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  const allShown = shown.length > 0 && shown.every((i) => ids.has(i.id));

  return (
    <Box sx={{ ...cardSx, p: { xs: 2, md: 3 }, display: "grid", gap: 2 }}>
      <Box>
        <Typography component="h2" sx={{ fontSize: 22, fontWeight: 700 }}>Review your imported menu</Typography>
        <Typography sx={{ fontSize: 14, color: tokens.color.textMuted }}>
          Your spreadsheet is already filled in below. Correct highlighted cells directly, or select many dishes to update them together.
        </Typography>
      </Box>

      <Box sx={{ p: 1.5, borderRadius: tokens.radius.input, bgcolor: tokens.color.sunken, fontSize: 13, display: "flex", gap: 1.5, alignItems: "center", flexWrap: "wrap" }}>
        <span>
          {vm.book?.filename} · {vm.sheet?.name} · Header row {vm.detection?.headerRow || "none"} · {vm.items.length} records
        </span>
        <CommonButton variant="text" onClick={vm.backToColumns}>Change sheet or column setup</CommonButton>
      </Box>

      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }} aria-label="Summary">
        <Box sx={chip(tokens.color.text, tokens.color.muted)}>{vm.items.length} imported / added</Box>
        <Box sx={chip(tokens.color.success)}>{vm.items.length - bad.size} valid</Box>
        <Box sx={chip(bad.size ? tokens.color.error : tokens.color.text)}>{bad.size} invalid</Box>
        <Box sx={chip(unassigned ? tokens.color.primary : tokens.color.text)}>{unassigned} unassigned</Box>
        <Box sx={chip(noPhoto ? tokens.color.error : tokens.color.success)}>{noPhoto} missing images</Box>
      </Box>
      {vm.tooMany && (
        <Typography role="alert" sx={{ fontSize: 13, color: tokens.color.error }}>
          An import takes up to {MAX_IMPORT_ROWS} dishes. Remove some, or import the rest as a second file.
        </Typography>
      )}

      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center" }}>
        <CommonButton variant="contained" onClick={vm.addItem}>+ Add item</CommonButton>
        <CommonButton variant="outlined" onClick={() => { vm.resetDraft(); setSelected(new Set()); }}>Reset imported draft</CommonButton>
        <CommonButton variant="text" onClick={() => setSelected(new Set(vm.items.map((i) => i.id)))}>Select all items</CommonButton>
        <CommonButton component="label" variant="outlined">
          Upload photos in bulk
          <input
            hidden
            multiple
            type="file"
            accept="image/*"
            aria-label="Upload photos in bulk"
            onChange={(e) => {
              void vm.attachPhotos(Array.from(e.target.files ?? []));
              e.target.value = "";
            }}
          />
        </CommonButton>
      </Box>
      <Typography sx={{ fontSize: 12, color: tokens.color.textMuted }}>
        Every dish needs a photo. Select all photos at once: they are matched by the sheet&apos;s photo-file column (e.g. masala_dosa.jpg), or by dish name when there is no such column (e.g. Masala Dosa.jpg). Unmatched or ambiguous names are listed so you can attach them by hand. Photos are resized to JPEG for you.
      </Typography>
      {vm.photoNote && (
        <Typography role="status" sx={{ fontSize: 13, color: tokens.color.info, bgcolor: tokens.color.infoBg, p: 1.25, borderRadius: tokens.radius.input }}>
          {vm.photoNote}
        </Typography>
      )}

      <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
        <TextField size="small" placeholder="Search menu" value={search} onChange={(e) => setSearch(e.target.value)} sx={{ flex: 1, minWidth: 220 }} />
        <TextField select size="small" label="Show items" value={filter} onChange={(e) => setFilter(e.target.value as Filter)} slotProps={{ select: { native: true } }} sx={{ width: 190 }}>
          {Object.entries(filters).map(([k, label]) => (
            <option key={k} value={k}>{label}</option>
          ))}
        </TextField>
        <CommonButton variant="text" onClick={() => setSelected(new Set(shown.map((i) => i.id)))}>Select filtered items</CommonButton>
      </Box>

      {ids.size > 0 && (
        <Box role="region" aria-label="Selected items" sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", alignItems: "center", p: 1.5, borderRadius: tokens.radius.input, bgcolor: tokens.color.primarySubtle, border: `1px solid ${tokens.color.primarySubtleBorder}` }}>
          <Typography sx={{ fontSize: 13, fontWeight: 700 }}>{ids.size} selected</Typography>
          <TextField size="small" type="number" label="Prep (min)" value={bulkPrep} onChange={(e) => setBulkPrep(e.target.value)} sx={{ width: 110 }} />
          <CommonButton variant="outlined" disabled={!(Number(bulkPrep) > 0)} onClick={() => vm.editMany(ids, { prepMinutes: Math.round(Number(bulkPrep)) })}>Set prep</CommonButton>
          <TextField size="small" label="Category" value={bulkCategory} onChange={(e) => setBulkCategory(e.target.value)} slotProps={{ htmlInput: { list: "import-categories" } }} sx={{ width: 150 }} />
          <CommonButton variant="outlined" disabled={!bulkCategory.trim()} onClick={() => vm.editMany(ids, { category: bulkCategory.trim() })}>Move to</CommonButton>
          {foodOptions.map((f) => (
            <CommonButton key={f} variant="outlined" onClick={() => vm.editMany(ids, { foodType: f, foodTypeText: "" })}>{f}</CommonButton>
          ))}
          <TextField size="small" label="Add-on" value={addonName} onChange={(e) => setAddonName(e.target.value)} sx={{ width: 130 }} />
          <TextField size="small" type="number" label="₹" value={addonPrice} onChange={(e) => setAddonPrice(e.target.value)} sx={{ width: 80 }} />
          <CommonButton variant="outlined" disabled={!addonName.trim() || addonPrice === "" || Number(addonPrice) < 0} onClick={() => vm.addAddonMany(ids, { name: addonName.trim(), price: Number(addonPrice), available: true, photo: null })}>Add add-on</CommonButton>
          <CommonButton variant="outlined" onClick={() => vm.editMany(ids, { available: true })}>In stock</CommonButton>
          <CommonButton variant="outlined" onClick={() => vm.editMany(ids, { available: false })}>Out of stock</CommonButton>
          <CommonButton variant="text" onClick={() => { vm.removeMany(ids); setSelected(new Set()); }}>Delete</CommonButton>
        </Box>
      )}
      <datalist id="import-categories">
        {categories.map((c) => <option key={c} value={c} />)}
      </datalist>

      <Typography sx={{ fontSize: 12, color: tokens.color.textMuted }}>
        Edit cells directly; changes save as you type. Highlighted fields need attention. Scroll across the table for more details.
      </Typography>
      <Box sx={{ overflowX: "auto", border: `1px solid ${tokens.color.border}`, borderRadius: tokens.radius.input }}>
        <Box component="table" sx={{ width: "100%", minWidth: 1420, borderCollapse: "collapse", "& td": { p: 1, verticalAlign: "middle", borderTop: `1px solid ${tokens.color.borderSubtle}` } }}>
          <thead>
            <tr style={{ background: tokens.color.sunken }}>
              <th style={{ ...th, width: 40 }}>
                <Checkbox size="small" checked={allShown} onChange={() => setSelected(allShown ? new Set() : new Set(shown.map((i) => i.id)))} slotProps={{ input: { "aria-label": "Select all shown" } }} />
              </th>
              {["Item name", "Price", "Sizes & discount", "Category", "Subcategory", "Veg / Non-veg", "Description", "Prep (min)", "Availability", "Photo", "Status", ""].map((h) => (
                <th key={h} style={th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {groups.length === 0 && (
              <tr><td colSpan={13} style={{ textAlign: "center", color: tokens.color.textMuted, padding: 24 }}>No dishes match.</td></tr>
            )}
            {groups.map((group) => (
              <Fragment key={group.name || "none"}>
                <tr>
                  <td colSpan={13} style={{ background: tokens.color.primarySubtle, fontSize: 13, fontWeight: 700, padding: "8px 12px" }}>
                    {renaming?.from === group.name && group.name ? (
                      <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
                        <TextField
                          autoFocus
                          size="small"
                          aria-label="Category name"
                          value={renaming.value}
                          onChange={(e) => setRenaming({ from: renaming.from, value: e.target.value })}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveRename();
                            if (e.key === "Escape") setRenaming(null);
                          }}
                          sx={{ ...cellSx(false), width: 220 }}
                        />
                        <CommonButton variant="contained" disabled={!renaming.value.trim()} onClick={saveRename}>Save</CommonButton>
                        <CommonButton variant="text" onClick={() => setRenaming(null)}>Cancel</CommonButton>
                      </Box>
                    ) : (
                      <>
                        {group.name || "Unassigned"} ({group.rows.length})
                        {group.name && (
                          <ButtonBase
                            onClick={() => setRenaming({ from: group.name, value: group.name })}
                            sx={{ ml: 1.5, fontSize: 12, fontWeight: 700, color: tokens.color.primary }}
                          >
                            Rename category
                          </ButtonBase>
                        )}
                      </>
                    )}
                  </td>
                </tr>
                {group.rows.map((item) => {
                  const mine = vm.issuesById.get(item.id) ?? [],
                    has = (f: string) => mine.some((i) => i.field === f),
                    why = (f: string) => mine.filter((i) => i.field === f).map((i) => i.message).join(" ");
                  return (
                    <tr key={item.id}>
                      <td>
                        <Checkbox size="small" checked={ids.has(item.id)} onChange={() => toggle(item.id)} slotProps={{ input: { "aria-label": `Select ${item.name || "dish"}` } }} />
                      </td>
                      <td style={{ minWidth: 170 }}>
                        <TextField size="small" value={item.name} title={why("name")} error={has("name")} onChange={(e) => vm.editItem(item.id, { name: e.target.value })} sx={cellSx(has("name"))} />
                        <Typography sx={{ fontSize: 11, color: tokens.color.textSubtle, mt: 0.25 }}>
                          {item.sourceRow ? `Row ${item.sourceRow}` : "Added here"}
                        </Typography>
                      </td>
                      <td>
                        <TextField size="small" type="number" value={item.price ?? ""} title={why("price")} error={has("price")} onChange={(e) => vm.editItem(item.id, { price: e.target.value === "" ? null : Number(e.target.value) })} sx={{ ...cellSx(has("price")), width: 96 }} />
                      </td>
                      <td style={{ minWidth: 190, fontSize: 12 }}>
                        {item.sizes.length ? (
                          item.sizes.map((s) => <div key={s.name}>{s.name}: ₹{s.price}</div>)
                        ) : (
                          <div style={{ color: tokens.color.textMuted }}>Single price</div>
                        )}
                        <Box component="span" sx={{ ...chip(has("discount") ? tokens.color.error : tokens.color.text), fontSize: 11, display: "inline-block", my: 0.5 }}>
                          {item.discountType === "percent" ? `${item.discPercent}% off` : item.discountType === "flat" ? `₹${item.flatAmount} off` : "No discount"}
                        </Box>
                        {(item.addons ?? []).length > 0 && (
                          <div style={{ color: has("addons") ? tokens.color.error : tokens.color.textMuted }}>
                            Add-ons: {item.addons.map((a) => `${a.name || "?"} ₹${a.price ?? "?"}`).join(", ")}
                          </div>
                        )}
                        <div>
                          <ButtonBase onClick={() => setEditing(item)} sx={{ fontSize: 12, fontWeight: 700, color: tokens.color.primary }}>
                            {item.sizes.length ? "Edit sizes / discount" : "Add sizes / discount"}
                          </ButtonBase>
                        </div>
                      </td>
                      <td>
                        <TextField size="small" value={item.category} title={why("category")} error={has("category")} onChange={(e) => vm.editItem(item.id, { category: e.target.value })} slotProps={{ htmlInput: { list: "import-categories" } }} sx={{ ...cellSx(has("category")), width: 150 }} />
                        {has("category") && <Box component="span" sx={{ display: "block", fontSize: 11, color: tokens.color.error }}>Required</Box>}
                      </td>
                      <td>
                        <TextField size="small" value={item.subCategory} placeholder="None" onChange={(e) => vm.editItem(item.id, { subCategory: e.target.value })} sx={{ ...cellSx(false), width: 140 }} />
                      </td>
                      <td>
                        <TextField select size="small" value={item.foodType} title={item.foodTypeText ? `The file says “${item.foodTypeText}”` : ""} onChange={(e) => vm.editItem(item.id, { foodType: e.target.value as ImportFoodType, foodTypeText: "" })} slotProps={{ select: { native: true } }} sx={{ ...cellSx(!!item.foodTypeText || has("foodType")), width: 120 }}>
                          <option value="">{item.foodTypeText ? `“${item.foodTypeText}”?` : "Not set"}</option>
                          {foodOptions.map((f) => <option key={f}>{f}</option>)}
                        </TextField>
                        {has("foodType") && <Box component="span" sx={{ display: "block", fontSize: 11, color: tokens.color.error }}>Required</Box>}
                      </td>
                      <td>
                        <TextField size="small" value={item.description} onChange={(e) => vm.editItem(item.id, { description: e.target.value })} sx={{ ...cellSx(false), width: 170 }} />
                      </td>
                      <td>
                        <TextField size="small" type="number" value={item.prepMinutes ?? ""} title={why("prepMinutes")} error={has("prepMinutes")} onChange={(e) => vm.editItem(item.id, { prepMinutes: e.target.value === "" ? null : Number(e.target.value) })} sx={{ ...cellSx(has("prepMinutes")), width: 84 }} />
                        {has("prepMinutes") && <Box component="span" sx={{ display: "block", fontSize: 11, color: tokens.color.error }}>Required</Box>}
                      </td>
                      <td>
                        <TextField select size="small" value={item.available ? "yes" : "no"} onChange={(e) => vm.editItem(item.id, { available: e.target.value === "yes" })} slotProps={{ select: { native: true } }} sx={{ ...cellSx(false), width: 110 }}>
                          <option value="yes">In stock</option>
                          <option value="no">Out of stock</option>
                        </TextField>
                      </td>
                      <td>
                        <ImportPhotoCell file={item.photo} name={item.name} missing={has("photo")} onPick={(f) => void vm.setPhoto(item.id, f)} onRemove={() => vm.removePhoto(item.id)} />
                      </td>
                      <td>
                        <Box component="span" title={mine.map((i) => i.message).join(" ")} sx={{ px: 1.25, py: 0.4, borderRadius: 99, fontSize: 12, fontWeight: 700, whiteSpace: "nowrap", color: mine.length ? tokens.color.error : "#fff", bgcolor: mine.length ? tokens.color.errorBg : tokens.color.success }}>
                          {mine.length ? `${mine.length} to fix` : "Ready"}
                        </Box>
                      </td>
                      <td style={{ whiteSpace: "nowrap" }}>
                        <CommonButton variant={mine.length ? "contained" : "outlined"} onClick={() => setEditing(item)} sx={{ mr: 1 }}>
                          More details
                        </CommonButton>
                        <ButtonBase aria-label={`Delete ${item.name || "dish"}`} onClick={() => vm.removeItem(item.id)} sx={{ width: 30, height: 30, borderRadius: "50%", color: tokens.color.error }}>
                          <DeleteOutlined sx={{ fontSize: 19 }} />
                        </ButtonBase>
                      </td>
                    </tr>
                  );
                })}
              </Fragment>
            ))}
          </tbody>
        </Box>
      </Box>
      <CommonButton variant="contained" disabled={vm.items.length === 0} onClick={vm.toCheck} sx={{ width: "100%" }}>
        Review & validate
      </CommonButton>
      {editing && (
        <ItemDetailsDialog
          key={editing.id}
          item={vm.items.find((i) => i.id === editing.id) ?? editing}
          categories={categories}
          qtyNames={vm.qtyNames}
          siblings={vm.items}
          onClose={() => setEditing(null)}
          onSave={(next) => vm.editItem(editing.id, next)}
        />
      )}
    </Box>
  );
}
