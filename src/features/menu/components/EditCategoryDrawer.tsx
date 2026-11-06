"use client";
import { useState } from "react";
import { Box, ButtonBase, Drawer, Typography } from "@mui/material";
import AddOutlined from "@mui/icons-material/AddOutlined";
import CloseOutlined from "@mui/icons-material/CloseOutlined";
import { tokens, tokenScopeSx } from "@/core/theme/tokens";
import { CommonTextField } from "@/shared/components/form/CommonTextField";
import { ToggleSwitch } from "@/shared/components/form/ToggleSwitch";
import type { CategoryNode } from "../models/menuGroups";

interface Row {
  /** Server id; none for a sub category added in this panel. */
  id?: string;
  name: string;
  original: string;
  active: boolean;
  wasActive: boolean;
  owned: boolean;
  count: number;
}

const plural = (n: number) => `${n} ${n === 1 ? "item" : "items"}`;

/**
 * Edit category: rename it, switch its sub categories on or off for
 * passengers, add more. A category an admin created keeps its name; it can
 * still be switched off, and that only changes this restaurant's menu.
 */
export function EditCategoryDrawer({
  category,
  onClose,
  onSave,
}: {
  category: CategoryNode;
  onClose: () => void;
  onSave: (changes: {
    rename?: { id: string; name: string };
    subRenames: { id: string; name: string }[];
    switches: { id: string; active: boolean; name: string }[];
    added: string[];
  }) => Promise<boolean>;
}) {
  const [name, setName] = useState(category.name),
    [rows, setRows] = useState<Row[]>(() =>
      category.subs.map((s) => ({
        id: s.id,
        name: s.name,
        original: s.name,
        active: s.active,
        wasActive: s.active,
        owned: s.owned,
        count: s.items.length,
      })),
    ),
    [saving, setSaving] = useState(false),
    nameTaken = (value: string, index?: number) =>
      rows.some((r, i) => i !== index && r.name.trim().toLowerCase() === value.trim().toLowerCase()),
    blank = !name.trim() || rows.some((r) => !r.name.trim()),
    update = (index: number, change: Partial<Row>) =>
      setRows((list) => list.map((r, i) => (i === index ? { ...r, ...change } : r)));
  const save = async () => {
    if (blank || saving) return;
    setSaving(true);
    const ok = await onSave({
      rename:
        category.owned && category.id && name.trim() !== category.name
          ? { id: category.id, name: name.trim() }
          : undefined,
      subRenames: rows.flatMap((r) =>
        r.id && r.owned && r.name.trim() !== r.original ? [{ id: r.id, name: r.name.trim() }] : [],
      ),
      switches: rows.flatMap((r) =>
        r.id && r.active !== r.wasActive ? [{ id: r.id, active: r.active, name: r.name }] : [],
      ),
      added: rows.filter((r) => !r.id).map((r) => r.name.trim()),
    });
    setSaving(false);
    if (ok) onClose();
  };
  return (
    <Drawer
      anchor="right"
      open
      onClose={onClose}
      slotProps={{
        paper: {
          sx: { ...tokenScopeSx, width: { xs: "100%", sm: 440 }, bgcolor: tokens.color.card },
        },
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 2.5, height: 64, borderBottom: `1px solid ${tokens.color.border}` }}>
        <ButtonBase aria-label="Close" onClick={onClose} sx={{ width: 32, height: 32, borderRadius: "50%" }}>
          <CloseOutlined sx={{ fontSize: 20 }} />
        </ButtonBase>
        <Typography component="h2" sx={{ fontSize: 18, fontWeight: 700 }}>
          Edit category
        </Typography>
      </Box>
      <Box sx={{ flex: 1, overflowY: "auto", p: 2.5 }}>
        <Typography component="label" htmlFor="category-name" sx={{ display: "block", mb: 0.75, fontSize: 14, fontWeight: 600 }}>
          Category name
        </Typography>
        <CommonTextField
          id="category-name"
          value={name}
          disabled={!category.owned}
          onChange={(e) => setName(e.target.value)}
          helperText={category.owned ? undefined : "Created by TrainDhaba, so the name cannot be changed."}
          slotProps={{ htmlInput: { maxLength: 255 } }}
        />
        <Typography sx={{ mt: 3, fontSize: 16, fontWeight: 700 }}>Sub-categories</Typography>
        <Typography sx={{ mb: 1.5, fontSize: 12, color: tokens.color.textMuted }}>
          Switch off to hide from passengers
        </Typography>
        <Box sx={{ display: "grid", gap: 1.25 }}>
          {rows.map((row, i) => (
            <Box key={row.id ?? `new-${i}`} sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <CommonTextField
                value={row.name}
                disabled={!!row.id && !row.owned}
                error={nameTaken(row.name, i)}
                onChange={(e) => update(i, { name: e.target.value })}
                slotProps={{ htmlInput: { maxLength: 255, "aria-label": "Sub-category name" } }}
                sx={{ flex: 1 }}
              />
              <Typography sx={{ minWidth: 48, fontSize: 12, color: tokens.color.textMuted }}>
                {row.id ? plural(row.count) : "New"}
              </Typography>
              <ToggleSwitch
                checked={row.active}
                disabled={!row.id}
                onChange={(e) => update(i, { active: e.target.checked })}
                slotProps={{ input: { "aria-label": `${row.name} on` } }}
              />
            </Box>
          ))}
        </Box>
        <ButtonBase
          onClick={() => setRows((list) => [...list, { name: "", original: "", active: true, wasActive: true, owned: true, count: 0 }])}
          sx={{ mt: 2, gap: 0.75, fontSize: 14, fontWeight: 600, color: tokens.color.link }}
        >
          <AddOutlined sx={{ fontSize: 18 }} />
          Add sub-category
        </ButtonBase>
      </Box>
      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: 1.5, p: 2.5, borderTop: `1px solid ${tokens.color.border}` }}>
        <ButtonBase onClick={onClose} sx={{ height: 48, borderRadius: "10px", fontSize: 14, fontWeight: 700, bgcolor: tokens.color.muted }}>
          Cancel
        </ButtonBase>
        <ButtonBase
          disabled={blank || saving}
          onClick={() => void save()}
          sx={{ height: 48, borderRadius: "10px", fontSize: 14, fontWeight: 700, color: "#fff", bgcolor: tokens.color.primary, "&.Mui-disabled": { opacity: 0.6, color: "#fff" } }}
        >
          {saving ? "Saving…" : "Save changes"}
        </ButtonBase>
      </Box>
    </Drawer>
  );
}
