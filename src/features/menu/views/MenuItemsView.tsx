"use client";
import { useMemo, useState } from "react";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import {
  Box,
  ButtonBase,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Drawer,
  Typography,
} from "@mui/material";
import AddOutlined from "@mui/icons-material/AddOutlined";
import CheckBoxOutlineBlank from "@mui/icons-material/CheckBoxOutlineBlank";
import CheckBox from "@mui/icons-material/CheckBox";
import RestaurantMenuOutlined from "@mui/icons-material/RestaurantMenuOutlined";
import SearchOutlined from "@mui/icons-material/SearchOutlined";
import { cardSx, tokens, tokenScopeSx } from "@/core/theme/tokens";
import { CommonButton } from "@/shared/components/actions/CommonButton";
import { CommonTextField } from "@/shared/components/form/CommonTextField";
import { ScreenSurface } from "@/shared/components/layout/ScreenSurface";
import type { MenuItem } from "../models/menuItem";
import { MenuItemRow } from "../components/MenuItemRow";
import { AddOnsPanel } from "../components/AddOnsPanel";
import { CategoryRail } from "../components/CategoryRail";
import { useMenuItemsViewModel } from "../viewmodels/useMenuItemsViewModel";
import { MenuItemFormView } from "./MenuItemFormView";

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

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

/**
 * The menu: categories on the left, the chosen category's dishes on the right.
 * `drawer` opens the new / edit item panel on top (the /menu/add and
 * /menu/items/[id] routes).
 */
