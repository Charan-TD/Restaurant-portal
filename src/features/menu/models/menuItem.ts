import { z } from "zod";
// Kept free of app imports so tests can compile this model on its own.
export const menuFoodTypes = ["Veg", "Egg", "Non-veg"] as const;
export type MenuFoodType = (typeof menuFoodTypes)[number];
/** The backend stores food types as lowercase keys in `food_served`. */
export const foodTypeKeys: Record<MenuFoodType, string> = {
  Veg: "veg",
  Egg: "egg",
  "Non-veg": "non_veg",
};
/** A menu item as the portal shows it. */
export interface MenuItem {
  id: string;
  name: string;
  description: string;
  /** Whole rupees. */
  price: number;
  discountedPrice: number | null;
  /** Percent, e.g. 5 for 5% GST. */
  taxRate: number;
  preparationMinutes: number;
  foodType: MenuFoodType | null;
  category: string;
  subCategory?: string;
  quantity: number;
  lowStockThreshold: number;
  /** The restaurant's own in / out of stock switch. */
  available: boolean;
  /** false when TrainDhaba has switched the item off. */
  adminAvailable: boolean | null;
  adminInactiveReason: string;
  /** Picture URLs (signed, short-lived) as the API returns them. */
  images: string[];
  createdAt: string;
}
// The API takes one picture per request and replaces the whole set with it.
export const MAX_ITEM_IMAGES = 1;
const MAX_IMAGE_SIZE = 2 * 1024 * 1024;
export const ITEM_IMAGE_TYPES = ["image/jpeg", "image/webp"];
const isItemImage = (value: unknown) =>
  typeof File !== "undefined" &&
  value instanceof File &&
  value.size > 0 &&
  value.size <= MAX_IMAGE_SIZE &&
  ITEM_IMAGE_TYPES.includes(value.type);
const wholeNumber = (label: string) =>
  z
    .number({ invalid_type_error: `Enter the ${label}.` })
    .int(`Enter the ${label} in whole numbers.`)
    .min(0, `The ${label} cannot be negative.`);
/** Form state; empty number inputs are null. */
export interface MenuItemForm {
  foodType: MenuFoodType | "";
  name: string;
  description: string;
  category: string;
  subCategory: string;
  price: number | null;
  discountedPrice: number | null;
  taxRate: number | null;
  preparationMinutes: number | null;
  quantity: number | null;
  lowStockThreshold: number | null;
  available: boolean;
  /** New pictures; choosing any replaces the saved ones. */
  images: (File | null)[];
}
export const emptyMenuItemForm = (): MenuItemForm => ({
  foodType: "",
  name: "",
  description: "",
  category: "",
  subCategory: "",
  price: null,
  discountedPrice: null,
  taxRate: 0,
  preparationMinutes: null,
  quantity: 0,
  lowStockThreshold: 0,
  available: true,
  images: [null],
});
// Mirrors validators/menu-item.validator.js: name, price and preparation
// time are required; numbers other than the tax rate are whole numbers.
export const menuItemFormSchema: z.ZodType<MenuItemForm> = z
  .object({
    foodType: z.custom<MenuFoodType | "">(
      (v) => menuFoodTypes.includes(v as MenuFoodType),
      "Select veg, egg or non-veg.",
    ),
    name: z
      .string()
      .trim()
      .min(1, "Enter the item name.")
      .max(255, "Keep the name under 255 characters."),
    description: z
      .string()
      .trim()
      .max(500, "Keep the description under 500 characters."),
    category: z
      .string()
      .trim()
      .min(1, "Enter the category.")
      .max(255, "Keep the category under 255 characters."),
    subCategory: z
      .string()
      .trim()
      .max(255, "Keep the sub category under 255 characters."),
    price: wholeNumber("price").positive("Enter a price above ₹0."),
    discountedPrice: wholeNumber("offer price").nullable(),
    taxRate: z
      .number({ invalid_type_error: "Enter the tax rate." })
      .min(0, "The tax rate cannot be negative.")
      .max(100, "The tax rate cannot be above 100%."),
    preparationMinutes: wholeNumber("preparation time").positive(
      "Enter at least 1 minute.",
    ),
    quantity: wholeNumber("stock quantity"),
    lowStockThreshold: wholeNumber("low-stock level"),
    available: z.boolean(),
    images: z
      .array(
        z.custom<File | null>(
          (v) => v === null || isItemImage(v),
          "Upload a JPG or WEBP image (up to 2 MB).",
        ),
      )
      .max(MAX_ITEM_IMAGES),
  })
  .superRefine((data, ctx) => {
    if (
      data.discountedPrice !== null &&
      data.price !== null &&
      data.discountedPrice >= data.price
    )
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["discountedPrice"],
        message: "The offer price must be lower than the price.",
      });
  }) as z.ZodType<MenuItemForm>;
