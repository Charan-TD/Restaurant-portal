"use client";
import NextLink from "next/link";
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
import { Hint } from "@/shared/components/feedback/Hint";
import { MetricCard } from "@/shared/components/layout/MetricCard";
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
const hints: Record<MenuTab, string> = {
  items: "All your dishes with price and stock",
  categories: "Your dishes grouped by category and sub category",
  addons: "Extras customers can add to a dish",
};
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
        eyebrow="Menu"
        title="Menu items"
        subtitle="Your dishes, add-ons and categories, with prices and stock."
        actions={
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}>
            {(
              [
                ["items", "Items", total],
                ["categories", "Category items", vm.categories.length],
                ["addons", "Add-ons", vm.addOns.length],
              ] as [MenuTab, string, number][]
            ).map(([value, label, count]) => (
              <Hint key={value} title={hints[value]}>
                <CommonButton
                  variant={vm.tab === value ? "contained" : "outlined"}
                  onClick={() => vm.setTab(value)}
                >
                  {label} ({count})
                </CommonButton>
              </Hint>
            ))}
            <Hint title="Add a new dish to your menu">
              <CommonButton
                variant="contained"
                startIcon={<AddOutlined />}
                href="/menu/add"
                LinkComponent={NextLink}
              >
                Add item
              </CommonButton>
            </Hint>
          </Box>
        }
      />
      <Box
        sx={{
          display: "grid",
          gap: { xs: 1, md: 1.5 },
          mb: 2,
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
        }}
      >
        <MetricCard
          label="Total items"
          hint="Every dish on your menu."
          value={total}
          icon={<RoomServiceOutlined />}
        />
        <MetricCard
          label="In stock"
          hint="Dishes customers can order right now."
          value={vm.availableCount}
          icon={<Inventory2Outlined />}
        />
        <MetricCard
          label="Out of stock"
          hint="Dishes switched off, so customers cannot order them."
          value={total - vm.availableCount}
          icon={<HighlightOffOutlined />}
        />
      </Box>
      <Box>
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
                {vm.searching ? "Searching…" : "No items match your search."}
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
      </Box>
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
