/**
 * New → Preparing (accepted) → Ready (food ready for the rider) → HandedOver
 * (picked up by the rider) → Delivered; Rejected is a cancelled order. With
 * TrainDhaba riders the restaurant stops at Ready: the rider updates the rest
 * from the rider app.
 */
export type OrderStatus =
  "New" | "Preparing" | "Ready" | "HandedOver" | "Delivered" | "Rejected";
/** How each status reads on the order screens. */
export const stateLabel: Record<OrderStatus, string> = {
  New: "New",
  Preparing: "Preparing",
  Ready: "Ready",
  HandedOver: "Out for delivery",
  Delivered: "Delivered",
  Rejected: "Rejected",
};
export interface OrderLine {
  name: string;
  quantity: number;
  /** Price of the line, when the API sends one. */
  price?: number;
  /** The menu section, e.g. "Main course". */
  category?: string;
  /** Veg, Non-veg or Egg, when the API sends it. */
  type?: string;
  /** What the passenger asked for on this dish. */
  note?: string;
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
  /** Who is taking the order to the passenger, once it is handed over. */
  rider?: OrderRider;
  /** PAID, when the payment is known. */
  paymentStatus?: string;
  /** When the order was accepted (preparation started). */
  acceptedAt?: string;
  /** Minutes the kitchen has to prepare it. */
  prepMinutes?: number;
  /** The code the rider quotes at pickup. */
  pickupOtp?: string;
}

export interface OrderRider {
  id?: string;
  name: string;
  phone?: string;
}
