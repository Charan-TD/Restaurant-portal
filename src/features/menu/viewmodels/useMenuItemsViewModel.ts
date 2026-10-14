"use client";
import { useEffect, useMemo, useState } from "react";
import type { MenuFoodType, MenuItem } from "../models/menuItem";
import {
  deleteMenuItem,
  listMenuItems,
  setMenuItemAvailable,
} from "../services/menuItemService";
import { menuErrorMessage } from "./menuErrors";
export type FoodFilter = MenuFoodType | "All";
/** Shared by the items list. */
export function useMenuItemsViewModel() {
  const [items, setItems] = useState<MenuItem[]>([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [search, setSearch] = useState(""),
    [foodFilter, setFoodFilter] = useState<FoodFilter>("All"),
    [pendingDelete, setPendingDelete] = useState<MenuItem | null>(null),
    [deleting, setDeleting] = useState(false),
    // Ids whose availability switch is being saved.
    [saving, setSaving] = useState<string[]>([]);
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
        (!query ||
          item.name.toLowerCase().includes(query) ||
          item.category.toLowerCase().includes(query)),
    );
  }, [items, search, foodFilter]);
  const replace = (item: MenuItem) =>
    setItems((list) => list.map((i) => (i.id === item.id ? item : i)));
  const setAvailable = async (item: MenuItem, available: boolean) => {
    setError("");
    setSaving((ids) => [...ids, item.id]);
    replace({ ...item, available });
    try {
      replace(await setMenuItemAvailable(item.id, available));
    } catch (e) {
      replace(item);
      setError(menuErrorMessage(e));
    } finally {
      setSaving((ids) => ids.filter((id) => id !== item.id));
    }
  };
  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    setError("");
    try {
      await deleteMenuItem(pendingDelete.id);
      setItems((list) => list.filter((i) => i.id !== pendingDelete.id));
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
