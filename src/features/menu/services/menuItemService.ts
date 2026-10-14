import { api, claimsOf, getAccessToken } from "@/core/api/axios";
import {
  API_PATHS,
  endpoint,
  DEMO_MODE,
  MENU_IMAGE_BASE_URL,
} from "@/core/constants/config";
import {
  fromMenuItemRow,
  toMenuItemPayload,
  type MenuItem,
  type MenuItemForm,
} from "../models/menuItem";
// Backend: GET /menu-items?restaurant_id=, GET /menu-items/categories,
// POST /menu-items, GET | PATCH | DELETE /menu-items/{id}. All take a
// restaurant login; responses are { success, message, data }.
const itemPath = (id: string) =>
  `${endpoint(API_PATHS.menuItems)}/${encodeURIComponent(id)}`;
const readItem = (body: unknown) =>
  fromMenuItemRow(
    ((body as { data?: unknown })?.data ?? body) as Record<string, unknown>,
  );
const newImages = (form: MenuItemForm) =>
  form.images.filter((file): file is File => !!file);
/**
 * Multipart sends every field as text: numbers and booleans as strings and
 * JSON fields JSON-encoded. Nulls cannot be sent this way, so they are left
 * out; the JSON request is used whenever a field must be cleared.
 */
function multipart(fields: Record<string, unknown>, files: File[]) {
  const body = new FormData();
  Object.entries(fields).forEach(([key, value]) => {
    if (value === null || value === undefined) return;
    body.append(
      key,
      typeof value === "object" ? JSON.stringify(value) : String(value),
    );
  });
  // One picture per request; it replaces the item's whole picture set.
  files.slice(0, 1).forEach((file) => body.append("img_id", file));
  return body;
}
/** The API sends signed picture URLs; older storage paths need the base URL. */
export const menuImageUrl = (path: string | undefined) =>
  path && /^https?:///.test(path)
    ? path
    : path && MENU_IMAGE_BASE_URL
    ? `${MENU_IMAGE_BASE_URL}/${path.split("/").map(encodeURIComponent).join("/")}`
    : null;
/**
 * The list endpoint only answers for the token's own restaurant, so the id
 * is read from the same `restaurant_id` claim the backend compares against.
 */
function signedInRestaurantId(): string {
  const token = getAccessToken(),
    id = token ? claimsOf(token)?.restaurant_id : undefined;
  if (typeof id !== "string" || !id)
    throw new Error("Please sign in again to load your menu.");
  return id;
}
// Demo mode keeps a small in-memory menu.
let demoItems: MenuItem[] = [
  {
    id: "demo-1",
    name: "Hyderabadi Chicken Dum Biryani",
    description: "Slow-cooked chicken biryani with raita.",
    price: 250,
    discountedPrice: 225,
    taxRate: 5,
    preparationMinutes: 25,
    foodType: "Non-veg",
    category: "Main course",
    quantity: 20,
    lowStockThreshold: 5,
    available: true,
    adminAvailable: null,
    adminInactiveReason: "",
    images: [],
    createdAt: "2026-10-10T07:38:17.328Z",
  },
  {
    id: "demo-2",
    name: "Paneer Butter Masala",
    description: "Cottage cheese in a rich tomato gravy.",
    price: 180,
    discountedPrice: null,
    taxRate: 5,
    preparationMinutes: 15,
    foodType: "Veg",
    category: "Main course",
    quantity: 3,
    lowStockThreshold: 5,
    available: true,
    adminAvailable: null,
    adminInactiveReason: "",
    images: [],
    createdAt: "2026-10-10T07:40:02.000Z",
  },
  {
    id: "demo-3",
    name: "Egg Fried Rice",
    description: "",
    price: 140,
    discountedPrice: null,
    taxRate: 5,
    preparationMinutes: 12,
    foodType: "Egg",
    category: "Rice",
    quantity: 0,
    lowStockThreshold: 0,
    available: false,
    adminAvailable: null,
    adminInactiveReason: "",
    images: [],
    createdAt: "2026-10-10T07:41:45.000Z",
  },
];
function demoSave(id: string, form: MenuItemForm): MenuItem {
  const current = demoItems.find((item) => item.id === id);
  const item: MenuItem = {
    id,
    name: form.name.trim(),
    description: form.description.trim(),
    price: form.price ?? 0,
    discountedPrice: form.discountedPrice,
    taxRate: form.taxRate ?? 0,
    preparationMinutes: form.preparationMinutes ?? 0,
    foodType: form.foodType || null,
    category: form.category.trim(),
    quantity: form.quantity ?? 0,
    lowStockThreshold: form.lowStockThreshold ?? 0,
    available: form.available,
    adminAvailable: current?.adminAvailable ?? null,
    adminInactiveReason: current?.adminInactiveReason ?? "",
    images: current?.images ?? [],
    createdAt: current?.createdAt ?? new Date().toISOString(),
  };
  demoItems = current
    ? demoItems.map((i) => (i.id === id ? item : i))
    : [item, ...demoItems];
  return item;
}
function demoFind(id: string): MenuItem {
  const item = demoItems.find((i) => i.id === id);
  if (!item) throw new Error("Menu item not found");
  return item;
}
export async function getMenuItem(id: string): Promise<MenuItem> {
  if (DEMO_MODE) return demoFind(id);
  const { data } = await api.get(itemPath(id));
  return (await withCategoryNames([readItem(data)]))[0];
}
/** Every item on the signed-in restaurant's menu, newest first. */
export async function listMenuItems(): Promise<MenuItem[]> {
  if (DEMO_MODE) return [...demoItems];
  const { data } = await api.get(endpoint(API_PATHS.menuItems), {
    params: { restaurant_id: signedInRestaurantId() },
  });
  const rows = (data as { data?: unknown })?.data ?? data;
  return withCategoryNames(
    Array.isArray(rows)
      ? rows.map((row) => fromMenuItemRow(row as Record<string, unknown>))
      : [],
  );
}
export async function createMenuItem(form: MenuItemForm): Promise<MenuItem> {
  if (DEMO_MODE) return demoSave(`demo-${Date.now()}`, form);
  const fields = toMenuItemPayload(form, await categoryIdFor(form)),
    files = newImages(form);
  const { data } = await api.post(
    endpoint(API_PATHS.menuItems),
    files.length ? multipart(fields, files) : fields,
  );
  return readItem(data);
}
/**
 * Fields go as JSON so cleared values (e.g. no offer price) are sent as
 * null. New pictures follow in a second, picture-only multipart request;
 * the backend replaces the whole picture set when any are sent.
 */
