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
  useAddMenuCategoriesMutation,
  useCreateMenuItemMutation,
  useGetMenuItemQuery,
  useLazyListMenuCategoriesQuery,
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
import { useToast } from "@/core/providers/ToastProvider";
import { menuErrorMessage } from "./menuErrors";
const NO_NAMES: string[] = [];
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
    subCategories = namesQuery.data?.subCategories ?? NO_NAMES,
    addOns = addOnsQuery.data ?? NO_ADDONS;
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
  const createNewAddOn = async (name: string, price: number) => {
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
  const submit = form.handleSubmit(async (values) => {
    setError("");
    setCreated(null);
    try {
      const sold = (values.qtyType ?? "").trim();
      if (
        sold &&
        qtyQuery.data &&
        !qtyQuery.data.some((q) => q.toLowerCase() === sold.toLowerCase())
      )
        await createQtyType(sold).unwrap();
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
    subCategories,
    addOns,
    qtyOptions,
    createAddOn: createNewAddOn,
    created,
    dismissCreated: () => setCreated(null),
    submitting: form.formState.isSubmitting,
    submit,
    cancel: () => router.push("/menu/items"),
  };
}
