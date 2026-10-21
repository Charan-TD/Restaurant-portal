import { api } from "@/core/api/axios";
import { API_PATHS, endpoint, DEMO_MODE } from "@/core/constants/config";

/** A restaurant add-on: an extra customers can add to a dish. */
export interface RestaurantAddOn {
  id: string;
  name: string;
  /** Id of the category it belongs to, e.g. CAT002. */
  categoryId: string;
  /** Whole rupees; 0 for a free add-on. */
  price: number;
  active: boolean;
  /** Temporary signed link to the add-on's picture; empty when it has none. */
  imageUrl: string;
}
export interface AddOnForm {
  name: string;
  categoryId: string;
  price: number;
  /** A new picture; leave out to keep the saved one. */
  image?: File | null;
}
/** The picture must be a JPG, JPEG, PNG or WEBP under 2 MB. */
export const ADDON_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const ADDON_IMAGE_MAX_BYTES = 2 * 1024 * 1024;
// Backend: GET | POST /addons, PATCH | DELETE /addons/{addonId}. DELETE only
// deactivates the add-on. POST and PATCH are multipart/form-data so a picture
// (img_id) can go with the fields. Responses are { success, message, data }.
const addOnPath = (id: string) =>
  `${endpoint(API_PATHS.addons)}/${encodeURIComponent(id)}`;
type Row = Record<string, unknown>;
export function fromAddOnRow(row: Row): RestaurantAddOn {
  const price = Number(row.price ?? row.amount);
  return {
    id: String(row.id ?? row.addon_id ?? ""),
    name:
      ([row.addon_name, row.name].find((n) => typeof n === "string") as
        string | undefined) ?? "",
    categoryId: String(row.category_id ?? ""),
    imageUrl: typeof row.img_url === "string" ? row.img_url : "",
    price: Number.isFinite(price) ? price : 0,
    active:
      row.is_available !== false &&
      row.is_active !== false &&
      row.active !== false,
  };
}
const unwrap = (body: unknown): unknown =>
  (body as { data?: unknown })?.data ?? body;
const toRows = (body: unknown): Row[] => {
  const data = unwrap(body);
  if (Array.isArray(data)) return data as Row[];
  const inner = (data as Row | null)?.items ?? (data as Row | null)?.addons;
  return Array.isArray(inner) ? (inner as Row[]) : [];
};
function body(form: AddOnForm) {
  const data = new FormData();
  data.append("category_id", form.categoryId);
  data.append("addon_name", form.name.trim());
  data.append("price", String(form.price));
  data.append("is_available", "true");
  if (form.image) data.append("img_id", form.image);
  return data;
}

let demo: RestaurantAddOn[] = [
  {
    id: "demo-a1",
    categoryId: "CAT001",
    name: "Extra raita",
    price: 20,
    active: true,
    imageUrl: "",
  },
  {
    id: "demo-a2",
    categoryId: "CAT001",
    name: "Cold drink",
    price: 40,
    active: true,
    imageUrl: "",
  },
];

/** The signed-in restaurant's active add-ons. */
export async function listAddOns(): Promise<RestaurantAddOn[]> {
  if (DEMO_MODE) return [...demo];
  const { data } = await api.get(endpoint(API_PATHS.addons));
  return toRows(data)
    .map(fromAddOnRow)
    .filter((a) => a.id && a.name && a.active);
}
export async function createAddOn(form: AddOnForm): Promise<RestaurantAddOn> {
  if (DEMO_MODE) {
    const added = {
      id: `demo-a${Date.now()}`,
      name: form.name.trim(),
      categoryId: form.categoryId,
      price: form.price,
      active: true,
      imageUrl: form.image ? URL.createObjectURL(form.image) : "",
    };
    demo = [...demo, added];
    return added;
  }
  const { data } = await api.post(endpoint(API_PATHS.addons), body(form));
  return fromAddOnRow(unwrap(data) as Row);
}
export async function updateAddOn(
  id: string,
  form: AddOnForm,
): Promise<RestaurantAddOn> {
  if (DEMO_MODE) {
    const next = {
      id,
      name: form.name.trim(),
      categoryId: form.categoryId,
      price: form.price,
      active: true,
      imageUrl: form.image ? URL.createObjectURL(form.image) : "",
    };
    demo = demo.map((a) => (a.id === id ? next : a));
    return next;
  }
  const { data } = await api.patch(addOnPath(id), body(form));
  const saved = fromAddOnRow(unwrap(data) as Row);
  // Fall back to what was sent if the reply carries no add-on.
  return saved.id
    ? saved
    : {
        id,
        name: form.name.trim(),
        categoryId: form.categoryId,
        price: form.price,
        active: true,
        imageUrl: form.image ? URL.createObjectURL(form.image) : "",
      };
}
export async function deleteAddOn(id: string): Promise<void> {
  if (DEMO_MODE) {
    demo = demo.filter((a) => a.id !== id);
    return;
  }
  await api.delete(addOnPath(id));
}
