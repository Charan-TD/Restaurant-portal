export const DEMO_MODE =
  (process.env.NEXT_PUBLIC_DEMO_MODE ?? "true") === "true";
export const API_PATHS = {
  register: process.env.NEXT_PUBLIC_REGISTER_PATH,
  cuisines: process.env.NEXT_PUBLIC_CUISINES_PATH,
  menuItems: process.env.NEXT_PUBLIC_MENU_ITEMS_PATH,
  addons: process.env.NEXT_PUBLIC_ADDONS_PATH,
  qtyTypes: process.env.NEXT_PUBLIC_QTY_TYPES_PATH,
  login: process.env.NEXT_PUBLIC_LOGIN_PATH,
  sendOtp: process.env.NEXT_PUBLIC_SEND_OTP_PATH,
  verifyOtp: process.env.NEXT_PUBLIC_VERIFY_OTP_PATH,
  logout: process.env.NEXT_PUBLIC_LOGOUT_PATH,
  restaurantMe: process.env.NEXT_PUBLIC_RESTAURANT_ME_PATH,
  profileChangeRequests: process.env.NEXT_PUBLIC_PROFILE_CHANGE_REQUESTS_PATH,
  changePassword: process.env.NEXT_PUBLIC_CHANGE_PASSWORD_PATH,
  forgotPassword: process.env.NEXT_PUBLIC_FORGOT_PASSWORD_PATH,
  resetPassword: process.env.NEXT_PUBLIC_RESET_PASSWORD_PATH,
  approval: process.env.NEXT_PUBLIC_APPROVAL_PATH,
  orders: process.env.NEXT_PUBLIC_ORDERS_PATH,
  reviews: process.env.NEXT_PUBLIC_REVIEWS_PATH,
  updateOrder: process.env.NEXT_PUBLIC_ORDER_UPDATE_PATH,
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
  if (!process.env.NEXT_PUBLIC_API_BASE_URL || !path)
    throw new Error(
      "API mode is not configured. Supply the confirmed API base URL and endpoint paths in .env.local.",
    );
  return path;
}
