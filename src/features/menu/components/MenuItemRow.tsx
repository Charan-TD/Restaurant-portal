import NextLink from "next/link";
import { Box, Typography } from "@mui/material";
import { ToggleSwitch } from "@/shared/components/form/ToggleSwitch";
import EditOutlined from "@mui/icons-material/EditOutlined";
import { tokens } from "@/core/theme/tokens";
import { CommonButton } from "@/shared/components/actions/CommonButton";
import { FoodTypeMark } from "@/shared/components/feedback/FoodTypeMark";
import { formatRupees } from "@/shared/utils/format";
import type { MenuItem } from "../models/menuItem";
import { MenuItemThumb } from "./MenuItemThumb";
import { MenuItemStatus } from "./MenuItemStatus";

function PriceValue({ item }: { item: MenuItem }) {
  // A dish with quantity options shows the range of their prices.
  if (item.quantities.length > 0) {
    const prices = item.quantities.map((q) => q.price),
      low = Math.min(...prices),
      high = Math.max(...prices);
    return <>{low === high ? formatRupees(low) : `${formatRupees(low)} – ${formatRupees(high)}`}</>;
  }
  if (item.discountedPrice === null) return <>{formatRupees(item.price)}</>;
  return (
    <>
      {formatRupees(item.discountedPrice)}{" "}
      <Box
        component="span"
        sx={{
          fontWeight: 400,
          fontSize: 13,
          color: tokens.color.textMuted,
          textDecoration: "line-through",
        }}
      >
        {formatRupees(item.price)}
      </Box>
    </>
  );
}

/** One dish: picture, name and price, the stock switch, and Edit / Delete. */
export function MenuItemRow({
  item,
  saving,
  onAvailable,
}: {
  item: MenuItem;
  saving: boolean;
  onAvailable: (available: boolean) => void;
}) {
  const detail = [
    ...(item.quantities.length ? item.quantities.map((q) => q.name) : [item.qtyType]),
    item.preparationMinutes ? `${item.preparationMinutes} min` : ""]
    .filter(Boolean)
    .join(" · ");
  return (
    <Box
      sx={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: 2,
        px: 2,
        py: 1.5,
        bgcolor: tokens.color.card,
        borderTop: `1px solid ${tokens.color.borderSubtle}`,
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          flex: "1 1 260px",
          minWidth: 0,
        }}
      >
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
            <Typography sx={{ fontWeight: 600, fontSize: 15 }} noWrap>
              {item.name}
            </Typography>
          </Box>
          <Typography sx={{ fontSize: 13, color: tokens.color.textMuted }} noWrap>
            <Box component="span" sx={{ fontWeight: 700, color: tokens.color.text }}>
              <PriceValue item={item} />
            </Box>
            {detail && ` · ${detail}`}
          </Typography>
          <MenuItemStatus item={item} />
        </Box>
      </Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 150 }}>
        <ToggleSwitch
          checked={item.available}
          disabled={saving}
          onChange={(_, checked) => onAvailable(checked)}
          slotProps={{
            input: {
              "aria-label": `${item.name} is ${item.available ? "in" : "out of"} stock`,
            },
          }}
        />
        <Typography
          sx={{
            fontSize: 13, whiteSpace: "nowrap",
            color: item.available ? tokens.color.success : tokens.color.textMuted,
          }}
        >
          {item.available ? "In stock" : "Out of stock"}
        </Typography>
      </Box>
      <Box sx={{ display: "flex", gap: 1 }}>
        <CommonButton
          variant="outlined"
          startIcon={<EditOutlined />}
          LinkComponent={NextLink}
          href={`/menu/items/${encodeURIComponent(item.id)}`}
          aria-label={`Edit ${item.name}`}
        >
          Edit
        </CommonButton>
      </Box>
    </Box>
  );
}