export async function updateMenuItem(
  id: string,
  form: MenuItemForm,
): Promise<MenuItem> {
  if (DEMO_MODE) return demoSave(id, form);
  const { data } = await api.patch(
    itemPath(id),
    toMenuItemPayload(form, await categoryIdFor(form)),
  );
  const files = newImages(form);
  if (!files.length) return readItem(data);
  const { data: withImages } = await api.patch(
    itemPath(id),
    multipart({}, files),
  );
  return readItem(withImages);
}
export async function setMenuItemAvailable(
  id: string,
  available: boolean,
): Promise<MenuItem> {
  if (DEMO_MODE) {
    const item = { ...demoFind(id), available };
    demoItems = demoItems.map((i) => (i.id === id ? item : i));
    return item;
  }
  const { data } = await api.patch(itemPath(id), {
    owner_is_available: available,
  });
  return readItem(data);
}
export async function deleteMenuItem(id: string): Promise<void> {
  if (DEMO_MODE) {
    demoItems = demoItems.filter((i) => i.id !== id);
    return;
  }
  await api.delete(itemPath(id));
}
export interface CategoryOption {
  id: string;
  name: string;
}
export interface MenuCategories {
  categories: CategoryOption[];
  subCategories: CategoryOption[];
}
/**
 * GET /menu-items/categories: rows of { category_id, category_name, parent_id }.
 * Rows under parent CAT001 are categories and rows under SUB001 are sub categories.
 */
export async function listMenuCategories(): Promise<MenuCategories> {
  if (DEMO_MODE)
    return {
      categories: [...new Set(demoItems.map((i) => i.category))]
        .filter(Boolean)
        .map((name) => ({ id: name, name })),
      subCategories: [],
    };
  const { data } = await api.get(`${endpoint(API_PATHS.menuItems)}/categories`);
  const rows = (data as { data?: unknown })?.data ?? data;
  const under = (parent: string): CategoryOption[] => {
    const seen = new Set<string>();
    return (Array.isArray(rows) ? rows : [])
      .filter((r) => (r as { parent_id?: unknown })?.parent_id === parent)
      .map((r) => ({
        id: String((r as { category_id?: unknown }).category_id ?? ""),
        name: String((r as { category_name?: unknown }).category_name ?? "").trim(),
      }))
      .filter((c) => c.id && c.name && !seen.has(c.id) && seen.add(c.id));
  };
  return { categories: under("CAT001"), subCategories: under("SUB001") };
}
/**
 * POST /menu-items/categories: saves a new category and optional sub category.
 * Returns the saved category's id when the server sends it back.
 */
export async function addMenuCategory(
  category: string,
  subcategory?: string,
): Promise<string | null> {
  if (DEMO_MODE) return category;
  const { data } = await api.post(`${endpoint(API_PATHS.menuItems)}/categories`, {
    category,
    ...(subcategory && { subcategory }),
  });
  const saved = ((data as { data?: { category?: { category_id?: unknown } } })?.data ?? {})
    .category;
  return typeof saved?.category_id === "string" ? saved.category_id : null;
}
const sameName = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();
/**
 * The item's category must already exist on the server (an unknown one makes
 * it fail), so a new category is saved first. Returns the id to attach.
 */
async function categoryIdFor(form: MenuItemForm): Promise<string | null> {
  const name = form.category.trim();
  if (!name) return null;
  if (DEMO_MODE) return name;
  const known = await listMenuCategories();
  const existing = known.categories.find((c) => sameName(c.name, name));
  const sub = form.subCategory.trim();
  const subIsNew = !!sub && !known.subCategories.some((c) => sameName(c.name, sub));
  if (existing && !subIsNew) return existing.id;
  let id: string | null;
  try {
    id = await addMenuCategory(name, sub || undefined);
  } catch {
    if (existing) return existing.id;
    throw new Error(
      "The new category could not be saved on the server, so the item was not added. Please try again or pick an existing category.",
    );
  }
  if (id && !existing) return id;
  const after = await listMenuCategories();
  return (
    existing?.id ??
    after.categories.find((c) => sameName(c.name, name))?.id ??
    id
  );
}
/** Shows category names instead of ids on items read from the server. */
async function withCategoryNames(items: MenuItem[]): Promise<MenuItem[]> {
  if (DEMO_MODE || !items.some((i) => i.category)) return items;
  try {
    const { categories } = await listMenuCategories();
    const names = new Map(categories.map((c) => [c.id, c.name]));
    return items.map((i) => ({ ...i, category: names.get(i.category) ?? i.category }));
  } catch {
    return items;
  }
}
