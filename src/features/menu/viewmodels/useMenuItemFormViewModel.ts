"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  emptyMenuItemForm,
  menuItemFormSchema,
  toMenuItemForm,
  type MenuItem,
  type MenuItemForm,
} from "../models/menuItem";
import {
  addMenuCategory,
  createMenuItem,
  getMenuItem,
  listMenuCategories,
  updateMenuItem,
} from "../services/menuItemService";
import { menuErrorMessage } from "./menuErrors";
const DRAFT_KEY = "menu-item-draft";
/** Adds a new item, or edits the one with `id`. */
export function useMenuItemFormViewModel(id?: string) {
  const router = useRouter(),
    editing = !!id,
    [item, setItem] = useState<MenuItem | null>(null),
    [loading, setLoading] = useState(editing),
    [loadError, setLoadError] = useState(""),
    [error, setError] = useState(""),
    [created, setCreated] = useState<MenuItem | null>(null),
    [categories, setCategories] = useState<string[]>([]),
    [subCategories, setSubCategories] = useState<string[]>([]),
    [draftSaved, setDraftSaved] = useState(false);
  const form = useForm<MenuItemForm>({
    resolver: zodResolver(menuItemFormSchema),
    defaultValues: emptyMenuItemForm(),
    mode: "onTouched",
  });
  // A new item starts from the saved draft, if there is one.
  useEffect(() => {
    if (id) return;
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved)
        form.reset({ ...emptyMenuItemForm(), ...JSON.parse(saved) });
    } catch {
      // No draft, or storage is unavailable.
    }
  }, [id, form]);
  useEffect(() => {
    if (!id) return;
    let active = true;
    getMenuItem(id)
      .then((loaded) => {
        if (!active) return;
        setItem(loaded);
        form.reset(toMenuItemForm(loaded));
      })
      .catch((e) => active && setLoadError(menuErrorMessage(e)))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [id, form]);
  useEffect(() => {
    let active = true;
    listMenuCategories()
      .then((lists) => {
        if (!active) return;
        setCategories(lists.categories);
        setSubCategories(lists.subCategories);
      })
      // Suggestions are optional; typing a category still works without them.
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);
  const submit = form.handleSubmit(async (values) => {
    setError("");
    setCreated(null);
    try {
      const category = values.category.trim(),
        subCategory = values.subCategory.trim();
      if (id) {
        await updateMenuItem(id, values);
        router.push("/menu/items");
      } else {
        setCreated(await createMenuItem(values));
        // Remember a new category (and sub category) for the next dish.
        if (category && (subCategory || !categories.includes(category)))
          addMenuCategory(category, subCategory || undefined)
            .then(() => {
              setCategories((old) => [...new Set([...old, category])]);
              if (subCategory)
                setSubCategories((old) => [...new Set([...old, subCategory])]);
            })
            .catch(() => undefined);
        form.reset(emptyMenuItemForm());
        try {
          localStorage.removeItem(DRAFT_KEY);
        } catch {
          // Nothing to clear.
        }
      }
    } catch (e) {
      setError(menuErrorMessage(e));
    }
  });
  /** Keeps the typed details (not the picture) so the vendor can finish later. */
  const saveDraft = () => {
    try {
      localStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({ ...form.getValues(), images: undefined }),
      );
      setDraftSaved(true);
    } catch {
      setError("The draft could not be saved in this browser.");
    }
  };
  return {
    form,
    saveDraft,
    draftSaved,
    clearDraftSaved: () => setDraftSaved(false),
    editing,
    item,
    loading,
    loadError,
    error,
    dismissError: () => setError(""),
    categories,
    subCategories,
    created,
    dismissCreated: () => setCreated(null),
    submitting: form.formState.isSubmitting,
    submit,
    cancel: () => router.push("/menu/items"),
  };
}