export const toMenuItemForm = (item: MenuItem): MenuItemForm => ({
  foodType: item.foodType ?? "",
  name: item.name,
  description: item.description,
  category: item.category,
  subCategory: item.subCategory ?? "",
  price: item.price,
  discountedPrice: item.discountedPrice,
  taxRate: item.taxRate,
  preparationMinutes: item.preparationMinutes,
  quantity: item.quantity,
  lowStockThreshold: item.lowStockThreshold,
  available: item.available,
  images: [null],
});
/** Request body field names, as the backend expects them. */
/** `categoryId` is the saved category's id; without it the typed name is sent. */
export function toMenuItemPayload(form: MenuItemForm, categoryId?: string | null) {
  return {
    name: form.name.trim(),
    description: form.description.trim() || null,
    category_id: categoryId ?? (form.category.trim() || null),
    price: form.price ?? 0,
    discounted_price: form.discountedPrice,
    tax_rate: form.taxRate ?? 0,
    preparation_time_minutes: form.preparationMinutes ?? 0,
    quantity: form.quantity ?? 0,
    low_stock_threshold: form.lowStockThreshold ?? 0,
    owner_is_available: form.available,
    food_served: form.foodType ? [foodTypeKeys[form.foodType]] : null,
  };
}
type Row = Record<string, unknown>;
const text = (value: unknown) => (typeof value === "string" ? value : "");
// Postgres numeric columns (tax_rate) arrive as strings.
const number = (value: unknown, fallback = 0) => {
  const n = Number(value);
  return value !== null && value !== "" && Number.isFinite(n) ? n : fallback;
};
export function fromMenuItemRow(row: Row): MenuItem {
  const served = Array.isArray(row.food_served) ? row.food_served : [],
    foodType =
      menuFoodTypes.find((type) =>
        served.some((s) => String(s).toLowerCase() === foodTypeKeys[type]),
      ) ?? null,
    reason = row.admin_item_inactive_reason as Row | null;
  return {
    id: text(row.id),
    name: text(row.name),
    description: text(row.description),
    price: number(row.price),
    discountedPrice:
      row.discounted_price == null ? null : number(row.discounted_price),
    taxRate: number(row.tax_rate),
    preparationMinutes: number(row.preparation_time_minutes),
    foodType,
    category: text(row.category_id),
    subCategory: text(row.sub_category),
    quantity: number(row.quantity),
    lowStockThreshold: number(row.low_stock_threshold),
    available: row.owner_is_available !== false,
    adminAvailable:
      typeof row.admin_is_available === "boolean"
        ? row.admin_is_available
        : null,
    adminInactiveReason:
      reason && typeof reason === "object"
        ? text(reason.reason) || text(reason.message)
        : "",
    images:
      [row.img_urls, row.img_id]
        .find(Array.isArray)
        ?.filter((p): p is string => typeof p === "string" && !!p) ?? [],
    createdAt: text(row.created_at),
  };
}
/** Low stock only counts once the restaurant sets a threshold. */
export const isLowStock = (item: MenuItem) =>
  item.lowStockThreshold > 0 && item.quantity <= item.lowStockThreshold;
