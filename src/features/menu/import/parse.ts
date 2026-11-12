import type { ImportFoodType, RawValue } from "./types";

/** 40, "₹40" and "1,250.50" are prices; anything unclear stays null so it shows as invalid. */
export function parsePrice(value: RawValue | undefined): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string" || !value.trim()) return null;
  const cleaned = value
    .trim()
    .replace(/^(?:rs\.?|inr)?\s*[₹$€£]?\s*/i, "")
    .replace(/\s*[₹$€£]$/, "")
    .replace(/\s*(?:\/-|only)$/i, "");
  if (!/^-?(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d+)?$/.test(cleaned)) return null;
  const number = Number(cleaned.replace(/,/g, ""));
  return Number.isFinite(number) ? number : null;
}

/** A plain number such as a prep time or a percentage; null when it is not one. */
export function parseNumber(value: RawValue | undefined): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string") return null;
  // "20 min" and "20 mins" are read as 20.
  const cleaned = value.trim().replace(/\s*(?:minutes?|mins?|m|%)$/i, "");
  return /^-?\d+(?:\.\d+)?$/.test(cleaned) ? Number(cleaned) : null;
}

/** Yes / No, true / false, 1 / 0; other text is kept (as a string) for review. */
export function parseAvailability(
  value: RawValue | undefined,
): boolean | string | null {
  if (typeof value === "boolean") return value;
  if (value === null || value === undefined || String(value).trim() === "")
    return null;
  const text = String(value).trim().toLowerCase();
  if (["true", "yes", "y", "1", "available", "in stock"].includes(text)) return true;
  if (["false", "no", "n", "0", "unavailable", "out of stock"].includes(text))
    return false;
  return String(value);
}

/** Veg, Non-veg or Egg from the many ways vendors write them. "" when unknown. */
export function parseFoodType(value: RawValue | undefined): ImportFoodType {
  const text = String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "");
  if (!text) return "";
  if (/^(non|nv|n)/.test(text) || text === "meat" || text === "chicken")
    return "Non-veg";
  if (/egg|anda|ande/.test(text)) return "Egg";
  if (/^(veg|v$|pureveg|vegetarian)/.test(text)) return "Veg";
  return "";
}
