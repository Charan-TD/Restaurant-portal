"use client";
import { useEffect, useMemo, useState } from "react";
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
  useAddMenuCategoriesMutation,
  useCreateMenuItemMutation,
  useGetMenuItemQuery,
  useLazyListMenuCategoriesQuery,
  useListMenuItemsQuery,
  useListCategoryNamesQuery,
  useListQtyTypesQuery,
  useCreateQtyTypeMutation,
  useUpdateMenuItemMutation,
} from "../services/menuItemApi";
import {
  useCreateAddOnMutation,
  useListAddOnsQuery,
  type RestaurantAddOn,
} from "../services/addOnApi";
import { addOnSets, quantitySets } from "../models/menuSets";
import { useToast } from "@/core/providers/ToastProvider";
import { menuErrorMessage } from "./menuErrors";
const NO_NAMES: string[] = [];
const NO_SUBS: Record<string, string[]> = {};
const NO_ADDONS: RestaurantAddOn[] = [];
/** Adds a new item, or edits the one with `id`. */
export function useMenuItemFormViewModel(id?: string) {
  const toast = useToast();
  const router = useRouter(),
    editing = !!id,
    itemQuery = useGetMenuItemQuery(id ?? "", { skip: !id }),
    // Suggestions are optional; typing a category still works without them.
    namesQuery = useListCategoryNamesQuery(),
    // Add-ons are optional; the item can still be saved without them.
    addOnsQuery = useListAddOnsQuery(),
    [fetchCategories] = useLazyListMenuCategoriesQuery(),
    [addCategories] = useAddMenuCategoriesMutation(),
    // "Sold as" names come from the server; typing a new one saves it with the item.
    // The other dishes, for "Copy from other items"; the form works without them.
    otherItems = useListMenuItemsQuery().data,
    qtyQuery = useListQtyTypesQuery(),
    [createQtyType] = useCreateQtyTypeMutation(),
    [createAddOnRequest] = useCreateAddOnMutation(),
    [createItem] = useCreateMenuItemMutation(),
    [updateItem] = useUpdateMenuItemMutation(),
    [error, setError] = useState(""),
    [created, setCreated] = useState<MenuItem | null>(null);
  const item = itemQuery.data ?? null,
    loading = editing && itemQuery.isLoading,
    loadError = itemQuery.error ? menuErrorMessage(itemQuery.error) : "",
    categories = namesQuery.data?.categories ?? NO_NAMES,
    subsByCategory = namesQuery.data?.subsByCategory ?? NO_SUBS,
    addOns = addOnsQuery.data ?? NO_ADDONS;
  const quantityChoices = useMemo(() => quantitySets(otherItems ?? [], id), [otherItems, id]),
    addOnChoices = useMemo(() => addOnSets(otherItems ?? [], id), [otherItems, id]);
  const form = useForm<MenuItemForm>({
    resolver: zodResolver(menuItemFormSchema),
    defaultValues: emptyMenuItemForm(),
    mode: "onTouched",
  });
  // Fill the form once the item has loaded.
  useEffect(() => {
    if (id && itemQuery.data) form.reset(toMenuItemForm(itemQuery.data));
  }, [id, itemQuery.data, form]);
  // Problems appear as a flash message, wherever the page is scrolled to.
  useEffect(() => {
    if (error) toast.error(error);
  }, [error, toast]);
  /**
   * Creates an add-on under the item's category and ticks it. The server
   * files add-ons under a category id, so a category that is not saved yet
   * is created first. Resolves to an error message, or "" when done.
   */
  const createNewAddOn = async (
    name: string,
    price: number,
    image: File | null,
  ) => {
    const category = form.getValues("category").trim();
    if (!category) return "Choose the item's category first.";
    try {
      const find = async () =>
        (await fetchCategories().unwrap()).categories.find(
          (c) => c.name.toLowerCase() === category.toLowerCase(),
        );
      let found = await find();
      if (!found) {
        await addCategories([{ category }]).unwrap();
        found = await find();
      }
      if (!found) return "The category could not be saved. Try again.";
      const saved = await createAddOnRequest({
        name,
        categoryId: found.id,
        price,
        image,
      }).unwrap();
      form.setValue("addOnIds", [...form.getValues("addOnIds"), saved.id], {
        shouldDirty: true,
      });
      toast.success(`Add-on ${name} added.`);
      return "";
    } catch (e) {
      return menuErrorMessage(e);
    }
  };
  const qtyOptions = qtyQuery.data ?? NO_NAMES;
  /**
   * Saves a new quantity type (e.g. "Family Pack") to the restaurant's list
   * straight away, so it can be chosen on this and any other dish. A name the
   * list already has is not sent again. Resolves to an error message, or "".
   */
  const addQtyType = async (name: string) => {
    const clean = name.trim();
    if (!clean) return "Type a name for the quantity type.";
    if (qtyOptions.some((q) => q.toLowerCase() === clean.toLowerCase())) return "";
    try {
      await createQtyType(clean).unwrap();
      toast.success(`Quantity type ${clean} added.`);
      return "";
    } catch (e) {
      return menuErrorMessage(e);
    }
  };
  const submit = form.handleSubmit(async (values) => {
    setError("");
    setCreated(null);
    try {
      // A quantity name typed in that the server does not know yet is saved first.
      const known = new Set((qtyQuery.data ?? []).map((q) => q.toLowerCase()));
      for (const row of values.quantities) {
        const sold = row.name.trim();
        if (sold && qtyQuery.data && !known.has(sold.toLowerCase())) {
          known.add(sold.toLowerCase());
          await createQtyType(sold).unwrap();
        }
      }
      if (id) {
        if (!item) throw new Error("The item is still loading.");
        await updateItem({ id, form: values, original: item }).unwrap();
        toast.success(`${values.name.trim()} was updated.`);
        router.push("/menu/items");
      } else {
        const made = await createItem(values).unwrap();
        setCreated(made);
        toast.success(`${made.name} was added to your menu.`);
        form.reset(emptyMenuItemForm());
        router.push("/menu/items");
      }
    } catch (e) {
      setError(menuErrorMessage(e));
    }
  });
  return {
    form,
    editing,
    item,
    loading,
    loadError,
    error,
    dismissError: () => setError(""),
    categories,
    subsByCategory,
    addOns,
    quantityChoices,
    addOnChoices,
    qtyOptions,
    addQtyType,
    createAddOn: createNewAddOn,
    created,
    dismissCreated: () => setCreated(null),
    submitting: form.formState.isSubmitting,
    submit,
    cancel: () => router.push("/menu/items"),
  };
}
