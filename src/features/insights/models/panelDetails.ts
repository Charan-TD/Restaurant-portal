import { DISHES, type DetailRow } from "./orderDetails";

/** DESIGN ONLY: what the order side panel shows, worked out from the sample row. */
const NAMES = ["Rahul S.", "Priya N.", "Amit K.", "Sneha R.", "Vikram P.", "Anita M."];
const STATIONS: Record<string, string> = {
  SBC: "KSR Bengaluru (SBC)",
  YPR: "Yesvantpur Jn (YPR)",
  BNC: "Bangalore Cantt (BNC)",
};
const DISH_TYPE: Record<string, string> = {
  "Chicken Dum Biryani": "Non-veg",
  "Egg Biryani": "Egg",
};
const hash = (text: string) => [...text].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

export interface PanelDetails {
  passenger: string;
  phone: string;
  deliveryStation: string;
  items: { name: string; type: string; quantity: number; price: number }[];
  fee: number;
  earning: number;
  timeline: { label: string; at: number; bold?: boolean; bad?: boolean }[];
}

export function panelDetails(row: DetailRow): PanelDetails {
  const first = row.itemsLabel.replace(/ \+\d+$/, ""),
    names = [first, ...DISHES.filter((d) => d !== first)].slice(0, row.items),
    each = Math.floor(row.amount / names.length),
    delivered = row.status === "DELIVERED",
    minute = 60_000,
    fee = Math.round(row.amount * 0.2);
  return {
    passenger: NAMES[hash(row.id) % NAMES.length],
    phone: "+91 98xxx xx210",
    deliveryStation: STATIONS[row.station] ?? row.station,
    items: names.map((name, i) => ({
      name,
      type: DISH_TYPE[name] ?? "Veg",
      quantity: 1,
      // The last dish takes what is left, so the lines add up to the order.
      price: i === names.length - 1 ? row.amount - each * (names.length - 1) : each,
    })),
    fee: delivered ? fee : 0,
    earning: delivered ? row.amount - fee : 0,
    timeline: [
      { label: "Order placed", at: row.at },
      { label: "Accepted", at: row.at + minute },
      { label: "Food ready", at: row.at + 19 * minute },
      { label: `Picked up by ${row.rider}`, at: row.at + 23 * minute },
      delivered
        ? { label: `Delivered at ${row.coach} · ${row.seat}`, at: row.at + 36 * minute, bold: true }
        : { label: `Not delivered · ${row.reason}`, at: row.at + 36 * minute, bold: true, bad: true },
    ],
  };
}
