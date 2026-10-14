/**
 * New → Accepted → Preparing → Ready (packed) → HandedOver (given to the
 * rider); Rejected is a cancelled order.
 */
export type OrderStatus =
  | "New"
  | "Accepted"
  | "Preparing"
  | "Ready"
  | "HandedOver"
  | "Delivered"
  | "Rejected";
export interface Order {
  id: string;
  /** Items summary, e.g. "2 × Chicken Biryani, 1 × Raita". */
  food: string;
  /** Where the order goes, e.g. "Coach B2 · Seat 42". */
  station: string;
  amount: number;
  state: OrderStatus;
  customer?: string;
  placedAt?: string;
}
