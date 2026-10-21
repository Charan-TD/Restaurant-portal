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
  createMenuItem,
  getMenuItem,
  addMenuCategories,
  listCategoryNames,
  listMenuCategories,
  updateMenuItem,
} from "../services/menuItemService";
import {
  createAddOn,
  listAddOns,
  type RestaurantAddOn,
} from "../services/addOnService";
import { useToast } from "@/core/providers/ToastProvider";
import { menuErrorMessage } from "./menuErrors";
const DRAFT_KEY = "menu-item-draft";
/** Adds a new item, or edits the one with `id`. */
export function useMenuItemFormViewModel(id?: string) {
  const toast = useToast();
  const router = useRouter(),
    editing = !!id,
    [item, setItem] = useState<MenuItem | null>(null),
    [loading, setLoading] = useState(editing),
    [loadError, setLoadError] = useState(""),
    [error, setError] = useState(""),
    [created, setCreated] = useState<MenuItem | null>(null),
    [categories, setCategories] = useState<string[]>([]),
    [subCategories, setSubCategories] = useState<string[]>([]),
    [addOns, setAddOns] = useState<RestaurantAddOn[]>([]),
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
      if (saved) form.reset({ ...emptyMenuItemForm(), ...JSON.parse(saved) });
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
    listCategoryNames()
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
  // Problems appear as a flash message, wherever the page is scrolled to.
  useEffect(() => {
    if (error) toast.error(error);
  }, [error, toast]);
  useEffect(() => {
    let active = true;
    listAddOns()
      .then((list) => active && setAddOns(list))
      // Add-ons are optional; the item can still be saved without them.
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);
  /**
   * Creates an add-on under the item's category and ticks it. The server
   * files add-ons under a category id, so a category that is not saved yet
   * is created first. Resolves to an error message, or "" when done.
   */
  const createNewAddOn = async (name: string, price: number) => {
    const category = form.getValues("category").trim();
    if (!category) return "Choose the item's category first.";
    try {
      const find = async () =>
        (await listMenuCategories()).categories.find(
          (c) => c.name.toLowerCase() === category.toLowerCase(),
        );
      let found = await find();
      if (!found) {
        await addMenuCategories([{ category }]);
        found = await find();
      }
      if (!found) return "The category could not be saved. Try again.";
      const saved = await createAddOn({ name, categoryId: found.id, price });
      setAddOns((list) => [...list, saved]);
      form.setValue("addOnIds", [...form.getValues("addOnIds"), saved.id], {
        shouldDirty: true,
      });
      toast.success(`Add-on ${name} added.`);
      return "";
    } catch (e) {
      return menuErrorMessage(e);
    }
  };
  const submit = form.handleSubmit(async (values) => {
    setError("");
    setCreated(null);
    try {
      if (id) {
        if (!item) throw new Error("The item is still loading.");
        await updateMenuItem(id, values, item);
        toast.success(`${values.name.trim()} was updated.`);
        router.push("/menu/items");
      } else {
        const made = await createMenuItem(values);
        setCreated(made);
        toast.success(`${made.name} was added to your menu.`);
        // The category may be new; refresh the dropdown lists.
        listCategoryNames()
          .then((lists) => {
            setCategories(lists.categories);
            setSubCategories(lists.subCategories);
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
      toast.info("Draft saved in this browser. The picture is not included.");
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
    addOns,
    createAddOn: createNewAddOn,
    created,
    dismissCreated: () => setCreated(null),
    submitting: form.formState.isSubmitting,
    submit,
    cancel: () => router.push("/menu/items"),
  };
}
