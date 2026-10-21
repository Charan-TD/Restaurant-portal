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
  /** The passenger's train ticket number. */
  pnr?: string;
  placedAt?: string;
}
