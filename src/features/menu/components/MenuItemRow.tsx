import NextLink from "next/link";
import {
  Box,
  Chip,
  IconButton,
  Switch,
  Tooltip,
  Typography,
} from "@mui/material";
import EditOutlined from "@mui/icons-material/EditOutlined";
import DeleteOutline from "@mui/icons-material/DeleteOutlined";
import { FoodTypeMark } from "@/shared/components/feedback/FoodTypeMark";
import { formatRupees } from "@/shared/utils/format";
import type { MenuItem } from "../models/menuItem";
import { MenuItemThumb } from "./MenuItemThumb";
import { MenuItemStatus } from "./MenuItemStatus";
import { InfoCell, rowSx } from "./InfoCell";

const squareButton = {
  width: 40,
  height: 40,
  borderRadius: "10px",
  bgcolor: "#f3f4f2",
  color: "text.secondary",
} as const;

function PriceValue({ item }: { item: MenuItem }) {
  if (item.discountedPrice === null) return <>{formatRupees(item.price)}</>;
  return (
    <>
      {formatRupees(item.discountedPrice)}{" "}
      <Typography
        component="span"
        variant="caption"
        color="text.secondary"
        sx={{ textDecoration: "line-through", fontWeight: 500 }}
      >
        {formatRupees(item.price)}
      </Typography>
    </>
  );
}

/** One dish as a row of captioned columns, like the live orders list. */
export function MenuItemRow({
  item,
  saving,
  onDelete,
  onAvailable,
}: {
  item: MenuItem;
  saving: boolean;
  onDelete: () => void;
  onAvailable: (available: boolean) => void;
}) {
  return (
    <Box
      sx={rowSx(
        "minmax(220px, 2fr) minmax(110px, 1fr) 120px 100px 120px 190px auto",
      )}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          minWidth: 0,
          gridColumn: { xs: "1 / -1", lg: "auto" },
        }}
      >
        <MenuItemThumb images={item.images} name={item.name} size={56} />
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontWeight: 800 }} noWrap>
            {item.name}
          </Typography>
          {item.description && (
            <Typography variant="body2" color="text.secondary" noWrap>
              {item.description}
            </Typography>
          )}
          <MenuItemStatus item={item} />
        </Box>
      </Box>
      <InfoCell
        value={
          [item.category, item.subCategory].filter(Boolean).join(" · ") || "–"
        }
        caption="Category"
      />
      <InfoCell
        value={
          item.foodType ? (
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 0.75,
                whiteSpace: "nowrap",
                "& .food-mark": { m: 0 },
              }}
            >
              <FoodTypeMark type={item.foodType} />
              {item.foodType}
            </Box>
          ) : (
            "–"
          )
        }
        caption="Food type"
      />
      <InfoCell value={`${item.preparationMinutes} min`} caption="Prep time" />
      <InfoCell strong value={<PriceValue item={item} />} caption="Price" />
      <InfoCell
        value={
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Switch
              size="small"
              checked={item.available}
              disabled={saving}
              onChange={(_, checked) => onAvailable(checked)}
              slotProps={{
                input: {
                  "aria-label": `${item.name} is ${item.available ? "in" : "out of"} stock`,
                },
              }}
            />
            <Chip
              size="small"
              label={item.available ? "In stock" : "Out of stock"}
              sx={{
                fontWeight: 700,
                bgcolor: item.available
                  ? "rgba(46,125,50,.12)"
                  : "rgba(211,47,47,.1)",
                color: item.available ? "success.main" : "error.main",
              }}
            />
          </Box>
        }
        caption="Stock"
      />
      <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
        <Tooltip title="Edit">
          <IconButton
            component={NextLink}
            href={`/menu/items/${encodeURIComponent(item.id)}`}
            aria-label={`Edit ${item.name}`}
            sx={squareButton}
          >
            <EditOutlined fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Delete">
          <IconButton
            onClick={onDelete}
            aria-label={`Delete ${item.name}`}
            sx={squareButton}
          >
            <DeleteOutline fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
}
