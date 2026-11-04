export type NavSectionId =
  | "dashboard"
  | "orders"
  | "groupOrders"
  | "riders"
  | "menu"
  | "customers"
  | "reports"
  | "payments"
  | "offers"
  | "settings";
export interface NavPage {
  label: string;
  href: string;
  description: string;
}
export interface NavSection {
  id: NavSectionId;
  label: string;
  /** Set for sections without sub pages, e.g. the dashboard. */
  href?: string;
  pages: NavPage[];
}
export const sidebarSections: NavSection[] = [
  { id: "dashboard", label: "Dashboard", href: "/dashboard", pages: [] },
  {
    id: "orders",
    label: "Orders",
    href: "/orders/all",
    pages: [
      {
        label: "All orders",
        href: "/orders/all",
        description:
          "Every order you have received, including completed and cancelled ones.",
      },
    ],
  },
  {
    id: "groupOrders",
    label: "Group orders",
    href: "/group-orders",
    pages: [],
  },
  // Hidden for restaurants whose orders TrainDhaba's riders deliver (AppShell).
  { id: "riders", label: "Riders", href: "/riders", pages: [] },
  {
    id: "menu",
    label: "Menu",
    pages: [
      {
        label: "Items",
        href: "/menu/items",
        description:
          "Your dishes, add-ons and categories, with prices and stock.",
      },
      {
        label: "Add items",
        href: "/menu/add",
        description: "Create a new dish customers can order.",
      },
    ],
  },
  {
    id: "customers",
    label: "Customers",
    pages: [
      {
        label: "All customers",
        href: "/customers/list",
        description:
          "People who have ordered from you, and how much they have spent.",
      },
      {
        label: "Customer feedback",
        href: "/customers/feedback",
        description: "What customers said about their orders.",
      },
    ],
  },
  {
    id: "reports",
    label: "Reports",
    pages: [
      {
        label: "Sales report",
        href: "/reports/sales",
        description: "Sales by day, week and month.",
      },
      {
        label: "Orders report",
        href: "/reports/orders",
        description: "Order volume, cancellations and prep times.",
      },
      {
        label: "Item performance",
        href: "/reports/items",
        description: "Which dishes sell best and which need attention.",
      },
    ],
  },
];
export const navbarMenus: NavSection[] = [
  { id: "payments", label: "Payments", href: "/payments", pages: [] },
  { id: "offers", label: "Offers", href: "/offers", pages: [] },
  {
    id: "settings",
    label: "Settings",
    pages: [
      {
        label: "Working hours",
        href: "/settings/working-hours",
        description: "Set the days and times you accept orders.",
      },
      {
        label: "Change password",
        href: "/settings/password",
        description: "Update the password you use to sign in to this portal.",
      },
    ],
  },
];
export type RailItemId =
  | "orders"
  | "groupOrders"
  | "menu"
  | "insights"
  | "payments"
  | "offers"
  | "riders"
  | "profile";
export interface RailItem {
  id: RailItemId;
  label: string;
  href: string;
  /** The item is active on any path that starts with one of these. */
  paths: string[];
  /** The page title shown in the top bar on those paths. */
  title: string;
}
/** The icon rail down the left of the portal, top to bottom. */
export const railItems: RailItem[] = [
  {
    id: "orders",
    label: "Orders",
    href: "/dashboard",
    paths: ["/dashboard", "/orders"],
    title: "Orders",
  },
  {
    id: "groupOrders",
    label: "Group",
    href: "/group-orders",
    paths: ["/group-orders"],
    title: "Group orders",
  },
  {
    id: "menu",
    label: "Menu",
    href: "/menu/items",
    paths: ["/menu"],
    title: "Menu",
  },
  {
    id: "insights",
    label: "Insights",
    href: "/insights",
    paths: ["/insights", "/reports", "/customers"],
    title: "Insights",
  },
  {
    id: "payments",
    label: "Payments",
    href: "/payments",
    paths: ["/payments"],
    title: "Payments",
  },
  {
    id: "offers",
    label: "Offers",
    href: "/offers",
    paths: ["/offers"],
    title: "Offers",
  },
  // Hidden for restaurants whose orders TrainDhaba's riders deliver (AppShell).
  {
    id: "riders",
    label: "Riders",
    href: "/riders",
    paths: ["/riders"],
    title: "Riders",
  },
  {
    id: "profile",
    label: "Profile",
    href: "/profile",
    paths: ["/profile", "/settings"],
    title: "Profile",
  },
];
const startsWith = (pathname: string, path: string) =>
  pathname === path || pathname.startsWith(`${path}/`);
export function railItemFor(pathname: string) {
  return railItems.find((item) =>
    item.paths.some((path) => startsWith(pathname, path)),
  );
}
/** The title for the top bar; pages that are not on the rail name themselves. */
export function pageTitleFor(pathname: string) {
  if (startsWith(pathname, "/notifications")) return "Notifications";
  return railItemFor(pathname)?.title ?? "";
}
const allSections = [...sidebarSections, ...navbarMenus];
export function findNavPage(href: string) {
  for (const section of allSections) {
    const page = section.pages.find((p) => p.href === href);
    if (page) return { section, page };
  }
  return null;
}
/** Every page the universal search can jump to. */
export const searchablePages = allSections.flatMap((section) =>
  section.href
    ? [{ label: section.label, href: section.href, group: "Pages" }]
    : section.pages.map((p) => ({
        label: p.label,
        href: p.href,
        group: section.label,
      })),
);
