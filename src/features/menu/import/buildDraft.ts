import { sizePriceColumns } from "./detectColumns";
import {
  parseAvailability,
  parseFoodType,
  parseNamedPrices,
  parseNumber,
  parsePrice,
} from "./parse";
import { MAX_ADDON_ROWS } from "./types";
import type {
  ColumnMapping,
  DraftItem,
  ImportField,
  DraftAddon,
  ImportIssue,
  RawSheet,
  RawValue,
} from "./types";

export { parsePrice };

let counter = 0;
const nextId = () => `draft-${Date.now().toString(36)}-${counter++}`;

export function emptyDraftItem(overrides: Partial<DraftItem> = {}): DraftItem {
  return {
    id: nextId(),
    sourceRow: 0,
    name: "",
    category: "",
    subCategory: "",
    price: null,
    prepMinutes: null,
    foodType: "",
    foodTypeText: "",
    description: "",
    available: true,
    discountType: null,
    discPercent: 0,
    flatAmount: 0,
    sizes: [],
    photoFile: "",
    photo: null,
    sourceSheet: "",
    original: [],
    addons: [],
    ...overrides,
  };
}

export function emptyAddon(overrides: Partial<DraftAddon> = {}): DraftAddon {
  return {
    id: nextId(),
    name: "",
    price: null,
    available: true,
    photo: null,
    ...overrides,
  };
}

/**
 * Sizes from a quantity cell: "Half:120, Full:220" as written, or "Half / Full"
 * paired with a price cell "120 / 220". A single quantity is not a size.
 */
function quantitySizes(quantity: RawValue, price: RawValue) {
  const named = parseNamedPrices(quantity),
    none = { sizes: [] as { name: string; price: number }[], usedPrice: false };
  if (named.length < 2) return none;
  if (named.every((s) => s.price !== null))
    return { sizes: named.map((s) => ({ name: s.name, price: s.price! })), usedPrice: false };
  const prices = String(price ?? "")
    .split(/\s*[\/,;|]\s*(?!-)/)
    .map((p) => parsePrice(p.trim()));
  return named.every((s) => s.price === null) &&
    prices.length === named.length &&
    prices.every((p) => p !== null)
    ? { sizes: named.map((s, i) => ({ name: s.name, price: prices[i]! })), usedPrice: true }
    : none;
}

const columnName = (i: number) => `Column ${String.fromCharCode(65 + (i % 26))}`;
const isBlank = (v: RawValue | undefined) =>
  v === null || v === undefined || String(v).trim() === "";

