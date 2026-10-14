"use client";
import NextLink from "next/link";
import type { ReactNode } from "react";
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Switch,
  Tooltip,
  Typography,
} from "@mui/material";
import AddOutlined from "@mui/icons-material/AddOutlined";
import EditOutlined from "@mui/icons-material/EditOutlined";
import DeleteOutline from "@mui/icons-material/DeleteOutlined";
import RestaurantMenuOutlined from "@mui/icons-material/RestaurantMenuOutlined";
import RoomServiceOutlined from "@mui/icons-material/RoomServiceOutlined";
import Inventory2Outlined from "@mui/icons-material/Inventory2Outlined";
import HighlightOffOutlined from "@mui/icons-material/HighlightOffOutlined";
import ScheduleOutlined from "@mui/icons-material/ScheduleOutlined";
import { PageHeader } from "@/shared/components/layout/PageHeader";
import { CommonCard } from "@/shared/components/layout/CommonCard";
import { CommonButton } from "@/shared/components/actions/CommonButton";
import { FoodTypeMark } from "@/shared/components/feedback/FoodTypeMark";
import { formatRupees } from "@/shared/utils/format";
import type { MenuItem } from "../models/menuItem";
import { MenuItemThumb } from "../components/MenuItemThumb";
import { MenuItemStatus } from "../components/MenuItemStatus";
import { MenuFilters } from "../components/MenuFilters";
import { useMenuItemsViewModel } from "../viewmodels/useMenuItemsViewModel";
function Price({ item }: { item: MenuItem }) {
  if (item.discountedPrice === null)
    return (
      <Box sx={{ minWidth: 72, textAlign: "right" }}>
        <strong>{formatRupees(item.price)}</strong>
      </Box>
    );
  return (
    <Box sx={{ minWidth: 72, textAlign: "right" }}>
      <strong>{formatRupees(item.discountedPrice)}</strong>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ display: "block", textDecoration: "line-through" }}
      >
        {formatRupees(item.price)}
      </Typography>
    </Box>
  );
}
function StatCard({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: number;
  icon: ReactNode;
  tone: { bg: string; fg: string; tint: string };
}) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        alignItems: { xs: "flex-start", sm: "center" },
        gap: { xs: 1, sm: 2 },
        p: { xs: 1.5, sm: 2.5 },
        borderRadius: "16px",
        bgcolor: tone.tint,
      }}
    >
      <Box
        sx={{
          width: { xs: 40, sm: 56 },
          height: { xs: 40, sm: 56 },
          borderRadius: "14px",
          display: "grid",
          placeItems: "center",
          bgcolor: tone.bg,
          color: tone.fg,
        }}
      >
        {icon}
      </Box>
      <div>
        <Typography color="text.secondary">{label}</Typography>
        <Typography sx={{ fontSize: 28, fontWeight: 800, lineHeight: 1.15 }}>
          {value}
        </Typography>
      </div>
    </Box>
  );
}
const squareButton = {
  width: 40,
  height: 40,
  borderRadius: "10px",
  bgcolor: "#f3f4f2",
  color: "text.secondary",
} as const;
function ItemRow({
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
      sx={{
        display: "flex",
        alignItems: "center",
        flexWrap: "wrap",
        gap: { xs: 1.5, md: 2.5 },
        p: 2,
        borderRadius: "14px",
        border: 1,
        borderColor: "divider",
        bgcolor: "background.paper",
      }}
    >
      <MenuItemThumb images={item.images} name={item.name} size={76} />
      <Box sx={{ flex: "1 1 200px", minWidth: 0 }}>
        <Typography sx={{ fontWeight: 800, fontSize: 18 }} noWrap>
          {item.name}
        </Typography>
        {item.description && (
          <Typography variant="body2" color="text.secondary" noWrap>
            {item.description}
          </Typography>
        )}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 1.5,
            mt: 0.75,
            color: "text.secondary",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <ScheduleOutlined sx={{ fontSize: 18 }} />
            <Typography variant="body2">
              {item.preparationMinutes} min
            </Typography>
          </Box>
          {item.foodType && (
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 0.75,
                height: 26,
                px: 1.25,
                border: 1,
                borderColor: "divider",
                borderRadius: 999,
                fontSize: 13,
                fontWeight: 600,
                lineHeight: 1,
                color: "text.primary",
                "& .food-mark": { m: 0 },
              }}
            >
              <FoodTypeMark type={item.foodType} />
              {item.foodType}
            </Box>
          )}
          {(item.subCategory || item.category) && (
            <Typography variant="body2">
              {[item.category, item.subCategory].filter(Boolean).join(" · ")}
            </Typography>
          )}
          <MenuItemStatus item={item} />
        </Box>
      </Box>
      <Price item={item} />
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          pl: 2.5,
          borderLeft: { md: 1 },
          borderColor: "divider",
        }}
      >
        <Switch
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
            minWidth: 92,
            bgcolor: item.available ? "rgba(46,125,50,.12)" : "rgba(211,47,47,.1)",
            color: item.available ? "success.main" : "error.main",
          }}
        />
      </Box>
      <Box sx={{ display: "flex", gap: 1, flexShrink: 0 }}>
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
export function MenuItemsView() {
  const vm = useMenuItemsViewModel(),
    total = vm.items.length;
  return (
    <>
      <PageHeader
        eyebrow="Menu / Items"
        title="Menu items"
        subtitle="Manage your dishes, prices and stock status."
        actions={
          <CommonButton
            variant="contained"
            startIcon={<AddOutlined />}
            href="/menu/add"
            LinkComponent={NextLink}
          >
            Add item
          </CommonButton>
        }
      />
      {vm.error && (
        <Alert severity="error" onClose={vm.dismissError} sx={{ mb: 3 }}>
          {vm.error}
        </Alert>
      )}
      <Box
        sx={{
          display: "grid",
          gap: { xs: 1.5, md: 2.5 },
          mb: 3,
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
        }}
      >
        <StatCard
          label="Total items"
          value={total}
          icon={<RoomServiceOutlined />}
          tone={{ bg: "rgba(242,106,46,.12)", fg: "#f26a2e", tint: "#fdf1ea" }}
        />
        <StatCard
          label="In stock"
          value={vm.availableCount}
          icon={<Inventory2Outlined />}
          tone={{ bg: "rgba(46,125,50,.12)", fg: "#2e7d32", tint: "#eef7ef" }}
        />
        <StatCard
          label="Out of stock"
          value={total - vm.availableCount}
          icon={<HighlightOffOutlined />}
          tone={{ bg: "rgba(211,47,47,.1)", fg: "#d32f2f", tint: "#fdf0f0" }}
        />
      </Box>
      <CommonCard>
        <MenuFilters
          search={vm.search}
          onSearch={vm.setSearch}
          foodFilter={vm.foodFilter}
          onFoodFilter={vm.setFoodFilter}
        />
        {vm.loading ? (
          <Box sx={{ display: "grid", placeItems: "center", py: 6 }}>
            <CircularProgress aria-label="Loading menu items" />
          </Box>
        ) : vm.items.length === 0 ? (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              gap: 1.5,
              py: 6,
            }}
          >
            <RestaurantMenuOutlined color="disabled" sx={{ fontSize: 48 }} />
            <Typography variant="h6">No menu items yet</Typography>
            <Typography color="text.secondary" sx={{ maxWidth: 420 }}>
              Add your first dish with its price, picture and food type.
            </Typography>
            <CommonButton
              variant="outlined"
              href="/menu/add"
              LinkComponent={NextLink}
              sx={{ mt: 1 }}
            >
              Add item
            </CommonButton>
          </Box>
        ) : vm.visible.length === 0 ? (
          <Typography color="text.secondary" sx={{ py: 4 }}>
            No items match your search.
          </Typography>
        ) : (
          <Box sx={{ display: "grid", gap: 1.5, mt: 2 }}>
            {vm.visible.map((item) => (
              <ItemRow
                key={item.id}
                item={item}
                saving={vm.isSaving(item.id)}
                onDelete={() => vm.askDelete(item)}
                onAvailable={(available) =>
                  void vm.setAvailable(item, available)
                }
              />
            ))}
          </Box>
        )}
      </CommonCard>
      <Dialog open={!!vm.pendingDelete} onClose={vm.cancelDelete}>
        <DialogTitle>Delete {vm.pendingDelete?.name}?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            The item will be removed from your menu. This cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <CommonButton onClick={vm.cancelDelete} disabled={vm.deleting}>
            Cancel
          </CommonButton>
          <CommonButton
            color="error"
            variant="contained"
            onClick={() => void vm.confirmDelete()}
            disabled={vm.deleting}
          >
            {vm.deleting ? "Deleting…" : "Delete"}
          </CommonButton>
        </DialogActions>
      </Dialog>
    </>
  );
}
