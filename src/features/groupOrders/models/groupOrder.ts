/**
 * The server moves a group order strictly forward: ASSIGNED → PREPARING →
 * READY → OUT_FOR_DELIVERY → DELIVERED. The restaurant may also reject an
 * ASSIGNED order, and FAILED is allowed from any step.
 */
export type GroupOrderStatus =
  | "ASSIGNED"
  | "PREPARING"
  | "READY"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "REJECTED"
  | "FAILED";
export interface GroupOrder {
  /** The public grp_ord_id the status endpoints take. */
  id?: string;
  /** Unique within the list: the id, or built from the order's details. */
  key: string;
  contactName: string;
  mobile: string;
  email?: string;
  groupSize: number;
  /** What the customer asked for, in their own words. */
  details: string;
  status: GroupOrderStatus | string;
  /** When the order last changed, if the server says: orders the list by recency. */
  updatedAt?: string;
  /** When the order was placed. */
  placedAt?: string;
  /** When the TrainDhaba team assigned it to this restaurant. */
  assignedAt?: string;
  /** The items ordered; empty when none are listed. */
  items: GroupOrderItem[];
  /** The order's value as the server states it; otherwise the items are added up. */
  total?: number;
  trainNumber?: string;
  trainName?: string;
  /** Where the food is handed to the passengers, e.g. "Bengaluru Cantt (BNC)". */
  stationName?: string;
  /** When the train reaches that station (ISO date-time). */
  trainArrival?: string;
  coaches: string[];
  /** When the food must be ready (ISO); see readyAt for the fallback. */
  readyBy?: string;
  /** When the rider reaches the restaurant to collect it (ISO), if the server says. */
  riderAt?: string;
  /** Instructions for the kitchen, e.g. "Pack each meal separately". */
  note?: string;
  /**
   * Who takes the order to the customer: the restaurant's own rider, chosen
   * while preparing, or the TrainDhaba rider the server reports.
   */
  rider?: { id: string; name: string; phone?: string };
}
/** One line of a group order's items. */
export interface GroupOrderItem {
  name: string;
  quantity: number;
  /** Price of the whole line (unit price × quantity), if the server sends one. */
  amount?: number;
  /** Price of one, if the server sends one. */
  unitPrice?: number;
  description?: string;
  /** "veg", "non-veg" or "egg", for the food mark. */
  foodType?: string;
}
export const statusLabel: Record<string, string> = {
  ASSIGNED: "Upcoming",
  PREPARING: "Preparing",
  READY: "Food ready",
  OUT_FOR_DELIVERY: "With rider",
  DELIVERED: "Delivered",
  REJECTED: "Rejected",
  FAILED: "Failed",
};

/** How long before the ready time the kitchen may start. */
export const START_WINDOW_MS = 2 * 60 * 60 * 1000;
/** Without a ready time from the server, food is due this long before the train arrives. */
const READY_BEFORE_ARRIVAL_MS = 30 * 60 * 1000;

const time = (iso?: string) => {
  const t = Date.parse(iso ?? "");
  return Number.isFinite(t) ? t : undefined;
};
/** When the food must be ready: the server's time, or 30 minutes before the train. */
export const readyAt = (order: GroupOrder) => {
  const ready = time(order.readyBy),
    arrival = time(order.trainArrival);
  return ready ?? (arrival === undefined ? undefined : arrival - READY_BEFORE_ARRIVAL_MS);
};
/** The earliest the kitchen may start: two hours before the ready time. Unknown means any time. */
export const startAt = (order: GroupOrder) => {
  const ready = readyAt(order);
  return ready === undefined ? undefined : ready - START_WINDOW_MS;
};
export const canStart = (order: GroupOrder, now: number) => {
  const start = startAt(order);
  return start === undefined || now >= start;
};
/** Meals in the order: the group size, or the items added up. */
export const mealCount = (order: GroupOrder) =>
  order.groupSize || order.items.reduce((sum, item) => sum + item.quantity, 0);
