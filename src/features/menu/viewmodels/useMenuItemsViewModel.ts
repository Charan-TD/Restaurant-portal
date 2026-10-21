"use client";
import { useEffect, useMemo, useState } from "react";
import type { MenuFoodType, MenuItem } from "../models/menuItem";
import { buildCategoryTree, UNCATEGORISED } from "../models/menuGroups";
import {
  createAddOn,
  deleteAddOn,
  listAddOns,
  updateAddOn,
  type AddOnForm,
  type RestaurantAddOn,
} from "../services/addOnService";
import {
  deleteMenuItem,
  listMenuItems,
  addMenuCategories,
  listMenuCategories,
  setMenuItemAvailable,
  type MenuCategories,
} from "../services/menuItemService";
import { useToast } from "@/core/providers/ToastProvider";
import { menuErrorMessage } from "./menuErrors";
export type FoodFilter = MenuFoodType | "All";
export type MenuTab = "items" | "categories" | "addons";
/** Shared by the items, categories and add-ons tabs. */
export function useMenuItemsViewModel() {
  const toast = useToast();
  const [items, setItems] = useState<MenuItem[]>([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [search, setSearch] = useState(""),
    [foodFilter, setFoodFilter] = useState<FoodFilter>("All"),
    [tab, setTab] = useState<MenuTab>("items"),
    // Set by "View items" on a category; null shows every category.
    [categoryFilter, setCategoryFilter] = useState<string | null>(null),
    [addOns, setAddOns] = useState<RestaurantAddOn[]>([]),
    // The server categories an add-on can be filed under (ids like CAT002).
    [serverCategories, setServerCategories] = useState<MenuCategories>({
      categories: [],
      subCategories: [],
    }),
    [savingCategory, setSavingCategory] = useState(false),
    [savingAddOn, setSavingAddOn] = useState(false),
    [pendingDelete, setPendingDelete] = useState<MenuItem | null>(null),
    [deleting, setDeleting] = useState(false),
    // Ids whose availability switch is being saved.
    [saving, setSaving] = useState<string[]>([]);
  // Problems appear as a flash message, wherever the page is scrolled to.
  useEffect(() => {
    if (error) toast.error(error);
  }, [error, toast]);
  useEffect(() => {
    let active = true;
    listMenuItems()
      .then((list) => active && setItems(list))
      .catch((e) => active && setError(menuErrorMessage(e)))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);
  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    return items.filter(
      (item) =>
        (foodFilter === "All" || item.foodType === foodFilter) &&
        (categoryFilter === null ||
          (item.category.trim() || UNCATEGORISED) === categoryFilter) &&
        (!query ||
          item.name.toLowerCase().includes(query) ||
          item.category.toLowerCase().includes(query) ||
          (item.subCategory ?? "").toLowerCase().includes(query)),
    );
  }, [items, search, foodFilter, categoryFilter]);
  const categories = useMemo(
    () => buildCategoryTree(serverCategories, items),
    [serverCategories, items],
  );
  const replace = (item: MenuItem) =>
    setItems((list) => list.map((i) => (i.id === item.id ? item : i)));
  const setAvailable = async (item: MenuItem, available: boolean) => {
    setError("");
    setSaving((ids) => [...ids, item.id]);
    replace({ ...item, available });
    try {
      const saved = await setMenuItemAvailable(item.id, available, item);
      // The reply carries a category id; keep the names already resolved.
      replace({
        ...saved,
        category: item.category,
        subCategory: item.subCategory,
      });
      toast.success(
        `${item.name} is now ${available ? "in stock" : "out of stock"}.`,
      );
    } catch (e) {
      replace(item);
      setError(menuErrorMessage(e));
    } finally {
      setSaving((ids) => ids.filter((id) => id !== item.id));
    }
  };
  const viewCategory = (name: string) => {
    setCategoryFilter(name);
    setTab("items");
  };
  useEffect(() => {
    let active = true;
    listAddOns()
      .then((list) => active && setAddOns(list))
      .catch((e) => active && setError(menuErrorMessage(e)));
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    let active = true;
    listMenuCategories()
      .then((lists) => active && setServerCategories(lists))
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);
  /** Saves a new category, or new sub categories under an existing one. */
  const addCategory = async (
    category: string,
    subcategories: string[] = [],
  ): Promise<boolean> => {
    setError("");
    setSavingCategory(true);
    try {
      await addMenuCategories([{ category, subcategories }]);
      setServerCategories(await listMenuCategories());
      toast.success(
        subcategories.length
          ? `Sub-category added to ${category}.`
          : `${category} added.`,
      );
      return true;
    } catch (e) {
      setError(menuErrorMessage(e));
      return false;
    } finally {
      setSavingCategory(false);
    }
  };
  /** Creates the add-on, or edits `previous`; resolves true when saved. */
  const saveAddOn = async (
    previous: RestaurantAddOn | null,
    form: AddOnForm,
  ): Promise<boolean> => {
    setError("");
    setSavingAddOn(true);
    try {
      const saved = previous
        ? await updateAddOn(previous.id, form)
        : await createAddOn(form);
      setAddOns((list) =>
        previous
          ? list.map((a) => (a.id === saved.id ? saved : a))
          : [...list, saved],
      );
      toast.success(previous ? "Add-on updated." : "Add-on added.");
      return true;
    } catch (e) {
      setError(menuErrorMessage(e));
      return false;
    } finally {
      setSavingAddOn(false);
    }
  };
  const removeAddOn = async (addOn: RestaurantAddOn): Promise<boolean> => {
    setError("");
    setSavingAddOn(true);
    try {
      await deleteAddOn(addOn.id);
      setAddOns((list) => list.filter((a) => a.id !== addOn.id));
      toast.success(`${addOn.name} deleted.`);
      return true;
    } catch (e) {
      setError(menuErrorMessage(e));
      return false;
    } finally {
      setSavingAddOn(false);
    }
  };
  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    setError("");
    try {
      await deleteMenuItem(pendingDelete.id);
      setItems((list) => list.filter((i) => i.id !== pendingDelete.id));
      toast.success(`${pendingDelete.name} deleted.`);
      setPendingDelete(null);
    } catch (e) {
      setError(menuErrorMessage(e));
      setPendingDelete(null);
    } finally {
      setDeleting(false);
    }
  };
  return {
    items,
    visible,
    loading,
    error,
    dismissError: () => setError(""),
    search,
    setSearch,
    foodFilter,
    setFoodFilter,
    tab,
    setTab,
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
