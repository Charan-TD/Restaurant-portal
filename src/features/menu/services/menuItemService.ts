import { api, claimsOf, getAccessToken } from "@/core/api/axios";
import {
  API_PATHS,
  endpoint,
  DEMO_MODE,
  MENU_IMAGE_BASE_URL,
} from "@/core/constants/config";
import {
  changedMenuItemPayload,
  fromMenuItemRow,
  pricingPayload,
  toCreatePayload,
  toMenuItemForm,
  type MenuItem,
  type MenuItemForm,
} from "../models/menuItem";
import { loadRemembered, rememberCategory } from "./categoryMemory";
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
  path && /^https?:/ //.test(path)
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
    addOnIds: [],
    qtyType: "",
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
    addOnIds: [],
    qtyType: "",
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
    addOnIds: [],
    qtyType: "",
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
    addOnIds: [...form.addOnIds],
    qtyType: form.qtyType,
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
  const fields = toCreatePayload(form),
    files = newImages(form);
  const { data } = await api.post(
    endpoint(API_PATHS.menuItems),
    files.length ? multipart(fields, files) : fields,
  );
  const saved = readItem(data);
  rememberCategory(
    saved.category,
    form.category.trim(),
    form.subCategory.trim(),
  );
  return saved;
}
/**
 * Fields go as JSON so cleared values (e.g. no offer price) are sent as
 * null. New pictures follow in a second, picture-only multipart request;
 * the backend replaces the whole picture set when any are sent.
 */
export async function updateMenuItem(
  id: string,
  form: MenuItemForm,
  original: MenuItem,
): Promise<MenuItem> {
  if (DEMO_MODE) return demoSave(id, form);
  const changes = changedMenuItemPayload(original, form),
    files = newImages(form);
  let data: unknown = null;
  if (Object.keys(changes).length) {
    ({ data } = await api.patch(itemPath(id), changes));
    rememberCategory(
      readItem(data).category,
      form.category.trim(),
      form.subCategory.trim(),
    );
  }
  if (!files.length) return data ? readItem(data) : original;
  const { data: withImages } = await api.patch(
    itemPath(id),
    multipart({}, files),
  );
  return readItem(withImages);
}
export async function setMenuItemAvailable(
  id: string,
  available: boolean,
  current: MenuItem,
): Promise<MenuItem> {
  if (DEMO_MODE) {
    const item = { ...demoFind(id), available };
    demoItems = demoItems.map((i) => (i.id === id ? item : i));
    return item;
  }
  const { data } = await api.patch(itemPath(id), {
    ...pricingPayload(toMenuItemForm(current)),
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
  /** For a sub category: the id of the category it belongs to. */
  parentId?: string;
}
export interface MenuCategories {
  categories: CategoryOption[];
  subCategories: CategoryOption[];
}
/**
 * GET /menu-items/categories: this restaurant's rows of
 * { category_id, category_name, parent_id, level, is_active }. Level 1 rows
 * are categories (parent CAT001); level 2 rows are sub categories whose
 * parent_id is their category.
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
  const seen = new Set<string>(),
    categories: CategoryOption[] = [],
    subCategories: CategoryOption[] = [];
  for (const r of Array.isArray(rows)
    ? (rows as Record<string, unknown>[])
    : []) {
    const id = String(r.category_id ?? ""),
      name = String(r.category_name ?? "").trim(),
      parent = String(r.parent_id ?? "");
    if (!id || !name || r.is_active === false || seen.has(id)) continue;
    seen.add(id);
    const sub = Number(r.level) === 2 || /^SUB/i.test(id);
    (sub ? subCategories : categories).push(
      sub ? { id, name, parentId: parent } : { id, name },
    );
  }
  return { categories, subCategories };
}
/** POST /menu-items/categories: saves categories, each with optional sub categories. */
export async function addMenuCategories(
  entries: { category: string; subcategories?: string[] }[],
): Promise<void> {
  if (DEMO_MODE) return;
  await api.post(`${endpoint(API_PATHS.menuItems)}/categories`, {
    categories: entries.map((e) => ({
      category: e.category.trim(),
      ...(e.subcategories?.length
        ? { subcategories: e.subcategories.map((n) => n.trim()) }
        : {}),
    })),
  });
}
const ID_LIKE = /^(CAT|SUB)\d+$/i;
/**
 * Items carry a category id: a sub category's id when one was given, else the
 * category's. Turns it back into names for the list and the edit form, from
 * the server's category list (falling back to the names this browser saved).
 * An id that cannot be resolved is shown as it is.
 */
async function withCategoryNames(items: MenuItem[]): Promise<MenuItem[]> {
  if (DEMO_MODE || !items.some((i) => i.category)) return items;
  let lists: MenuCategories = { categories: [], subCategories: [] };
  try {
    lists = await listMenuCategories();
  } catch {
    // Fall back to the remembered names.
  }
  const cats = new Map(lists.categories.map((c) => [c.id, c.name])),
    subs = new Map(lists.subCategories.map((c) => [c.id, c])),
    remembered = loadRemembered().names;
  return items.map((i) => {
    const id = i.category;
    if (!id) return i;
    const sub = subs.get(id);
    if (sub)
      return {
        ...i,
        subCategory: sub.name,
        category:
          (sub.parentId && cats.get(sub.parentId)) ||
          remembered[id]?.parent ||
          "",
      };
    if (cats.has(id)) return { ...i, category: cats.get(id)! };
    const known = remembered[id];
    if (known?.parent !== undefined || (known && /^SUB/i.test(id)))
      return { ...i, subCategory: known.name, category: known.parent ?? "" };
    if (known) return { ...i, category: known.name };
    // No name known: show the id rather than nothing.
    return { ...i, category: id };
  });
}
/** Category and sub category names for the form dropdowns. */
export async function listCategoryNames(): Promise<{
  categories: string[];
  subCategories: string[];
}> {
  const remembered = loadRemembered();
  let lists: MenuCategories = { categories: [], subCategories: [] };
  let own: MenuItem[] = [];
  try {
    [lists, own] = await Promise.all([listMenuCategories(), listMenuItems()]);
  } catch {
    // The remembered names still work offline.
  }
  const names = (...groups: (string | undefined)[][]) => [
    ...new Set(groups.flat().filter((n): n is string => !!n)),
  ];
  return {
    categories: names(
      lists.categories.map((c) => c.name),
      remembered.categories,
      own.map((i) => (ID_LIKE.test(i.category) ? undefined : i.category)),
    ),
    subCategories: names(
      lists.subCategories.map((c) => c.name),
      remembered.subCategories,
      own.map((i) => i.subCategory),
    ),
  };
}
