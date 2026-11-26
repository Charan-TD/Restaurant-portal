export const OFFER_TYPES = ["% off", "Flat ₹ off", "Free item"] as const;
export type OfferType = (typeof OFFER_TYPES)[number];
export const CUSTOMER_TYPES = ["All passengers", "First-time customer"] as const;
export type CustomerType = (typeof CUSTOMER_TYPES)[number];
export type OfferStatus = "live" | "paused" | "scheduled" | "ended";

/** What the Create offer form collects. */
export interface OfferForm {
  type: OfferType;
  /** The percentage, rupees off, or the free item's name. */
  value: string;
  minOrder: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  customer: CustomerType;
}

export const emptyOfferForm = (): OfferForm => ({
  type: "Flat ₹ off",
  value: "",
  minOrder: "",
  startDate: "",
  endDate: "",
  startTime: "11:00",
  endTime: "15:00",
  customer: "All passengers",
});

/** An offer as the server stores it. */
export interface Offer {
  id: string;
  form: OfferForm;
  status: OfferStatus;
  /** False while the owner has it paused. */
  active: boolean;
}

export interface OfferPage {
  rows: Offer[];
  page: number;
  pages: number;
  counts: Record<OfferStatus, number>;
}

/** An offer's last seven days. */
export interface OfferMetrics {
  orders: number;
  discount: number;
  sales: number;
}

/** The unit shown before the discount box, by offer type. */
export const valuePrefix = (type: OfferType) =>
  type === "% off" ? "%" : type === "Free item" ? undefined : "₹";

export const valueLabel = (type: OfferType) =>
  type === "Free item" ? "Free item" : "Discount";

/** Times are shown in 24 hours, like 15:00. */
export function clockText(value: string) {
  const [h, m] = value.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return "";
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** The headline passengers see, e.g. "Flat ₹50 off". Empty until a value is typed. */
export function offerHeadline({ type, value }: OfferForm) {
  const v = value.trim();
  if (!v) return "";
  switch (type) {
    case "% off":
      return `${v}% off`;
    case "Flat ₹ off":
      return `Flat ₹${v} off`;
    case "Free item":
      return `Free ${v}`;
  }
}

/** The small line under the headline: minimum order and daily window. */
export function offerDetail(form: OfferForm) {
  const parts: string[] = [];
  if (form.minOrder.trim()) parts.push(`On orders above ₹${form.minOrder.trim()}`);
  if (form.startTime && form.endTime)
    parts.push(`${clockText(form.startTime)} – ${clockText(form.endTime)}`);
  return parts.join(" · ");
}

/** What is wrong with the form, or an empty string when it can be saved. */
export function offerProblem(form: OfferForm) {
  const value = form.value.trim();
  if (!value) return form.type === "Free item" ? "Enter the free item's name." : "Enter the discount.";
  if (form.type === "% off" && (Number(value) < 1 || Number(value) > 100))
    return "A percentage must be between 1 and 100.";
  if (form.type === "Flat ₹ off" && Number(value) < 1) return "Enter the rupees off.";
  if (!form.startDate || !form.endDate) return "Choose when the offer starts and ends.";
  if (form.endDate < form.startDate) return "The end date is before the start date.";
  if (!form.startTime || !form.endTime) return "Choose the daily time slot.";
  return "";
}

const TYPE_TO_SERVER: Record<OfferType, string> = {
  "% off": "PERCENTAGE",
  "Flat ₹ off": "FIXED",
  "Free item": "FREE_ITEM",
};
const TYPE_FROM_SERVER: Record<string, OfferType> = {
  PERCENTAGE: "% off",
  FIXED: "Flat ₹ off",
  FREE_ITEM: "Free item",
};

/** The body for POST and PATCH /restaurant/offers. */
export function toOfferPayload(form: OfferForm) {
  const free = form.type === "Free item";
  return {
    discount_type: TYPE_TO_SERVER[form.type],
    discount_value: free ? null : Number(form.value),
    free_item_name: free ? form.value.trim() : null,
    min_order_amount: Number(form.minOrder) || 0,
    valid_from: form.startDate,
    valid_until: form.endDate,
    daily_start_time: form.startTime,
    daily_end_time: form.endTime,
    customer_type: form.customer === "First-time customer" ? "FIRST_TIME" : "ALL",
  };
}

/** The form for an offer the server returned, so it can be edited. */
export function offerToForm(raw: Record<string, unknown>): OfferForm {
  const text = (v: unknown) => (typeof v === "string" ? v : "");
  const type = TYPE_FROM_SERVER[text(raw.discount_type)] ?? "Flat ₹ off";
  return {
    type,
    value: type === "Free item" ? text(raw.free_item_name) : String(raw.discount_value ?? ""),
    minOrder: raw.min_order_amount ? String(raw.min_order_amount) : "",
    // The server sends IST timestamps, so the date part is already the IST date.
    startDate: text(raw.starts_at).slice(0, 10),
    endDate: text(raw.expires_at).slice(0, 10),
    startTime: text(raw.daily_start_time).slice(0, 5),
    endTime: text(raw.daily_end_time).slice(0, 5),
    customer: raw.customer_type === "FIRST_TIME" ? "First-time customer" : "All passengers",
  };
}
