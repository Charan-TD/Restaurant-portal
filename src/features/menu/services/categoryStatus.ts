import { claimsOf, getAccessToken } from "@/core/api/axios";

// The category list does not say which categories this restaurant has switched
// off, so the switches it has saved are remembered here, per restaurant. A
// status the server does send wins over this.
const KEY = "td.categoryOff";

function storageKey(): string | null {
  const token = getAccessToken(),
    id = token ? claimsOf(token)?.restaurant_id : undefined;
  return typeof id === "string" && id ? `${KEY}.${id}` : null;
}

/** Ids of the categories and sub categories this restaurant switched off. */
export function loadSwitchedOff(): string[] {
  const key = storageKey();
  if (!key) return [];
  try {
    const value = JSON.parse(localStorage.getItem(key) ?? "[]");
    return Array.isArray(value) ? value.filter((v) => typeof v === "string") : [];
  } catch {
    return [];
  }
}

/** Remembers that a category (or sub category) is on or off; returns the new list. */
export function rememberActive(id: string, active: boolean): string[] {
  const rest = loadSwitchedOff().filter((v) => v !== id),
    next = active ? rest : [...rest, id],
    key = storageKey();
  if (key) {
    try {
      localStorage.setItem(key, JSON.stringify(next));
    } catch {
      // Private mode: the switch still works for this visit.
    }
  }
  return next;
}
