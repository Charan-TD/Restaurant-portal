/**
 * The server moves a group order strictly forward: ASSIGNED → PREPARING →
 * READY → OUT_FOR_DELIVERY → DELIVERED. The restaurant may also reject an
 * ASSIGNED order, and FAILED is allowed from any step.
 */
export type GroupOrderStatus =
  | "ASSIGNED"
  | "PREPARING"
  | "READY"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "REJECTED"
  | "FAILED";
export interface GroupOrder {
  /** The public grp_ord_id the status endpoints take. */
  id?: string;
  /** Unique within the list: the id, or built from the order's details. */
  key: string;
  contactName: string;
  mobile: string;
  email?: string;
  groupSize: number;
  /** What the customer asked for, in their own words. */
  details: string;
  status: GroupOrderStatus | string;
  /** When the order last changed, if the server says: orders the list by recency. */
  updatedAt?: string;
  /** When the order was placed. */
  placedAt?: string;
  /** The items ordered; empty when none are listed. */
  items: GroupOrderItem[];
  /**
   * Who takes the order to the customer: the restaurant's own rider, chosen
   * while preparing, or the TrainDhaba rider the server reports.
   */
  rider?: { id: string; name: string; phone?: string };
}
/** One line of a group order's items. */
export interface GroupOrderItem {
  name: string;
  quantity: number;
  /** Price of the whole line (unit price × quantity), if the server sends one. */
  amount?: number;
}
export const statusLabel: Record<string, string> = {
  ASSIGNED: "New",
  PREPARING: "Preparing",
  READY: "Ready",
  OUT_FOR_DELIVERY: "Out for delivery",
  DELIVERED: "Delivered",
  REJECTED: "Rejected",
  FAILED: "Failed",
};
