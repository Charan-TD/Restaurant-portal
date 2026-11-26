"use client";
import { useMemo, useState } from "react";
import {
  Box,
  ButtonBase,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
} from "@mui/material";
import CheckBoxOutlineBlank from "@mui/icons-material/CheckBoxOutlineBlank";
import CheckBox from "@mui/icons-material/CheckBox";
import CloseOutlined from "@mui/icons-material/CloseOutlined";
import SearchOutlined from "@mui/icons-material/SearchOutlined";
import { tokens } from "@/core/theme/tokens";
import { CommonButton } from "@/shared/components/actions/CommonButton";
import { FoodTypeMark } from "@/shared/components/feedback/FoodTypeMark";
import { CommonTextField } from "@/shared/components/form/CommonTextField";
import { formatRupees } from "@/shared/utils/format";
import type { MenuItem } from "../models/menuItem";

/** The price a passenger sees first: the lowest quantity, else the discounted or plain price. */
const shownPrice = (i: MenuItem) =>
  i.quantities.length
    ? Math.min(...i.quantities.map((q) => q.price))
    : (i.discountedPrice ?? i.price);

/**
 * "Add pinned items": every dish, grouped by category, with up to five ticked.
 * Opens with the current pins ticked; Save pins those and unpins the rest.
 */
export function AddPinnedDialog({
  open,
  items,
  pinnedIds,
  onClose,
  onSave,
}: {
  open: boolean;
  items: MenuItem[];
  pinnedIds: string[];
  onClose: () => void;
  /** Resolves true when saved. */
  onSave: (ids: string[]) => Promise<boolean>;
}) {
  // Remount with the current pins each time it opens.
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs" scroll="paper">
      {open && <Body items={items} pinnedIds={pinnedIds} onClose={onClose} onSave={onSave} />}
    </Dialog>
  );
}

function Body({
  items,
  pinnedIds,
  onClose,
  onSave,
}: {
  items: MenuItem[];
  pinnedIds: string[];
  onClose: () => void;
  onSave: (ids: string[]) => Promise<boolean>;
}) {
  const [chosen, setChosen] = useState<string[]>(pinnedIds),
    [term, setTerm] = useState(""),
    [saving, setSaving] = useState(false),
    groups = useMemo(() => {
      const query = term.trim().toLowerCase(),
        map = new Map<string, MenuItem[]>();
      for (const item of items) {
        if (query && !item.name.toLowerCase().includes(query)) continue;
        const key = item.category.trim() || "Uncategorised";
        map.set(key, [...(map.get(key) ?? []), item]);
      }
      return [...map.entries()];
    }, [items, term]);
  const toggle = (id: string) =>
    setChosen((now) =>
      now.includes(id) ? now.filter((x) => x !== id) : [...now, id],
    );
  return (
    <>
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <Box>
            <Typography sx={{ fontSize: 18, fontWeight: 700 }}>Add pinned items</Typography>
            <Typography sx={{ fontSize: 12, color: tokens.color.link }}>
              Select the items to pin
            </Typography>
          </Box>
          <IconButton aria-label="Close" onClick={onClose}>
            <CloseOutlined />
          </IconButton>
        </Box>
        <Box sx={{ mt: 1.5 }}>
          <CommonTextField
            placeholder="Search items"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            inputPrefix={<SearchOutlined fontSize="small" />}
            slotProps={{ htmlInput: { "aria-label": "Search items" } }}
          />
        </Box>
      </DialogTitle>
      <DialogContent dividers sx={{ px: 1.5, py: 1 }}>
        {groups.length === 0 && (
          <Typography sx={{ p: 2, color: tokens.color.textMuted }}>No items found.</Typography>
        )}
        {groups.map(([category, list]) => (
          <Box key={category} sx={{ mb: 1 }}>
            <Typography
              sx={{
                px: 1,
                py: 0.75,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.5px",
                textTransform: "uppercase",
                color: tokens.color.textMuted,
              }}
            >
              {category}
            </Typography>
            {list.map((item) => {
              const on = chosen.includes(item.id);
              return (
                <ButtonBase
                  key={item.id}
                  role="checkbox"
                  aria-checked={on}
                  onClick={() => toggle(item.id)}
                  sx={{
                    display: "flex",
                    width: "100%",
                    justifyContent: "flex-start",
                    gap: 1.25,
                    px: 1,
                    py: 0.9,
                    borderRadius: "8px",
                    textAlign: "left",
                    fontSize: 14,
                    fontWeight: on ? 700 : 400,
                    bgcolor: on ? tokens.color.primarySubtle : "transparent",
                  }}
                >
                  {on ? (
                    <CheckBox sx={{ color: tokens.color.primary }} />
                  ) : (
                    <CheckBoxOutlineBlank sx={{ color: tokens.color.textSubtle }} />
                  )}
                  {item.foodType && (
                    <Box sx={{ display: "inline-flex", "& .food-mark": { m: 0 } }}>
                      <FoodTypeMark type={item.foodType} />
                    </Box>
                  )}
                  <Box component="span" sx={{ flex: 1, minWidth: 0 }}>
                    {item.name}
                  </Box>
                  <Box component="span" sx={{ fontWeight: 400, color: tokens.color.textMuted }}>
                    {formatRupees(shownPrice(item))}
                  </Box>
                </ButtonBase>
              );
            })}
          </Box>
        ))}
      </DialogContent>
      <DialogActions sx={{ justifyContent: "space-between", px: 3, py: 2 }}>
        <Typography sx={{ fontSize: 13, fontWeight: 700 }}>
          {chosen.length} selected
        </Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
          <CommonButton variant="outlined" onClick={onClose} disabled={saving}>
            Cancel
          </CommonButton>
          <CommonButton
            variant="contained"
            disabled={saving}
            onClick={async () => {
              setSaving(true);
              const ok = await onSave(chosen);
              setSaving(false);
              if (ok) onClose();
            }}
          >
            {saving ? "Saving…" : "Save"}
          </CommonButton>
        </Box>
      </DialogActions>
    </>
  );
}
