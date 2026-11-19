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

/**
 * A list of names with optional prices in one cell, the way vendors write
 * sizes and add-ons: "Half:120, Full:220", "Half - 120 / Full - 220",
 * "Raita (₹20); Papad 10", "Extra cheese". Empty when the cell is blank.
 */
export function parseNamedPrices(
  value: RawValue | undefined,
): { name: string; price: number | null }[] {
  if (value === null || value === undefined || typeof value === "boolean") return [];
  const text = String(value).trim();
  if (!text) return [];
  return text
    // Commas, semicolons, pipes, new lines, " / ", and "/" or "+" before a
    // word split the list; "40/-" and the "+50" of "Cheese +50" do not.
    .split(/\s*(?:[,;|\n]|\+(?!\s*(?:₹|rs\.?)?\s*\d)|\s\/\s|\/(?=\s*[a-z]))\s*/i)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const found = part.match(
        /^(.*?[^\s:=(@–+-])\s*(?:[:=@–-]|\()?\s*\+?\s*(-?\s*(?:rs\.?|inr)?\s*[₹$]?\s*\d+(?:\.\d+)?)\s*\)?\s*(?:\/-|rs\.?|only)?$/i,
      );
      // "120" alone is not "1" for ₹20: a name needs a letter.
      if (!found || !/[a-z]/i.test(found[1])) return { name: part, price: null };
      return { name: found[1].trim(), price: parsePrice(found[2].trim()) };
    });
}

/** Size names vendors use for quantities: Half, Full Plate, 250 ml, 2 pcs, Small… */
export const looksLikeSize = (name: string) =>
  /\b(half|full|quarter|small|medium|large|regular|single|double|mini|jumbo|family|plate|portion|bowl|glass|cup|piece|pieces|pcs?|nos?|ml|ltr?|litre|liter|kg|gm?s?|grams?)\b|^\d/i.test(
    name.trim(),
  );

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
