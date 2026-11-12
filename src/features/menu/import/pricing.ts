import type { DraftItem } from "./types";

/** What the customer pays for a price after the dish's discount (display only; the server prices the order). */
export function customerPays(
  price: number,
  item: Pick<DraftItem, "discountType" | "discPercent" | "flatAmount">,
): number {
  const off =
    item.discountType === "percent"
      ? (price * item.discPercent) / 100
      : item.discountType === "flat"
        ? item.flatAmount
        : 0;
  return Math.max(0, Math.round((price - off) * 100) / 100);
}
