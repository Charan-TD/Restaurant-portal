"use client";
import { useEffect, useMemo, useState } from "react";
import type { MenuFoodType, MenuItem } from "../models/menuItem";
import { buildCategoryTree, UNCATEGORISED } from "../models/menuGroups";
import {
  useCreateAddOnMutation,
  useDeleteAddOnMutation,
  useListAddOnsQuery,
  useUpdateAddOnMutation,
  type AddOnForm,
  type RestaurantAddOn,
} from "../services/addOnApi";
import {
  useAddMenuCategoriesMutation,
  useDeleteMenuItemMutation,
  useListMenuCategoriesQuery,
  useListMenuItemsQuery,
  useSearchMenuItemsQuery,
  useSetMenuItemAvailableMutation,
} from "../services/menuItemApi";
import { useToast } from "@/core/providers/ToastProvider";
import { DEMO_MODE } from "@/core/constants/config";
import { useDebouncedValue } from "@/shared/hooks/useDebouncedValue";
import { menuErrorMessage } from "./menuErrors";
export type FoodFilter = MenuFoodType | "All";
export type MenuTab = "items" | "categories" | "addons";
const NO_ITEMS: MenuItem[] = [];
const NO_ADDONS: RestaurantAddOn[] = [];
const NO_CATEGORIES = { categories: [], subCategories: [] };
/** Shared by the items, categories and add-ons tabs. */
export function useMenuItemsViewModel() {
  const toast = useToast();
  const itemsQuery = useListMenuItemsQuery(),
    addOnsQuery = useListAddOnsQuery(),
    categoriesQuery = useListMenuCategoriesQuery(),
    [createAddOn, { isLoading: creatingAddOn }] = useCreateAddOnMutation(),
    [updateAddOn, { isLoading: updatingAddOn }] = useUpdateAddOnMutation(),
    [deleteAddOn, { isLoading: deletingAddOn }] = useDeleteAddOnMutation(),
    [addCategories, { isLoading: savingCategory }] =
      useAddMenuCategoriesMutation(),
    [setStock] = useSetMenuItemAvailableMutation(),
    [deleteItem, { isLoading: deleting }] = useDeleteMenuItemMutation();
  const items = itemsQuery.data ?? NO_ITEMS,
    addOns = addOnsQuery.data ?? NO_ADDONS,
    serverCategories = categoriesQuery.data ?? NO_CATEGORIES,
    loading = itemsQuery.isLoading,
    savingAddOn = creatingAddOn || updatingAddOn || deletingAddOn;
  const loadError = itemsQuery.error ?? addOnsQuery.error;
  const [actionError, setActionError] = useState(""),
    [search, setSearch] = useState(""),
    [foodFilter, setFoodFilter] = useState<FoodFilter>("All"),
    [tab, setTab] = useState<MenuTab>("items"),
    // Set by "View items" on a category; null shows every category.
    [categoryFilter, setCategoryFilter] = useState<string | null>(null),
    [pendingDelete, setPendingDelete] = useState<MenuItem | null>(null),
    // Ids whose availability switch is being saved.
    [saving, setSaving] = useState<string[]>([]);
  // The server matches item names; the food type and category filters stay local.
  const term = useDebouncedValue(search.trim()),
    searching = Boolean(term && search.trim()) && !DEMO_MODE,
    found = useSearchMenuItemsQuery(term, { skip: !searching }),
    shownError = loadError ?? (searching ? found.error : undefined);
  const error = actionError || (shownError ? menuErrorMessage(shownError) : "");
  // Problems appear as a flash message, wherever the page is scrolled to.
  useEffect(() => {
    if (error) toast.error(error);
  }, [error, toast]);
  const visible = useMemo(() => {
    const query = search.trim().toLowerCase(),
      source = searching ? (found.data ?? []) : items;
    return source.filter(
      (item) =>
        (foodFilter === "All" || item.foodType === foodFilter) &&
        (categoryFilter === null ||
          (item.category.trim() || UNCATEGORISED) === categoryFilter) &&
        (searching ||
          !query ||
          item.name.toLowerCase().includes(query) ||
          item.category.toLowerCase().includes(query) ||
          (item.subCategory ?? "").toLowerCase().includes(query)),
    );
  }, [items, found.data, searching, search, foodFilter, categoryFilter]);
  const categories = useMemo(
    () => buildCategoryTree(serverCategories, items),
    [serverCategories, items],
  );
  const setAvailable = async (item: MenuItem, available: boolean) => {
    setActionError("");
    setSaving((ids) => [...ids, item.id]);
    try {
      // The list switches at once and rolls back if the save fails.
      await setStock({ id: item.id, available, current: item }).unwrap();
      toast.success(
        `${item.name} is now ${available ? "in stock" : "out of stock"}.`,
      );
    } catch (e) {
      setActionError(menuErrorMessage(e));
    } finally {
      setSaving((ids) => ids.filter((id) => id !== item.id));
    }
  };
  const viewCategory = (name: string) => {
    setCategoryFilter(name);
    setTab("items");
  };
  /** Saves a new category, or new sub categories under an existing one. */
  const addCategory = async (
    category: string,
    subcategories: string[] = [],
  ): Promise<boolean> => {
    setActionError("");
    try {
      await addCategories([{ category, subcategories }]).unwrap();
      toast.success(
        subcategories.length
          ? `Sub-category added to ${category}.`
          : `${category} added.`,
      );
      return true;
    } catch (e) {
      setActionError(menuErrorMessage(e));
      return false;
    }
  };
  /** Creates the add-on, or edits `previous`; resolves true when saved. */
  const saveAddOn = async (
    previous: RestaurantAddOn | null,
    form: AddOnForm,
  ): Promise<boolean> => {
    setActionError("");
    try {
      if (previous) await updateAddOn({ id: previous.id, form }).unwrap();
      else await createAddOn(form).unwrap();
      toast.success(previous ? "Add-on updated." : "Add-on added.");
      return true;
    } catch (e) {
      setActionError(menuErrorMessage(e));
      return false;
    }
  };
  const removeAddOn = async (addOn: RestaurantAddOn): Promise<boolean> => {
    setActionError("");
    try {
      await deleteAddOn(addOn.id).unwrap();
      toast.success(`${addOn.name} deleted.`);
      return true;
    } catch (e) {
      setActionError(menuErrorMessage(e));
      return false;
    }
  };
  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setActionError("");
    try {
      await deleteItem(pendingDelete.id).unwrap();
      toast.success(`${pendingDelete.name} deleted.`);
    } catch (e) {
      setActionError(menuErrorMessage(e));
    } finally {
      setPendingDelete(null);
    }
  };
  return {
    items,
    visible,
    loading,
    error,
    dismissError: () => setActionError(""),
    search,
    setSearch,
    foodFilter,
    setFoodFilter,
    tab,
    setTab,
    searching: searching && found.isFetching,
    categoryFilter,
    clearCategoryFilter: () => setCategoryFilter(null),
    viewCategory,
    categories,
    addOns,
    addOnCategories: serverCategories.categories,
    addCategory,
    savingCategory,
    saveAddOn,
    removeAddOn,
    savingAddOn,
    availableCount: items.filter((i) => i.available).length,
    isSaving: (id: string) => saving.includes(id),
    setAvailable,
    pendingDelete,
    askDelete: setPendingDelete,
    cancelDelete: () => setPendingDelete(null),
    confirmDelete,
    deleting,
  };
}
