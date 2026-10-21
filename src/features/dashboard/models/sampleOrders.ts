import { lineLabel, type Order, type OrderLine } from "./order";

const minutesAgo = (m: number) =>
  new Date(Date.now() - m * 60_000).toISOString();

const line = (quantity: number, name: string): OrderLine => ({
  name,
  quantity,
});

const sample = (order: Omit<Order, "food">): Order => ({
  ...order,
  food: order.items.map(lineLabel).join(", "),
});

/** Sample orders shown while the orders API does not accept this account. */
export const sampleOrders = (): Order[] => [
  sample({
    id: "sample12341",
    items: [
      line(2, "Chicken Biryani"),
      line(1, "Raita"),
      line(1, "Gulab Jamun"),
    ],
    pnr: "2314567890",
    amount: 520,
    state: "New",
    customer: "Neha Sharma",
    placedAt: minutesAgo(6),
  }),
  sample({
    id: "sample12342",
    items: [
      line(1, "Paneer Butter Masala"),
      line(2, "Naan"),
      line(1, "Jeera Rice"),
      line(1, "Masala Papad"),
    ],
    pnr: "2398765432",
    amount: 410,
    state: "New",
    customer: "Rahul Verma",
    placedAt: minutesAgo(2),
  }),
  sample({
    id: "sample12338",
    items: [line(1, "Veg Biryani"), line(1, "Gulab Jamun")],
    pnr: "4521098765",
    amount: 260,
    state: "Preparing",
    customer: "Anita Rao",
    placedAt: minutesAgo(18),
  }),
  sample({
    id: "sample12339",
    items: [line(3, "Dosa"), line(1, "Filter Coffee"), line(1, "Chutney")],
    pnr: "4521098766",
    amount: 280,
    state: "Accepted",
    customer: "Suresh Kumar",
    placedAt: minutesAgo(12),
  }),
  sample({
    id: "sample12335",
    items: [line(1, "Mutton Biryani")],
    pnr: "6709812345",
    amount: 290,
    state: "Ready",
    customer: "Imran Khan",
    placedAt: minutesAgo(35),
  }),
  sample({
    id: "sample12336",
    items: [
      line(2, "Egg Fried Rice"),
      line(1, "Chilli Chicken"),
      line(1, "Soft Drink"),
    ],
    pnr: "6709812346",
    amount: 380,
    state: "Ready",
    customer: "Priya Nair",
    placedAt: minutesAgo(28),
  }),
];
