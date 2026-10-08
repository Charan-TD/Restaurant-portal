"use client";
import { useForm, useFormContext, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { menuItemSchema } from "../models/validation";
import type { MenuItem, RegistrationForm } from "../models/registration";
export function useMenuViewModel() {
  const form = useFormContext<RegistrationForm>();
  const items = useWatch({ control: form.control, name: "menuItems" });
  const foodServed = useWatch({
    control: form.control,
    name: "foodServed",
  });
  // Veg-only restaurants only serve veg items, so the type is fixed;
  // otherwise the vendor chooses it for every item.
  const vegOnly = foodServed.length === 1 && foodServed[0] === "Veg";
  const emptyItem = (): MenuItem => ({
    type: vegOnly ? "Veg" : "",
    name: "",
    price: 0,
    description: "",
    image: null,
  });
  const menuForm = useForm<MenuItem>({
    resolver: zodResolver(menuItemSchema),
    defaultValues: emptyItem(),
  });
  const add = menuForm.handleSubmit((item) => {
    form.setValue(
      "menuItems",
      [...items, vegOnly ? { ...item, type: "Veg" } : item],
      { shouldDirty: true, shouldValidate: true },
    );
    menuForm.reset(emptyItem());
  });
  const remove = (index: number) =>
    form.setValue(
      "menuItems",
      items.filter((_, i) => i !== index),
      { shouldDirty: true, shouldValidate: true },
    );
  return { form, items, menuForm, vegOnly, add, remove };
}