/** One dish for every non-blank row below the heading row. */
export function buildDraft(
  sheet: RawSheet,
  headerRow: number,
  mapping: ColumnMapping,
): DraftItem[] {
  const headings = sheet.rows.find((r) => r.sourceRow === headerRow)?.values ?? [],
    // Half / Full style columns become sizes with their own prices.
    sizeCols = sizePriceColumns(headings),
    items: DraftItem[] = [],
    // The single quantity a row names ("Half", "Ghee"), for dishes written one row per size.
    rowSize = new Map<string, string>();
  // The first spelling of a category wins, so "biryani" and "Biryani" are one category.
  const spelling = new Map<string, string>();
  const canonical = (value: string) => {
    if (!value) return "";
    const key = value.toLowerCase();
    if (!spelling.has(key)) spelling.set(key, value);
    return spelling.get(key)!;
  };
  for (const row of sheet.rows.filter((r) => r.sourceRow > headerRow)) {
    if (row.values.every(isBlank)) continue;
    const raw = (field: ImportField) =>
        mapping[field] === null ? null : (row.values[mapping[field]!] ?? null),
      text = (field: ImportField) => String(raw(field) ?? "").trim(),
      sizes = sizeCols
        .filter((i) => !isBlank(row.values[i]))
        .flatMap((i) => {
          const price = parsePrice(row.values[i]);
          return price === null
            ? []
            : [{ name: String(headings[i]).trim(), price }];
        });
    // Without Half / Full columns, a quantity column can hold the sizes:
    // "Half:120, Full:220", or "Half / Full" with the price column "120 / 220".
    const fromQuantity = sizeCols.length
      ? { sizes: [], usedPrice: false }
      : quantitySizes(raw("quantity"), raw("price"));
    sizes.push(...fromQuantity.sizes);
    const single = parseNamedPrices(raw("quantity")),
      sizeName = single.length === 1 && single[0].price === null ? single[0].name : "";
    let price = parsePrice(raw("price"));
    // No single price: the last size is the price, as with Half / Full columns (Full).
    if (price === null && sizes.length && (isBlank(raw("price")) || fromQuantity.usedPrice))
      price = sizes[sizes.length - 1].price;
    const kind = text("discountType").toLowerCase(),
      discountText = text("discPercent"),
      // A "Discount" column holding "₹20" is a flat discount, not a percentage.
      flatInPercent = /^(rs\.?|inr|₹)|(rs|\/-|₹)$/i.test(discountText),
      percent = flatInPercent ? 0 : (parseNumber(raw("discPercent")) ?? 0),
      flat = parsePrice(raw("flatAmount")) ?? (flatInPercent ? parsePrice(discountText) ?? 0 : 0),
      discountType: DraftItem["discountType"] = /^(percent|%|pct)/.test(kind)
        ? "percent"
        : /^(flat|amount|rs|inr|₹)/.test(kind)
          ? "flat"
          : percent > 0
            ? "percent"
            : flat > 0
              ? "flat"
              : null,
      available = parseAvailability(raw("available"));
    const item = emptyDraftItem({
      sourceRow: row.sourceRow,
      name: text("name"),
      category: canonical(text("category")),
      subCategory: text("subCategory"),
      price,
      prepMinutes: parseNumber(raw("prepMinutes")),
      foodType: parseFoodType(raw("foodType")),
      foodTypeText: parseFoodType(raw("foodType")) ? "" : text("foodType"),
      description: text("description"),
      // An unrecognised availability word is treated as available; the vendor can switch it off later.
      available: available === false ? false : true,
      discountType,
      discPercent: discountType === "percent" ? percent : 0,
      flatAmount: discountType === "flat" ? flat : 0,
      // One size price is just the price; sizes only matter from two up.
      sizes: sizes.length >= 2 ? sizes : [],
      photoFile: text("photoFile"),
      // "Raita:20, Papad 10": each becomes an add-on; one without a price shows as needing one.
      addons: parseNamedPrices(raw("addons")).map((a) =>
        emptyAddon({ name: a.name, price: a.price }),
      ),
      sourceSheet: sheet.name,
      original: row.values.flatMap((value, i) =>
        isBlank(value)
          ? []
          : [{ heading: isBlank(headings[i]) ? columnName(i) : String(headings[i]).trim(), value: String(value) }],
      ),
    });
    if (sizeName && !sizeCols.length) rowSize.set(item.id, sizeName);
    items.push(item);
  }
  return mergeSizeRows(items, rowSize);
}

/**
 * Dishes written one row per size ("Plain Dosa · Regular · 70", then
 * "Plain Dosa · Ghee · 95") become one dish with those sizes. Rows join when
 * they share the dish name and category, each names one quantity, and each
 * has a price; a quantity already on the dish stays a row of its own, so the
 * duplicate is reported. The price is the last size's, as with Half / Full columns.
 */
function mergeSizeRows(items: DraftItem[], rowSize: Map<string, string>) {
  if (!rowSize.size) return items;
  const merged: DraftItem[] = [],
    byDish = new Map<string, DraftItem>();
  for (const item of items) {
    const size = rowSize.get(item.id),
      key = `${item.name.trim().toLowerCase()}|${item.category.trim().toLowerCase()}`,
      joinable = !!size && !!item.name.trim() && item.price !== null,
      first = joinable ? byDish.get(key) : undefined;
    if (first && size && item.price !== null) {
      if (!first.sizes.length)
        first.sizes = [{ name: rowSize.get(first.id)!, price: first.price! }];
      if (!first.sizes.some((s) => s.name.toLowerCase() === size.toLowerCase())) {
        first.sizes.push({ name: size, price: item.price });
        first.price = item.price;
        // Add-ons listed on any of the rows belong to the dish once.
        for (const addon of item.addons)
          if (!first.addons.some((a) => a.name.toLowerCase() === addon.name.toLowerCase()))
            first.addons.push(addon);
        continue;
      }
    }
    if (joinable && !first) byDish.set(key, item);
    merged.push(item);
  }
  return merged;
}

/**
 * Size names the dishes use that the restaurant's quantity types do not have
 * yet, spelled as first written. They are saved as new types before import.
 */
export function newQtyTypes(items: DraftItem[], known: string[]): string[] {
  const have = new Set(known.map((n) => n.trim().toLowerCase())),
    found = new Map<string, string>();
  for (const item of items)
    for (const size of item.sizes) {
      const name = size.name.trim(),
        key = name.toLowerCase();
      if (name && !have.has(key) && !found.has(key)) found.set(key, name);
    }
  return [...found.values()];
}

