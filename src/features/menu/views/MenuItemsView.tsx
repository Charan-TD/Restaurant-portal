"use client";
import NextLink from "next/link";
import type { ReactNode } from "react";
import {
  Box,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Typography,
} from "@mui/material";
import AddOutlined from "@mui/icons-material/AddOutlined";
import RestaurantMenuOutlined from "@mui/icons-material/RestaurantMenuOutlined";
import RoomServiceOutlined from "@mui/icons-material/RoomServiceOutlined";
import Inventory2Outlined from "@mui/icons-material/Inventory2Outlined";
import HighlightOffOutlined from "@mui/icons-material/HighlightOffOutlined";
import { PageHeader } from "@/shared/components/layout/PageHeader";
import { CommonCard } from "@/shared/components/layout/CommonCard";
import { CommonButton } from "@/shared/components/actions/CommonButton";
import type { MenuItem } from "../models/menuItem";
import { MenuItemRow } from "../components/MenuItemRow";
import { MenuFilters } from "../components/MenuFilters";
import { CategoriesPanel } from "../components/CategoriesPanel";
import { AddOnsPanel } from "../components/AddOnsPanel";
import {
  useMenuItemsViewModel,
  type MenuTab,
} from "../viewmodels/useMenuItemsViewModel";
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
        boxShadow:
          "0 1px 2px rgba(16, 24, 40, 0.06), 0 6px 16px rgba(16, 24, 40, 0.07)",
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
const NO_SUB = "No sub category";
/** Items split by sub category name, those without one last. */
function bySubCategory(items: MenuItem[]) {
  const groups = new Map<string, MenuItem[]>();
  for (const item of items) {
    const key = item.subCategory?.trim() || NO_SUB;
    groups.set(key, [...(groups.get(key) ?? []), item]);
  }
  return [...groups.entries()].sort(
    ([a], [b]) =>
      Number(a === NO_SUB) - Number(b === NO_SUB) || a.localeCompare(b),
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
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}>
            {(
              [
                ["items", "Items", total],
                ["categories", "Category items", vm.categories.length],
                ["addons", "Add-ons", vm.addOns.length],
              ] as [MenuTab, string, number][]
            ).map(([value, label, count]) => (
              <CommonButton
                key={value}
                variant={vm.tab === value ? "contained" : "outlined"}
                onClick={() => vm.setTab(value)}
              >
                {label} ({count})
              </CommonButton>
            ))}
            <CommonButton
              variant="contained"
              startIcon={<AddOutlined />}
              href="/menu/add"
              LinkComponent={NextLink}
            >
              Add item
            </CommonButton>
          </Box>
        }
      />
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
        {vm.loading ? (
          <Box sx={{ display: "grid", placeItems: "center", py: 6 }}>
            <CircularProgress aria-label="Loading menu items" />
          </Box>
        ) : vm.tab === "categories" ? (
          <CategoriesPanel
            categories={vm.categories}
            saving={vm.savingCategory}
            onView={vm.viewCategory}
            onAdd={vm.addCategory}
          />
        ) : vm.tab === "addons" ? (
          <AddOnsPanel
            addOns={vm.addOns}
            categories={vm.addOnCategories}
            saving={vm.savingAddOn}
            onSave={vm.saveAddOn}
            onDelete={vm.removeAddOn}
          />
        ) : (
          <>
            <MenuFilters
              search={vm.search}
              onSearch={vm.setSearch}
              foodFilter={vm.foodFilter}
              onFoodFilter={vm.setFoodFilter}
            />
            {vm.categoryFilter !== null && (
              <Chip
                label={`Category: ${vm.categoryFilter}`}
                onDelete={vm.clearCategoryFilter}
                sx={{ mt: 1, fontWeight: 600 }}
              />
            )}
            {vm.items.length === 0 ? (
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
                <RestaurantMenuOutlined
                  color="disabled"
                  sx={{ fontSize: 48 }}
                />
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
            ) : vm.categoryFilter !== null ? (
              // A category's items, one block per sub category.
              <Box sx={{ display: "grid", gap: 3, mt: 2 }}>
                {bySubCategory(vm.visible).map(([sub, list]) => (
                  <Box key={sub}>
                    <Typography
                      sx={{ fontWeight: 800, fontSize: 18, mb: 1.25 }}
                    >
                      {sub}{" "}
                      <Typography
                        component="span"
                        color="text.secondary"
                        sx={{ fontSize: 15 }}
                      >
                        · {list.length}
                      </Typography>
                    </Typography>
                    <Box sx={{ display: "grid", gap: 1.5 }}>
                      {list.map((item) => (
                        <MenuItemRow
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
                  </Box>
                ))}
              </Box>
            ) : (
              <Box sx={{ display: "grid", gap: 1.5, mt: 2 }}>
                {vm.visible.map((item) => (
                  <MenuItemRow
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
          </>
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
