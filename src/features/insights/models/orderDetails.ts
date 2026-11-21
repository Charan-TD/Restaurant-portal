/**
 * DESIGN ONLY: the lists behind the Insights cards (Total orders, Undelivered,
 * Total sale value, COD, Prepaid). The rows below are generated sample data;
 * replace `detailRows` with the API's orders when the backend has it.
 */
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

export interface DetailRow {
  id: string;
  /** Milliseconds; the sample is all in November. */
  at: number;
  train: string;
  station: string;
  coach: string;
  seat: number;
  items: number;
  /** "Chicken Dum Biryani +3". */
  itemsLabel: string;
  amount: number;
  payment: "PREPAID" | "COD";
  status: "DELIVERED" | "UNDELIVERED";
  /** Undelivered orders only. */
  reason: string;
  /** Prepaid undelivered orders are refunded; COD ones were never paid. */
  settlement: "REFUNDED" | "NOT PAID";
  rider: string;
  cashStatus: "WITH RIDER" | "DEPOSITED";
  method: "UPI" | "Card" | "Wallet" | "Net banking";
  transactionId: string;
  payoutStatus: "SETTLED" | "IN NEXT PAYOUT";
}

const TRAINS = [
  ["12627 Karnataka Exp", "SBC"],
  ["16021 Kaveri Exp", "YPR"],
  ["12007 Shatabdi", "SBC"],
  ["11301 Udyan Exp", "BNC"],
  ["12658 Chennai Mail", "SBC"],
  ["22691 Rajdhani", "SBC"],
  ["16231 Mysuru Exp", "YPR"],
] as const;
export const DISHES = [
  "Chicken Dum Biryani",
  "Veg Thali",
  "Paneer Butter Masala",
  "Egg Biryani",
  "Dal Makhani",
  "Curd Rice",
];
export const UNDELIVERED_REASONS = [
  "Train delayed",
  "Passenger not found at seat",
  "Cancelled by passenger",
  "Wrong coach number",
];
export const RIDERS = ["Manoj K", "Ravi Kumar", "Suresh", "Imran"];
const METHODS = ["UPI", "UPI", "UPI", "Card", "Wallet", "Net banking"] as const;
const COACHES = ["A", "B", "C", "S"];

const TOTAL = 305,
  COD_ORDERS = 124,
  UNDELIVERED = 7;

/** A fixed pseudo-random sequence, so the sample is the same on every load. */
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

function build(): DetailRow[] {
  const rand = seeded(48290),
    pick = <T,>(list: readonly T[]) => list[Math.floor(rand() * list.length)],
    // Which orders are cash on delivery, and which were not delivered.
    order = Array.from({ length: TOTAL }, (_, i) => i).sort(() => rand() - 0.5),
    cod = new Set(order.slice(0, COD_ORDERS)),
    failed = new Set(order.slice(COD_ORDERS, COD_ORDERS + UNDELIVERED));
  return Array.from({ length: TOTAL }, (_, i) => {
    const [train, station] = pick(TRAINS),
      payment = cod.has(i) ? "COD" : "PREPAID",
      items = 1 + Math.floor(rand() * 4),
      day = 14 - Math.floor(i / 10) % 14,
      undelivered = failed.has(i);
    return {
      id: `#${48290 - i * 3}`,
      at: new Date(2026, 10, Math.max(day, 1), 11 + Math.floor(rand() * 10), Math.floor(rand() * 60)).getTime(),
      train,
      station,
      coach: `${pick(COACHES)}${1 + Math.floor(rand() * 6)}`,
      seat: 1 + Math.floor(rand() * 70),
      items,
      itemsLabel: `${pick(DISHES)}${items > 1 ? ` +${items - 1}` : ""}`,
      amount: (1 + Math.floor(rand() * 4)) * 60 + Math.floor(rand() * 8) * 60,
      payment,
      status: undelivered ? "UNDELIVERED" : "DELIVERED",
      reason: undelivered ? pick(UNDELIVERED_REASONS) : "",
      settlement: payment === "PREPAID" ? "REFUNDED" : "NOT PAID",
      rider: pick(RIDERS),
      cashStatus: rand() < 0.2 ? "WITH RIDER" : "DEPOSITED",
      method: pick(METHODS),
      transactionId: `TXN${String(Math.floor(rand() * 1e9)).padStart(9, "0")}`,
      payoutStatus: i < 30 ? "IN NEXT PAYOUT" : "SETTLED",
    };
  });
}

export const detailRows: DetailRow[] = build();

/** The orders each card opens. */
export const rowsFor = (kind: DetailKind): DetailRow[] =>
  kind === "undelivered"
    ? detailRows.filter((r) => r.status === "UNDELIVERED")
    : kind === "cod"
      ? detailRows.filter((r) => r.payment === "COD")
      : kind === "prepaid"
        ? detailRows.filter((r) => r.payment === "PREPAID")
        : detailRows;

export const trainOptions = [...new Set(TRAINS.map(([t]) => t))];
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
