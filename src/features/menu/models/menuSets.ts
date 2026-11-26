/**
 * "Copy from other items": the quantity sets and add-on sets the restaurant's
 * other dishes already use, grouped so identical sets show once with how many
 * dishes use them.
 */
import type { MenuItem } from "./menuItem";

export interface QuantitySet {
  key: string;
  rows: { name: string; price: number }[];
  usedIn: number;
}
export interface AddOnSet {
  key: string;
  ids: string[];
  usedIn: number;
}

/** Most used first; ties keep the order the dishes came in. */
function rank<T extends { usedIn: number }>(sets: Map<string, T>): T[] {
  return [...sets.values()].sort((a, b) => b.usedIn - a.usedIn);
}

/** The distinct quantity sets of `items`, leaving out the dish being edited. */
export function quantitySets(items: MenuItem[], exceptId?: string): QuantitySet[] {
  const sets = new Map<string, QuantitySet>();
  for (const item of items) {
    if (item.id === exceptId || !item.quantities.length) continue;
    const key = item.quantities
      .map((q) => `${q.name.trim().toLowerCase()}@${q.price}`)
      .join("|");
    const known = sets.get(key);
    if (known) known.usedIn += 1;
    else
      sets.set(key, {
        key,
        rows: item.quantities.map((q) => ({ name: q.name, price: q.price })),
        usedIn: 1,
      });
  }
  return rank(sets);
}

/** The distinct add-on sets of `items`, leaving out the dish being edited. */
export function addOnSets(items: MenuItem[], exceptId?: string): AddOnSet[] {
  const sets = new Map<string, AddOnSet>();
  for (const item of items) {
    if (item.id === exceptId || !item.addOnIds.length) continue;
    const ids = [...new Set(item.addOnIds)].sort(),
      key = ids.join("|"),
      known = sets.get(key);
    if (known) known.usedIn += 1;
    else sets.set(key, { key, ids, usedIn: 1 });
  }
  return rank(sets);
}

/** "Half ₹180 · Full ₹290" */
export const quantitySummary = (
  rows: { name: string; price: number | null }[],
  rupees: (n: number) => string,
) =>
  rows
    .filter((r) => r.name.trim())
    .map((r) => (r.price == null ? r.name : `${r.name} ${rupees(r.price)}`))
    .join(" · ");
