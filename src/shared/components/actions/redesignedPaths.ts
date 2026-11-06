/**
 * Screens built to the TrainDhaba Partner design: they sit on the grey page
 * with their own margins and show no back button. Once every screen is
 * redesigned, delete this list and its uses.
 */
const redesignedPaths = [
  "/insights",
  "/offers",
  "/riders",
  "/profile",
  "/payments",
  "/notifications",
  "/menu/items",
  "/menu/add",
];

export const isRedesignedPath = (pathname: string) =>
  // The orders workspace places its own margins; the old all-orders list does not.
  pathname === "/orders" ||
  pathname === "/dashboard" ||
  redesignedPaths.some((path) => pathname.startsWith(path));