export const orderValue = (order: GroupOrder) =>
  order.total ?? order.items.reduce((sum, item) => sum + (item.amount ?? 0), 0);

/** The screen's tabs and the statuses each holds. */
export type GroupOrderTab = "upcoming" | "preparing" | "completed";
const preparing = ["PREPARING", "READY", "OUT_FOR_DELIVERY"],
  completed = ["DELIVERED", "REJECTED", "FAILED"];
/** A status no tab knows (e.g. an older admin status) counts as upcoming rather than disappearing. */
export const tabOf = (status: string): GroupOrderTab =>
  completed.includes(status)
    ? "completed"
    : preparing.includes(status)
      ? "preparing"
      : "upcoming";

/** Sample orders for demo mode, timed around now so every state can be seen. */
export function demoGroupOrders(now: number): GroupOrder[] {
  const at = (minutes: number) => new Date(now + minutes * 60000).toISOString(),
    item = (name: string, quantity: number, unitPrice: number, foodType: string, description?: string) => ({
      name,
      quantity,
      unitPrice,
      amount: unitPrice * quantity,
      foodType,
      description,
    }),
    base = { contactName: "", mobile: "", details: "", coaches: [] as string[], items: [] };
  return [
    {
      ...base,
      id: "GRP-2036",
      key: "GRP-2036",
      status: "ASSIGNED",
      contactName: "Rahul M.",
      mobile: "9876543210",
      groupSize: 18,
      trainName: "Udyan Express",
      trainNumber: "11301",
      stationName: "Bengaluru Cantt (BNC)",
      trainArrival: at(100),
      readyBy: at(70),
      riderAt: at(65),
      coaches: ["B2", "B3"],
      assignedAt: at(-60 * 26),
      note: "Pack each meal separately with the seat number on it.",
      items: [
        item("Veg thali", 12, 140, "veg", "Rice, dal, 2 sabzi, 3 roti, curd"),
        item("Egg biryani", 6, 170, "egg", "With raita"),
      ],
    },
    {
      ...base,
      id: "GRP-2041",
      key: "GRP-2041",
      status: "ASSIGNED",
      contactName: "Anita K.",
      mobile: "9876500011",
      groupSize: 24,
      trainName: "Karnataka Express",
      trainNumber: "12627",
      stationName: "Bengaluru Cantt (BNC)",
      trainArrival: at(60 * 26),
      readyBy: at(60 * 26 - 30),
      riderAt: at(60 * 26 - 35),
      coaches: ["S4", "S5", "S6"],
      assignedAt: at(-60 * 48),
      note: "Pack each meal separately with the seat number on it.",
      items: [
        item("Veg thali", 16, 140, "veg", "Rice, dal, 2 sabzi, 3 roti, curd"),
        item("Chicken biryani", 8, 220, "non-veg", "With raita and salan"),
      ],
    },
    {
      ...base,
      id: "GRP-2033",
      key: "GRP-2033",
      status: "PREPARING",
      contactName: "Suresh P.",
      mobile: "9876500022",
      groupSize: 12,
      trainName: "Shatabdi Express",
      trainNumber: "12007",
      stationName: "KSR Bengaluru (SBC)",
      trainArrival: at(75),
      readyBy: at(45),
      coaches: ["C2"],
      assignedAt: at(-60 * 20),
      items: [item("Paneer meal", 12, 160, "veg", "Paneer curry, rice, 2 roti")],
    },
    {
      ...base,
      id: "GRP-2019",
      key: "GRP-2019",
      status: "DELIVERED",
      contactName: "Vikram S.",
      mobile: "9876500033",
      groupSize: 30,
      trainName: "Rajdhani Express",
      trainNumber: "22691",
      stationName: "KSR Bengaluru (SBC)",
      trainArrival: at(-60 * 20),
      readyBy: at(-60 * 20 - 30),
      coaches: ["A1", "A2"],
      assignedAt: at(-60 * 70),
      updatedAt: at(-60 * 20),
      items: [item("Veg thali", 30, 140, "veg")],
    },
  ];
}
