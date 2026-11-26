"use client";
import { useState } from "react";
import { Box, ButtonBase, Typography } from "@mui/material";
import AddOutlined from "@mui/icons-material/AddOutlined";
import DragIndicatorRounded from "@mui/icons-material/DragIndicatorRounded";
import PushPinOutlined from "@mui/icons-material/PushPinOutlined";
import { cardSx, tokens } from "@/core/theme/tokens";
import { CommonButton } from "@/shared/components/actions/CommonButton";
import { FoodTypeMark } from "@/shared/components/feedback/FoodTypeMark";
import { ToggleSwitch } from "@/shared/components/form/ToggleSwitch";
import { moveBefore } from "../models/menuPins";
import type { MenuItem } from "../models/menuItem";
import { MenuItemThumb } from "./MenuItemThumb";
import { PriceValue } from "./MenuItemRow";

/**
 * Pinned items: the dishes shown at the top of the menu for passengers, so
 * they know what sells most. Drag a row (or use the arrow keys on its handle)
 * to change the order.
 */
export function PinnedPanel({
  pinned,
  isSaving,
  onAvailable,
  onRemove,
  onReorder,
  onAdd,
}: {
  pinned: MenuItem[];
  isSaving: (id: string) => boolean;
  onAvailable: (item: MenuItem, available: boolean) => void;
  onRemove: (item: MenuItem) => void;
  onReorder: (ids: string[]) => void;
  onAdd: () => void;
}) {
  const [dragging, setDragging] = useState<string | null>(null),
    [over, setOver] = useState<string | null>(null),
    ids = pinned.map((i) => i.id);
  return (
    <Box sx={{ ...cardSx, p: 3 }}>
      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2, mb: 2 }}>
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: "flex", alignItems: "baseline", gap: 1.25 }}>
            <Typography sx={{ fontSize: 18, fontWeight: 700 }}>Pinned items</Typography>
            <Typography sx={{ fontSize: 13, color: tokens.color.textMuted }}>
              {pinned.length} {pinned.length === 1 ? "item" : "items"}
            </Typography>
          </Box>
          <Typography sx={{ fontSize: 13, color: tokens.color.textMuted }}>
            Shown at the top of your menu for passengers. Drag to change the order.
          </Typography>
        </Box>
        <CommonButton variant="outlined" startIcon={<AddOutlined />} onClick={onAdd}>
          Add items
        </CommonButton>
      </Box>
      {pinned.length === 0 ? (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            gap: 1,
            py: 6,
          }}
        >
          <PushPinOutlined sx={{ fontSize: 44, color: tokens.color.textSubtle }} />
          <Typography sx={{ fontSize: 16, fontWeight: 700 }}>No pinned items yet</Typography>
          <Typography sx={{ color: tokens.color.textMuted }}>
            Pin your best sellers so passengers see them first.
          </Typography>
        </Box>
      ) : (
        <Box
          sx={{
            border: `1px solid ${tokens.color.border}`,
            borderRadius: tokens.radius.input,
            overflow: "hidden",
          }}
        >
          {pinned.map((item, i) => (
            <Box
              key={item.id}
              draggable
              onDragStart={(e) => {
                setDragging(item.id);
                e.dataTransfer.effectAllowed = "move";
                e.dataTransfer.setData("text/plain", item.id);
              }}
              onDragOver={(e) => {
                if (!dragging) return;
                e.preventDefault();
                setOver(item.id);
              }}
              onDrop={(e) => {
                e.preventDefault();
                if (dragging) onReorder(moveBefore(ids, dragging, item.id));
                setDragging(null);
                setOver(null);
              }}
              onDragEnd={() => {
                setDragging(null);
                setOver(null);
              }}
              sx={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                gap: 2,
                px: 2,
                py: 1.5,
                bgcolor: tokens.color.card,
                borderTop: i ? `1px solid ${tokens.color.borderSubtle}` : 0,
                opacity: dragging === item.id ? 0.5 : 1,
                boxShadow:
                  over === item.id && dragging !== item.id
                    ? `inset 0 2px 0 ${tokens.color.primary}`
                    : "none",
              }}
            >
              <ButtonBase
                aria-label={`Move ${item.name}. Use the up and down arrow keys.`}
                onKeyDown={(e) => {
                  const at = ids.indexOf(item.id),
                    to = e.key === "ArrowUp" ? at - 1 : e.key === "ArrowDown" ? at + 1 : -1;
                  if (to < 0 || to >= ids.length) return;
                  e.preventDefault();
                  const next = [...ids];
                  [next[at], next[to]] = [next[to], next[at]];
                  onReorder(next);
                }}
                sx={{ cursor: "grab", color: tokens.color.textSubtle }}
              >
                <DragIndicatorRounded fontSize="small" />
              </ButtonBase>
              <Typography sx={{ width: 16, fontWeight: 700, color: tokens.color.textMuted }}>
                {i + 1}
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flex: "1 1 240px", minWidth: 0 }}>
                <Box sx={{ "& .menu-thumb": { borderRadius: "10px" } }}>
                  <MenuItemThumb images={item.images} name={item.name} size={48} />
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                    {item.foodType && (
                      <Box sx={{ display: "inline-flex", "& .food-mark": { m: 0 } }}>
                        <FoodTypeMark type={item.foodType} />
                      </Box>
                    )}
                    <Typography noWrap sx={{ fontWeight: 600, fontSize: 15 }}>
                      {item.name}
                    </Typography>
                  </Box>
                  <Typography noWrap sx={{ fontSize: 13, color: tokens.color.textMuted }}>
                    <Box component="span" sx={{ fontWeight: 700, color: tokens.color.text }}>
                      <PriceValue item={item} />
                    </Box>
                    {item.category.trim() && ` · ${item.category.trim()}`}
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 130 }}>
                <ToggleSwitch
                  checked={item.available}
                  disabled={isSaving(item.id)}
                  onChange={(_, checked) => onAvailable(item, checked)}
                  slotProps={{
                    input: {
                      "aria-label": `${item.name} is ${item.available ? "in" : "out of"} stock`,
                    },
                  }}
                />
                <Typography
                  sx={{
                    fontSize: 13,
                    whiteSpace: "nowrap",
                    color: item.available ? tokens.color.success : tokens.color.textMuted,
                  }}
                >
                  {item.available ? "In stock" : "Out of stock"}
                </Typography>
              </Box>
              <CommonButton variant="outlined" onClick={() => onRemove(item)}>
                Remove
              </CommonButton>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}
