export type NavSectionId =
  | "dashboard"
  | "orders"
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
    pages: [
      {
        label: "Live orders",
        href: "/orders/live",
        description: "Accept, prepare and hand over orders as they come in.",
      },
      {
        label: "All orders",
        href: "/orders/all",
        description: "Every order placed with your restaurant.",
      },
      {
        label: "Order history",
        href: "/orders/history",
        description: "Completed and cancelled orders from previous days.",
      },
    ],
  },
  {
    id: "menu",
    label: "Menu",
    pages: [
      {
        label: "Items",
        href: "/menu/items",
        description: "Browse and edit the dishes on your menu.",
      },
      {
        label: "Add items",
        href: "/menu/add",
        description: "Add new dishes with price, picture and food type.",
      },
      {
        label: "Item availability",
        href: "/menu/availability",
        description: "Switch items in or out of stock for the day.",
      },
    ],
  },
  {
    id: "customers",
    label: "Customers",
    pages: [
      {
        label: "Customers list",
        href: "/customers/list",
        description: "Customers who have ordered from your restaurant.",
      },
      {
        label: "Feedback & ratings",
        href: "/customers/feedback",
        description: "Reviews and ratings left by your customers.",
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
  {
    id: "payments",
    label: "Payments",
    pages: [
      {
        label: "Earnings",
        href: "/payments/earnings",
        description: "What you have earned after commission and taxes.",
      },
      {
        label: "Settlements",
        href: "/payments/settlements",
        description: "Payouts sent to your bank account.",
      },
      {
        label: "Transactions",
        href: "/payments/transactions",
        description: "Every payment, refund and adjustment.",
      },
    ],
  },
  {
    id: "offers",
    label: "Offers",
    pages: [
      {
        label: "Coupons",
        href: "/offers/coupons",
        description: "Coupon codes customers can apply at checkout.",
      },
      {
        label: "Discounts",
        href: "/offers/discounts",
        description: "Automatic discounts on items or order value.",
      },
    ],
  },
  {
    id: "settings",
    label: "Settings",
    pages: [
      {
        label: "Profile settings",
        href: "/settings/profile",
        description: "Your name, contact details and login.",
      },
      {
        label: "Restaurant settings",
        href: "/settings/restaurant",
        description: "Restaurant details, hours, documents and bank account.",
      },
    ],
  },
];
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
