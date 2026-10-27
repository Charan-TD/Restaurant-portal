/**
 * New → Preparing (accepted) → Ready (packed) → HandedOver (given to the
 * rider); Rejected is a cancelled order.
 */
export type OrderStatus =
  "New" | "Preparing" | "Ready" | "HandedOver" | "Delivered" | "Rejected";
export interface OrderLine {
  name: string;
  quantity: number;
}

/** "Chicken Biryani", or "2 × Chicken Biryani" when more than one is ordered. */
export const lineLabel = ({ name, quantity }: OrderLine) =>
  quantity > 1 ? `${quantity} × ${name}` : name;

export interface Order {
  id: string;
  /** Everything the customer ordered. */
  items: OrderLine[];
  /** Items summary, e.g. "2 × Chicken Biryani, Raita". */
  food: string;
  /** Where the order goes, e.g. "Coach B2 · Seat 42". */
  station?: string;
  amount: number;
  state: OrderStatus;
  customer?: string;
  customerPhone?: string;
  /** The customer's id; the orders API does not send one. */
  customerId?: string;
  trainName?: string;
  trainNumber?: string;
  /** The boarding station's id; the orders API sends no station name. */
  stationId?: string;
  stationName?: string;
  coach?: string;
  seat?: string;
  /** The date of the passenger's journey (YYYY-MM-DD). */
  journeyDate?: string;
  /** Minutes the passenger expects to queue at the station. */
  queueMinutes?: number;
  /** The bill, as the server prices it. */
  bill?: {
    subtotal: number;
    tax: number;
    packagingFee: number;
    deliveryFee: number;
    discount: number;
  };
  /** When the order is expected to reach the passenger. */
  deliveryBy?: string;
  /** The passenger's train ticket number. */
  pnr?: string;
  placedAt?: string;
  /** What the customer asked for, e.g. "No spicy food." */
  note?: string;
}
