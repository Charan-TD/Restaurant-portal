export const DEMO_MODE =
  (process.env.NEXT_PUBLIC_DEMO_MODE ?? "true") === "true";
export const API_PATHS = {
  register: process.env.NEXT_PUBLIC_REGISTER_PATH,
  login: process.env.NEXT_PUBLIC_LOGIN_PATH,
  logout: process.env.NEXT_PUBLIC_LOGOUT_PATH,
  approval: process.env.NEXT_PUBLIC_APPROVAL_PATH,
  orders: process.env.NEXT_PUBLIC_ORDERS_PATH,
  updateOrder: process.env.NEXT_PUBLIC_ORDER_UPDATE_PATH,
  dashboardSummary: process.env.NEXT_PUBLIC_DASHBOARD_SUMMARY_PATH,
  notifications: process.env.NEXT_PUBLIC_NOTIFICATIONS_PATH,
} as const;
export function endpoint(path: string | undefined): string {
  if (!process.env.NEXT_PUBLIC_API_BASE_URL || !path)
    throw new Error(
      "API mode is not configured. Supply the confirmed API base URL and endpoint paths in .env.local.",
    );
  return path;
}
