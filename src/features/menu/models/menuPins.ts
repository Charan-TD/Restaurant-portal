/**
 * Pinned items: the dishes a restaurant shows at the top of its menu, the
 * ones that sell most. The API keeps only whether a dish is pinned
 * (is_starred), with no limit; the order is the restaurant's own and is kept in the browser.
 */
import type { MenuItem } from "./menuItem";

/** The pinned dishes: the saved order first, then any others as the list has them. */
export function orderPinned(items: MenuItem[], saved: string[]): MenuItem[] {
  const pinned = items.filter((i) => i.starred),
    rank = (id: string) => {
      const at = saved.indexOf(id);
      return at < 0 ? Number.MAX_SAFE_INTEGER : at;
    };
  return pinned
    .map((item, i) => ({ item, i }))
    .sort((a, b) => rank(a.item.id) - rank(b.item.id) || a.i - b.i)
    .map(({ item }) => item);
}

/** Moves `id` to where `target` is. */
export function moveBefore(ids: string[], id: string, target: string): string[] {
  if (id === target || !ids.includes(id) || !ids.includes(target)) return ids;
  const rest = ids.filter((x) => x !== id);
  rest.splice(rest.indexOf(target), 0, id);
  return rest;
}

/** What to send to go from the pinned ids now to the ones chosen. */
export function pinChanges(now: string[], next: string[]) {
  return {
    pin: next.filter((id) => !now.includes(id)),
    unpin: now.filter((id) => !next.includes(id)),
  };
}