const decimals = (n: number) => Math.round(n * 100) / 100 === n;

/** What must be fixed before an item can be sent. */
export function validateItem(item: DraftItem): ImportIssue[] {
  const issues: ImportIssue[] = [],
    add = (field: ImportIssue["field"], message: string) =>
      issues.push({ itemId: item.id, field, message });
  if (!item.name.trim()) add("name", "Dish name is missing.");
  if (!item.category.trim()) add("category", "Category is missing.");
  if (item.price === null) add("price", "Price is missing or not a number.");
  else if (item.price < 0) add("price", "Price cannot be negative.");
  else if (!decimals(item.price)) add("price", "Price can have at most 2 decimals.");
  if (!item.foodType)
    add("foodType", "Choose Veg, Non-veg or Egg.");
  if (
    item.prepMinutes === null ||
    !Number.isInteger(item.prepMinutes) ||
    item.prepMinutes <= 0
  )
    add("prepMinutes", "Prep time must be a whole number of minutes.");
  if (item.discountType === "percent" && (item.discPercent < 0 || item.discPercent > 100))
    add("discount", "Discount must be between 0 and 100%.");
  if (item.discountType === "flat") {
    const cheapest = Math.min(
      item.price ?? Infinity,
      ...item.sizes.map((s) => s.price),
    );
    if (item.flatAmount < 0 || item.flatAmount > cheapest)
      add("discount", "A flat discount cannot be more than the price.");
  }
  const names = item.sizes.map((s) => s.name.toLowerCase());
  if (new Set(names).size !== names.length)
    add("sizes", "Two sizes have the same name.");
  // A size name the restaurant does not have yet is fine: it is saved as a new
  // quantity type before the dishes are sent (see newQtyTypes).
  if (item.sizes.some((s) => !s.name.trim()))
    add("sizes", "Every size needs a name.");
  if (item.sizes.some((s) => !(s.price >= 0)))
    add("sizes", "A size price cannot be negative.");
  // Add-ons: a name, a price of 0 or more, and each name once per dish.
  const addons = item.addons ?? [];
  if (addons.some((a) => !a.name.trim()))
    add("addons", "Every add-on needs a name.");
  if (addons.some((a) => a.price === null || !(a.price >= 0)))
    add("addons", "Every add-on needs a price of 0 or more.");
  const addonNames = addons.filter((a) => a.name.trim()).map((a) => a.name.trim().toLowerCase());
  if (new Set(addonNames).size !== addonNames.length)
    add("addons", "Two add-ons on this dish have the same name.");
  return issues;
}

/** Item problems plus dishes that repeat a name within one category. */
export function validateDraft(items: DraftItem[]): ImportIssue[] {
  const issues = items.flatMap((i) => validateItem(i)),
    seen = new Map<string, string>();
  for (const item of items) {
    if (!item.name.trim()) continue;
    const key = `${item.category.toLowerCase()}|${item.name.trim().toLowerCase()}`;
    if (seen.has(key))
      issues.push({
        itemId: item.id,
        field: "name",
        message: "This dish is already in the list under the same category.",
      });
    else seen.set(key, item.id);
  }
  // The server shares an add-on by category, sub-category and name, so the same
  // add-on on two dishes there must have the same price, availability and picture.
  const shared = new Map<string, DraftAddon>();
  let addonRows = 0;
  for (const item of items)
    for (const addon of item.addons ?? []) {
      addonRows += 1;
      if (!addon.name.trim()) continue;
      const key = [item.category, item.subCategory, addon.name]
          .map((v) => v.trim().toLowerCase())
          .join("|"),
        first = shared.get(key);
      if (!first) {
        shared.set(key, addon);
        continue;
      }
      if (
        first.price !== addon.price ||
        first.available !== addon.available ||
        Boolean(first.photo) !== Boolean(addon.photo) ||
        (first.photo && addon.photo && first.photo.size !== addon.photo.size)
      )
        issues.push({
          itemId: item.id,
          field: "addons",
          message: `Add-on "${addon.name.trim()}" is shared within its category, so it needs the same price, availability and picture on every dish.`,
        });
    }
  if (addonRows > MAX_ADDON_ROWS && items[0])
    issues.push({
      itemId: items[0].id,
      field: "addons",
      message: `An import takes up to ${MAX_ADDON_ROWS} add-on rows.`,
    });
  return issues;
}
