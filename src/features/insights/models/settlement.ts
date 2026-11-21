/**
 * DESIGN ONLY: sample figures for the two Insights screens until the backend
 * has the settlement API. Replace `settlementSample` with the API response
 * (same shape) when it exists; the screens only read these fields.
 */
export const TRAINDHABA_FEE = 0.2;

export interface SettlementItem {
  name: string;
  /** Veg, Non-veg or Egg (FoodTypeMark). */
  type: string;
  orders: number;
  unitPrice: number;
  /** Own riders: sale value collected as cash by the rider / paid online. */
  cod: number;
  prepaid: number;
  /** TrainDhaba riders: orders that were not delivered (not paid). */
  undelivered: number;
}

export const settlementSample: {
  items: SettlementItem[];
  /** Orders and sales compared with the period before, in percent. */
  ordersChange: number;
  salesChange: number;
  codOrders: number;
  prepaidOrders: number;
  payout: string;
} = {
  ordersChange: 6.6,
  salesChange: 8.4,
  codOrders: 124,
  prepaidOrders: 181,
  payout: "Paid to HDFC ••7821 on Fri, 14 Nov",
  items: [
    { name: "Chicken Dum Biryani", type: "Non-veg", orders: 92, unitPrice: 320, cod: 12360, prepaid: 17080, undelivered: 2 },
    { name: "Veg Thali", type: "Veg", orders: 74, unitPrice: 180, cod: 4660, prepaid: 8660, undelivered: 2 },
    { name: "Paneer Butter Masala", type: "Veg", orders: 48, unitPrice: 240, cod: 4610, prepaid: 6910, undelivered: 1 },
    { name: "Egg Biryani", type: "Egg", orders: 41, unitPrice: 220, cod: 4060, prepaid: 4960, undelivered: 1 },
    { name: "Dal Makhani", type: "Veg", orders: 32, unitPrice: 200, cod: 2430, prepaid: 3970, undelivered: 1 },
    { name: "Curd Rice", type: "Veg", orders: 18, unitPrice: 120, cod: 1080, prepaid: 1080, undelivered: 0 },
  ],
};

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

/** Every figure the two screens show, worked out from the items. */
export function settlementTotals(items: SettlementItem[]) {
  const orders = sum(items.map((i) => i.orders)),
    cod = sum(items.map((i) => i.cod)),
    prepaid = sum(items.map((i) => i.prepaid)),
    sale = cod + prepaid,
    undelivered = sum(items.map((i) => i.undelivered)),
    undeliveredValue = sum(items.map((i) => i.undelivered * i.unitPrice)),
    deliveredValue = sale - undeliveredValue;
  return {
    orders,
    cod,
    prepaid,
    sale,
    undelivered,
    undeliveredPercent: orders ? Math.round((undelivered / orders) * 1000) / 10 : 0,
    undeliveredValue,
    deliveredValue,
    avgUnitPrice: orders ? Math.round(sale / orders) : 0,
    /** Own riders: the fee comes off the whole sale value. */
    fee: Math.round(sale * TRAINDHABA_FEE),
    earnings: Math.round(sale * (1 - TRAINDHABA_FEE)),
    /** TrainDhaba riders: undelivered orders are not paid, the fee comes off the rest. */
    settledFee: Math.round(deliveredValue * TRAINDHABA_FEE),
    settled: Math.round(deliveredValue * (1 - TRAINDHABA_FEE)),
  };
}
