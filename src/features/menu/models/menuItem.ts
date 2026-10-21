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
/** Quantity names accepted by the API (GET /menu-items/qty-types). */
export const qtyTypes = [
  "1 kg",
  "1 Litre",
  "250 g",
  "250 ml",
  "500 g",
  "500 ml",
  "Bowl",
  "Combo",
  "Cup",
  "Full Plate",
  "Glass",
  "Half Plate",
  "Large",
  "Medium",
  "Packet",
  "Piece",
  "Plate",
  "Small",
  "Thali",
] as const;

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
  /** Ids of the restaurant add-ons offered with this item. */
  addOnIds: string[];
  /** How the item is sold, e.g. Plate or Half Plate. */
  qtyType: string;
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
  addOnIds: string[];
  qtyType: string;
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
  addOnIds: [],
  qtyType: "",
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
    addOnIds: z.array(z.string()),
    qtyType: z.string(),
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
  addOnIds: item.addOnIds,
  qtyType: item.qtyType,
  available: item.available,
  images: [null],
});
/**
 * Request body, with the field names the backend expects. Category and sub
 * category go by name; `food_served` is one value; add-ons go as ids. The
 * price is `total_price` with the offer entered as a flat discount (the old
 * `price` and `discounted_price` fields are no longer accepted).
 */
export function toMenuItemPayload(form: MenuItemForm) {
  const price = form.price ?? 0,
    offer = form.discountedPrice,
    flat = offer !== null && offer < price ? price - offer : 0;
  return {
    name: form.name.trim(),
    description: form.description.trim() || null,
    category: form.category.trim() || undefined,
    sub_category: form.subCategory.trim() || undefined,
    total_price: price,
    discount_type: flat > 0 ? "flat" : null,
    disc_percent: 0,
    flat_amount: flat,
    tax_rate: form.taxRate ?? 0,
    preparation_time_minutes: form.preparationMinutes ?? 0,
    quantity: form.quantity ?? 0,
    qty_type: form.qtyType || undefined,
    addons: form.addOnIds,
    low_stock_threshold: form.lowStockThreshold ?? 0,
    owner_is_available: form.available,
    food_served: form.foodType ? foodTypeKeys[form.foodType] : undefined,
  };
}
/** Create takes no tax rate, stock quantity or low-stock level; they are set by an edit. */
export function toCreatePayload(form: MenuItemForm) {
  const payload: Record<string, unknown> = { ...toMenuItemPayload(form) };
  for (const key of ["tax_rate", "quantity", "low_stock_threshold"])
    delete payload[key];
  return payload;
}
/** Price and discount fields, which the server validates together. */
export function pricingPayload(form: MenuItemForm) {
  const { total_price, discount_type, disc_percent, flat_amount } =
    toMenuItemPayload(form);
  return { total_price, discount_type, disc_percent, flat_amount };
}
/**
 * PATCH body for an edit: only the fields the vendor actually changed, so
 * untouched values are never sent. The price and discount fields travel
 * together. Cleared add-ons go as [].
 */
export function changedMenuItemPayload(
  original: MenuItem,
  form: MenuItemForm,
): Record<string, unknown> {
  const before = toMenuItemPayload(toMenuItemForm(original)) as Record<
      string,
      unknown
    >,
    after = toMenuItemPayload(form) as Record<string, unknown>,
    differs = (key: string) =>
      JSON.stringify(before[key]) !== JSON.stringify(after[key]),
    changed: Record<string, unknown> = {};
  for (const key of Object.keys(after))
    if (after[key] !== undefined && differs(key)) changed[key] = after[key];
  // The server checks the price on every update, so it always goes along.
  return Object.keys(changed).length
    ? { ...pricingPayload(form), ...changed }
    : changed;
}
type Row = Record<string, unknown>;
const text = (value: unknown) => (typeof value === "string" ? value : "");
// Postgres numeric columns (tax_rate) arrive as strings.
const number = (value: unknown, fallback = 0) => {
  const n = Number(value);
  return value !== null && value !== "" && Number.isFinite(n) ? n : fallback;
};
export function fromMenuItemRow(row: Row): MenuItem {
  const served = Array.isArray(row.food_served)
      ? row.food_served
      : row.food_served
        ? [row.food_served]
        : [],
    foodType =
      menuFoodTypes.find((type) =>
        served.some((s) => String(s).toLowerCase() === foodTypeKeys[type]),
      ) ?? null,
    reason = row.admin_item_inactive_reason as Row | string | null;
  const price = number(row.total_price ?? row.price),
    flat = number(row.flat_amount),
    percent = number(row.disc_percent),
    discountedPrice =
      row.discounted_price != null
        ? number(row.discounted_price)
        : row.discount_type === "flat" && flat > 0
          ? Math.max(price - flat, 0)
          : row.discount_type === "percent" && percent > 0
            ? Math.round(price * (1 - percent / 100))
            : null;
  return {
    id: text(row.id),
    name: text(row.name),
    description: text(row.description),
    price,
    discountedPrice,
    taxRate: number(row.tax_rate),
    preparationMinutes: number(row.preparation_time_minutes),
    foodType,
    category: text(row.category_id),
    subCategory: text(row.sub_category),
    quantity: number(row.quantity),
    addOnIds: (Array.isArray(row.addons) ? row.addons : []).flatMap(
      (a: unknown): string[] => {
        const id = typeof a === "string" ? a : text((a as Row | null)?.id);
        return id ? [id] : [];
      },
    ),
    qtyType: text(row.qty_type),
    lowStockThreshold: number(row.low_stock_threshold),
    available: row.owner_is_available !== false,
    adminAvailable:
      typeof row.admin_is_available === "boolean"
        ? row.admin_is_available
        : null,
    // A plain text reason now; older rows held an object.
    adminInactiveReason:
      typeof reason === "string"
        ? reason
        : reason && typeof reason === "object"
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
