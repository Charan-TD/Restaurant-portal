/** The lists behind the Insights cards (Total orders, Undelivered, Total sale value, COD, Prepaid). */
export type DetailKind =
  | "total-orders"
  | "undelivered"
  | "total-sale"
  | "cod"
  | "prepaid";

export const DETAIL_KINDS: DetailKind[] = [
  "total-orders",
  "undelivered",
  "total-sale",
  "cod",
  "prepaid",
];

/** COD and prepaid lists exist only for restaurants with their own riders. */
export const OWN_RIDERS_ONLY: DetailKind[] = ["cod", "prepaid"];

export const detailTitle: Record<DetailKind, string> = {
  "total-orders": "Total orders",
  undelivered: "Undelivered orders",
  "total-sale": "Total sale value",
  cod: "Cash on delivery orders",
  prepaid: "Prepaid orders",
};
/** The breadcrumb's last name. */
export const detailCrumb: Record<DetailKind, string> = {
  "total-orders": "Total orders",
  undelivered: "Undelivered",
  "total-sale": "Total sale value",
  cod: "COD",
  prepaid: "Prepaid",
};
export const isDetailKind = (value: string): value is DetailKind =>
  (DETAIL_KINDS as string[]).includes(value);