export function MenuItemsView({
  drawer,
}: {
  drawer?: { id?: string };
}) {
  const vm = useMenuItemsViewModel(),
    router = useRouter(),
    [picked, setPicked] = useState<string | null>(null),
    [subPicked, setSubPicked] = useState<string | null>(null),
    [outOnly, setOutOnly] = useState(false),
    total = vm.items.length,
    outCount = total - vm.availableCount,
    // The first category is open until another is chosen.
    selected =
      vm.tab === "addons"
        ? null
        : vm.categories.find((c) => c.name === picked)?.name ??
          vm.categories[0]?.name ??
          null,
    category = vm.categories.find((c) => c.name === selected) ?? null,
    sub = category?.subs.some((s) => s.name === subPicked) ? subPicked : null,
    searching = vm.search.trim() !== "",
    // Searching or filtering by stock looks across every category.
    broad = searching || outOnly,
    shown = useMemo(
      () =>
        vm.visible.filter((item) => {
          if (outOnly && item.available) return false;
          if (broad || !category) return true;
          return (
            (item.category.trim() || "Uncategorised") === category.name &&
            (sub === null || item.subCategory?.trim() === sub)
          );
        }),
      [vm.visible, outOnly, broad, category, sub],
    ),
    heading = searching
      ? "Search results"
      : outOnly
        ? "Out of stock"
        : (category?.name ?? "Menu"),
    outInShown = shown.filter((i) => !i.available).length,
    summary = [
      plural(shown.length, "item"),
      !broad && category && category.subs.length
        ? plural(category.subs.length, "sub-category").replace("categorys", "categories")
        : "",
      outInShown ? `${outInShown} out of stock` : "",
    ]
      .filter(Boolean)
      .join(" · ");
  const rows = (list: MenuItem[]) =>
    list.map((item) => (
      <MenuItemRow
        key={item.id}
        item={item}
        saving={vm.isSaving(item.id)}
        onDelete={() => vm.askDelete(item)}
        onAvailable={(available) => void vm.setAvailable(item, available)}
      />
    ));
  const closeDrawer = () => router.push("/menu/items");
  return (
    <ScreenSurface flush>
      <Box
        sx={{
          display: "grid",
          alignItems: "start",
          gridTemplateColumns: { xs: "1fr", md: "280px minmax(0, 1fr)" },
        }}
      >
        <CategoryRail
          categories={vm.categories}
          selected={selected}
          selectedSub={sub}
          onSelect={(name) => {
            setPicked(name);
            setSubPicked(null);
            vm.setTab("items");
          }}
          onSelectSub={setSubPicked}
          saving={vm.savingCategory}
          onAdd={vm.addCategory}
          recommended={vm.recommended}
          addingRecommended={vm.addingRecommended}
          onAddRecommended={vm.addRecommended}
          addOnsCount={vm.addOns.length}
          addOnsActive={vm.tab === "addons"}
          onOpenAddOns={() => vm.setTab("addons")}
        />
        <Box sx={{ p: { xs: 2, md: 3 }, minWidth: 0 }}>
          {vm.tab === "addons" ? (
            <AddOnsPanel
              addOns={vm.addOns}
              categories={vm.addOnCategories}
              saving={vm.savingAddOn}
              onSave={vm.saveAddOn}
              onDelete={vm.removeAddOn}
            />
          ) : (
            <>
              <Box
                sx={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  gap: 1.5,
                  mb: 2.5,
                }}
              >
                <CommonTextField
                  placeholder="Search items"
                  value={vm.search}
                  onChange={(e) => vm.setSearch(e.target.value)}
                  inputPrefix={<SearchOutlined fontSize="small" />}
                  slotProps={{ htmlInput: { "aria-label": "Search items" } }}
                  sx={{ width: 300, "& .MuiOutlinedInput-root": { minHeight: 44 } }}
                />
                <ButtonBase
                  role="checkbox"
                  aria-checked={outOnly}
                  onClick={() => setOutOnly((v) => !v)}
                  sx={{
                    gap: 1,
                    height: 44,
                    px: 1.75,
                    fontSize: 14,
                    borderRadius: tokens.radius.input,
                    bgcolor: tokens.color.card,
                    border: `1.5px solid ${tokens.color.borderInput}`,
                  }}
                >
                  {outOnly ? (
                    <CheckBox sx={{ color: tokens.color.primary }} />
                  ) : (
                    <CheckBoxOutlineBlank sx={{ color: tokens.color.textSubtle }} />
                  )}
                  Show out of stock only
                  <Box
                    component="span"
                    sx={{
                      px: 0.75,
                      borderRadius: "999px",
                      fontSize: 12,
                      lineHeight: "20px",
                      color: tokens.color.error,
                      bgcolor: tokens.color.errorBg,
                    }}
                  >
                    {outCount}
                  </Box>
                </ButtonBase>
                <Box sx={{ flex: 1 }} />
                <CommonButton
                  variant="contained"
                  startIcon={<AddOutlined />}
                  href="/menu/add"
                  LinkComponent={NextLink}
                >
                  Add new item
                </CommonButton>
              </Box>
              {vm.loading ? (
                <Box sx={{ display: "grid", placeItems: "center", py: 6 }}>
                  <CircularProgress aria-label="Loading menu items" />
                </Box>
              ) : (
                <Box sx={{ ...cardSx, p: 3 }}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                      mb: 2,
                    }}
                  >
                    <Typography sx={{ fontSize: 18, fontWeight: 700 }}>
                      {heading}
                    </Typography>
                    <Typography
                      sx={{ flex: 1, fontSize: 14, color: tokens.color.textMuted }}
                    >
                      {summary}
                    </Typography>
                  </Box>
                  {total === 0 ? (
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
                        sx={{ fontSize: 48, color: tokens.color.textSubtle }}
                      />
                      <Typography sx={{ fontSize: 18, fontWeight: 700 }}>
                        No menu items yet
                      </Typography>
                      <Typography sx={{ color: tokens.color.textMuted }}>
                        Add your first dish with its price, picture and food type.
                      </Typography>
                    </Box>
                  ) : shown.length === 0 ? (
                    <Typography sx={{ py: 4, color: tokens.color.textMuted }}>
                      {vm.searching
                        ? "Searching…"
                        : outOnly
                          ? "Nothing is out of stock here."
                          : "No items here yet."}
                    </Typography>
                  ) : (
                    <Box
                      sx={{
                        border: `1px solid ${tokens.color.border}`,
                        borderRadius: tokens.radius.input,
                        overflow: "hidden",
                      }}
                    >
                      {broad || sub !== null || !category?.subs.length
                        ? rows(shown)
                        : bySubCategory(shown).map(([name, list]) => (
                            <Box key={name}>
                              <Box
                                sx={{
                                  display: "flex",
                                  gap: 1.5,
                                  px: 2,
                                  py: 1,
                                  fontSize: 12,
                                  letterSpacing: "0.4px",
                                  color: tokens.color.textMuted,
                                  bgcolor: tokens.color.muted,
                                }}
                              >
                                <Box component="span" sx={{ fontWeight: 700, textTransform: "uppercase", color: tokens.color.text }}>
                                  {name}
                                </Box>
                                {plural(list.length, "item")}
                              </Box>
                              {rows(list)}
                            </Box>
                          ))}
                    </Box>
                  )}
                </Box>
              )}
            </>
          )}
        </Box>
      </Box>
      <Drawer
        anchor="right"
        open={!!drawer}
        onClose={closeDrawer}
        slotProps={{
          paper: {
            sx: {
              ...tokenScopeSx,
              width: { xs: "100%", sm: 520 },
              bgcolor: tokens.color.card,
            },
          },
        }}
      >
        {drawer && <MenuItemFormView id={drawer.id} />}
      </Drawer>
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
    </ScreenSurface>
  );
}
