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
    id: "menu",
    label: "Menu",
    pages: [
      {
        label: "Items",
        href: "/menu/items",
        description: "Your dishes, add-ons and categories, with prices and stock.",
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
        description: "People who have ordered from you, and how much they have spent.",
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
