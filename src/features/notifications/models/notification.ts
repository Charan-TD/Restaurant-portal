/** Where an alert belongs; its navbar item blinks until it is checked. */
export type AlertSource =
  "payments" | "offers" | "settings" | "profile" | "orders";
export interface PortalNotification {
  id: string;
  source: AlertSource;
  title: string;
  message: string;
  /** Page the alert opens, e.g. /payments/settlements. */
  href: string;
  time: string;
  read: boolean;
}
