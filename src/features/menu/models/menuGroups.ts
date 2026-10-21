import type { MenuItem } from "./menuItem";
import type { MenuCategories } from "../services/menuItemService";

export const UNCATEGORISED = "Uncategorised";

export interface SubCategoryNode {
  name: string;
  items: MenuItem[];
}

/** A category, its sub categories and every item filed under it. */
export interface CategoryNode {
  /** Server id such as CAT002; missing for a name only seen on items. */
  id?: string;
  name: string;
  subs: SubCategoryNode[];
  /** All items in the category, with or without a sub category. */
  items: MenuItem[];
}

/**
 * The restaurant's categories from the server, with its items placed under
 * them. Names that only appear on items are added so nothing is hidden.
 */
export function buildCategoryTree(
  lists: MenuCategories,
  items: MenuItem[],
): CategoryNode[] {
  const nodes = new Map<string, CategoryNode>();
  const node = (name: string, id?: string) => {
    const found = nodes.get(name) ?? { id, name, subs: [], items: [] };
    if (id && !found.id) found.id = id;
    nodes.set(name, found);
    return found;
  };
  const sub = (parent: CategoryNode, name: string) => {
    let found = parent.subs.find((s) => s.name === name);
    if (!found) parent.subs.push((found = { name, items: [] }));
    return found;
  };
  for (const c of lists.categories) node(c.name, c.id);
  for (const s of lists.subCategories) {
    const parent = lists.categories.find((c) => c.id === s.parentId);
    if (parent) sub(node(parent.name, parent.id), s.name);
  }
  for (const item of items) {
    const parent = node(item.category.trim() || UNCATEGORISED);
    parent.items.push(item);
    if (item.subCategory?.trim())
      sub(parent, item.subCategory.trim()).items.push(item);
  }
  // Uncategorised only matters when something is in it.
  const uncategorised = nodes.get(UNCATEGORISED);
  if (uncategorised && !uncategorised.items.length) nodes.delete(UNCATEGORISED);
  return [...nodes.values()].sort((a, b) => a.name.localeCompare(b.name));
}
