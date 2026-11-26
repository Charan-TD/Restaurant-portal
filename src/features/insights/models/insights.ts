/** What the Insights API returns, with money turned into numbers. */
export type InsightsPeriod = "today" | "7d" | "30d";
export const INSIGHTS_PERIODS: InsightsPeriod[] = ["today", "7d", "30d"];
export const PERIOD_LABEL: Record<InsightsPeriod, string> = {
  today: "Today",
  "7d": "Last 7 days",
  "30d": "Last 30 days",
};
export const isInsightsPeriod = (value: unknown): value is InsightsPeriod =>
  (INSIGHTS_PERIODS as unknown[]).includes(value);

/**
 * Who delivers decides which Insights a restaurant gets. The server resolves
 * it from the restaurant's own record and shapes every answer to match.
 */
export type InsightsModel = "own" | "traindhaba";

export type Payment = "COD" | "PREPAID";
export type OrderOutcome = "DELIVERED" | "UNDELIVERED";

export interface PaymentMetric {
  amount: number;
  orders: number;
  /** Share of the period's orders, in percent. */
  share: number;
}

export interface InsightsMetrics {
  model: InsightsModel;
  /** Change against the period before, in percent; null when it had none. */
  totalOrders: { value: number; change: number | null };
  totalSale: { amount: number; change: number | null };
  undelivered: { count: number; amount: number; percentage: number };
  /** Own riders only. */
  cod?: PaymentMetric;
  prepaid?: PaymentMetric;
  /** Own riders: earnings. TrainDhaba riders: final settled. */
  payout: number;
}

export interface EarningsItem {
  id: string;
  name: string;
  /** Veg, Non-veg or Egg (FoodTypeMark). */
  type: string;
  /** Quantity sold. */
  orders: number;
  unitPrice: number;
  /** Quantity on undelivered orders. */
  undelivered: number;
  /** Own riders only. */
  cod: number;
  prepaid: number;
  deliveredValue: number;
  /** Own riders: final earnings. TrainDhaba riders: final settled. */
  final: number;
}

export interface EarningsDetails {
  model: InsightsModel;
  items: EarningsItem[];
  total: {
    orders: number;
    undelivered: number;
    cod: number;
    prepaid: number;
    deliveredValue: number;
    final: number;
  };
}

export interface SettlementBreakdown {
  model: InsightsModel;
  totalOrders: number;
  totalSale: number;
  /** Own riders only. */
  cod?: { orders: number; amount: number };
  prepaid?: { orders: number; amount: number };
  undelivered: { orders: number; amount: number };
  deliveredValue: number;
  fee: number;
  earnings: number;
}

export interface PaymentSplit {
  orders: number;
  saleValue: number;
  orderShare: number;
  salesShare: number;
  avgPerOrder: number;
}
export interface PaymentDistribution {
  totalOrders: number;
  totalSale: number;
  cod: PaymentSplit;
  prepaid: PaymentSplit;
}

/** One line of a list; the fields a list does not carry stay empty. */
export interface InsightRow {
  id: string;
  /** ISO time. */
  at: string;
  train: string | null;
  station: string | null;
  coach: string | null;
  seat: string | null;
  /** Number of items (orders list). */
  itemCount: number;
  /** Item names with quantities (sale value list). */
  itemList: { name: string; quantity: number }[];
  amount: number;
  payment: Payment | null;
  status: OrderOutcome | null;
  reason: string | null;
  settlement: string | null;
  collectedBy: string | null;
  cashStatus: string | null;
  method: string | null;
  transactionId: string | null;
}

export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  pages: number;
}

export interface InsightList {
  rows: InsightRow[];
  pagination: Pagination;
  /** The whole filtered list, not just this page. */
  summary: { orders: number; amount: number | null; percentOfAll: number | null };
}

export interface InsightListQuery {
  page: number;
  search?: string;
  payment?: Payment;
  status?: OrderOutcome;
  /** YYYY-MM-DD, Indian time. */
  dateFrom?: string;
  dateTo?: string;
}

export interface InsightOrderDetail {
  id: string;
  status: OrderOutcome;
  at: string;
  passenger: { name: string | null; phone: string | null };
  train: string | null;
  coach: string | null;
  seat: string | null;
  deliveryStation: string | null;
  items: {
    name: string;
    quantity: number;
    price: number;
    fee: number;
    earning: number;
  }[];
  orderValue: number;
  payment: Payment | null;
  rider: string | null;
  fee: number;
  earning: number;
  timeline: { event: string; label: string; at: string }[];
}
