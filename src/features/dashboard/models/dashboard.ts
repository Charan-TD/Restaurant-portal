export interface DailyRevenue {
  day: string;
  amount: number;
}
export interface TopItem {
  name: string;
  sold: number;
  revenue: number;
}
export interface DashboardSummary {
  todaySales: number;
  yesterdaySales: number;
  todayOrders: number;
  yesterdayOrders: number;
  avgOrderValue: number;
  yesterdayAvgOrderValue: number;
  pendingOrders: number;
  /** Last 7 days, oldest first; the last entry is today. */
  revenue: DailyRevenue[];
  orderStatus: { delivered: number; inProgress: number; cancelled: number };
  topItems: TopItem[];
}
