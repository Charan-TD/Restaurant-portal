export const OFFER_TYPES = [
  "% off",
  "Flat ₹ off",
  "Free item",
  "Combo price",
] as const;
export type OfferType = (typeof OFFER_TYPES)[number];
export const CUSTOMER_TYPES = ["All passengers", "First-time customer"] as const;
export type CustomerType = (typeof CUSTOMER_TYPES)[number];
export type OfferStatus = "live" | "paused" | "scheduled" | "ended";

/** What the Create offer form collects. */
export interface OfferForm {
  type: OfferType;
  /** The percentage, rupees off, combo price or the free item's name. */
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

/** The unit shown before the discount box, by offer type. */
export const valuePrefix = (type: OfferType) =>
  type === "% off" ? "%" : type === "Free item" ? undefined : "₹";

export const valueLabel = (type: OfferType) =>
  type === "Free item"
    ? "Free item"
    : type === "Combo price"
      ? "Combo price"
      : "Discount";

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
    case "Combo price":
      return `Combo at ₹${v}`;
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
