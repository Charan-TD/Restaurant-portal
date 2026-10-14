// The server's category list returns only its two seed rows, and an item only
// carries an id such as "CAT004". So the names this browser saved are
// remembered here to show the dropdown values and to turn ids back into names.
const KEY = "td.menuCategories";
interface Remembered {
  /** id → name; a sub category also remembers the category it was saved with. */
  names: Record<string, { name: string; parent?: string }>;
  categories: string[];
  subCategories: string[];
}
const empty = (): Remembered => ({ names: {}, categories: [], subCategories: [] });
export function loadRemembered(): Remembered {
  try {
    const raw = localStorage.getItem(KEY);
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
  if (!category && !subCategory) return;
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
    localStorage.setItem(KEY, JSON.stringify(memory));
  } catch {
    // Storage unavailable: names then come from the server only.
  }
}
