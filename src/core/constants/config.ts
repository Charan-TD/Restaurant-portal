/** Demo mode only when asked for; a missing variable means the real API. */
export const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
/**
 * The API server. Set NEXT_PUBLIC_API_BASE_URL to point a deploy at another
 * one; it falls back to the dev server so a build never has no API at all.
 */
export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "https://train-dhaba-backend-dev.up.railway.app"
).replace(/\/+$/, "");
/**
 * The endpoint paths belong to the API, not to a deploy, so they live here and
 * not in environment variables: a stale value in a hosting dashboard can no
 * longer send a request to the wrong route.
 */
export const API_PATHS = {
  register: "/api/v1/restaurants/registration",
  cuisines: "/api/v1/cuisines",
  menuItems: "/api/v1/menu-items",
  addons: "/api/v1/addons",
  qtyTypes: "/api/v1/restaurant-qty-types",
  login: "/api/v1/auth/restaurant/login",
  sendOtp: "/api/v1/auth/restaurant/send-otp",
  verifyOtp: "/api/v1/auth/restaurant/verify-otp",
  logout: "/api/v1/auth/restaurant/logout",
  restaurantMe: "/api/v1/restaurant/profile",
  profileChangeRequests: "/api/v1/restaurant/profile/change-requests",
  changePassword: "/api/v1/auth/restaurant/change-password",
  forgotPassword: "/api/v1/auth/restaurant/forgot-password",
  resetPassword: "/api/v1/auth/restaurant/reset-password",
  approval: "/api/v1/restaurants/registration",
  orders: "/api/v1/restaurant/orders",
  /** A literal {id} segment is replaced with the order number. */
  updateOrder: "/api/v1/restaurant/orders/{id}/status",
  reviews: "/api/v1/restaurant/reviews",
  // No endpoints for these yet.
  dashboardSummary: process.env.NEXT_PUBLIC_DASHBOARD_SUMMARY_PATH,
  notifications: process.env.NEXT_PUBLIC_NOTIFICATIONS_PATH,
} as const;
/**
 * Public URL that menu picture storage paths are appended to, e.g. the
 * Supabase `.../storage/v1/object/public/menu_item_images` bucket URL.
 * Pictures show a placeholder while it is not set.
 */
export const MENU_IMAGE_BASE_URL =
  process.env.NEXT_PUBLIC_MENU_IMAGE_BASE_URL?.replace(/\/+$/, "") || "";
export function endpoint(path: string | undefined): string {
  if (!path) throw new Error("This feature is not connected to an API yet.");
  return path;
}
