import { claimsOf, getAccessToken } from "@/core/api/axios";

// The server's category list is shared by every restaurant, and an item only
// carries an id such as "CAT004". So the names this restaurant saved are
// remembered here, per restaurant, to fill the dropdowns and to turn ids back
// into names. Storage is keyed by the signed-in restaurant so that another
// restaurant using the same browser never sees these names.
const KEY = "td.menuCategories";
interface Remembered {
  /** id → name; a sub category also remembers the category it was saved with. */
  names: Record<string, { name: string; parent?: string }>;
  categories: string[];
  subCategories: string[];
}
const empty = (): Remembered => ({
  names: {},
  categories: [],
  subCategories: [],
});

/** Storage key for the signed-in restaurant; none when nobody is signed in. */
function storageKey(): string | null {
  const token = getAccessToken(),
    id = token ? claimsOf(token)?.restaurant_id : undefined;
  return typeof id === "string" && id ? `${KEY}.${id}` : null;
}
export function loadRemembered(): Remembered {
  const key = storageKey();
  if (!key) return empty();
  try {
    // The old shared entry mixed restaurants' names together.
    localStorage.removeItem(KEY);
    const raw = localStorage.getItem(key);
    return raw ? { ...empty(), ...JSON.parse(raw) } : empty();
  } catch {
    return empty();
  }
}
/**
 * Called after an item is saved. `id` is the item's category id: the sub
 * category's id when one was given, else the category's.
 */
export function rememberCategory(
  id: string | undefined,
  category: string,
  subCategory: string,
) {
  const key = storageKey();
  if (!key || (!category && !subCategory)) return;
  try {
    const memory = loadRemembered();
    if (category && !memory.categories.includes(category))
      memory.categories.push(category);
    if (subCategory && !memory.subCategories.includes(subCategory))
      memory.subCategories.push(subCategory);
    if (id)
      memory.names[id] = subCategory
        ? { name: subCategory, parent: category || undefined }
        : { name: category };
    localStorage.setItem(key, JSON.stringify(memory));
  } catch {
    // Storage unavailable: names then come from the server only.
  }
}
