import type { Order } from "./order";
const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000).toISOString();
/** Sample orders shown while the orders API does not accept this account. */
export const sampleOrders = (): Order[] => [
  { id: "sample12341", food: "2 × Chicken Biryani, 1 × Raita", pnr: "2314567890", amount: 420, state: "New", customer: "Neha Sharma", placedAt: minutesAgo(6) },
  { id: "sample12342", food: "1 × Paneer Butter Masala, 2 × Naan", pnr: "2398765432", amount: 310, state: "New", customer: "Rahul Verma", placedAt: minutesAgo(2) },
  { id: "sample12338", food: "1 × Veg Biryani, 1 × Gulab Jamun", pnr: "4521098765", amount: 260, state: "Preparing", customer: "Anita Rao", placedAt: minutesAgo(18) },
  { id: "sample12339", food: "3 × Dosa, 1 × Filter Coffee", pnr: "4521098766", amount: 240, state: "Accepted", customer: "Suresh Kumar", placedAt: minutesAgo(12) },
  { id: "sample12335", food: "1 × Mutton Biryani", pnr: "6709812345", amount: 290, state: "Ready", customer: "Imran Khan", placedAt: minutesAgo(35) },
  { id: "sample12336", food: "2 × Egg Fried Rice", pnr: "6709812346", amount: 280, state: "Ready", customer: "Priya Nair", placedAt: minutesAgo(28) },
];
