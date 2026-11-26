/** A complaint a passenger raised about an order, handled with the restaurant by TrainDhaba. */
export type ComplaintStatus = "PENDING" | "REPLIED" | "RESOLVED";

export interface ComplaintMessage {
  id: string;
  /** Who wrote it: the restaurant, or the customer. */
  from: "RESTAURANT" | "CUSTOMER" | string;
  text: string;
  at: string;
}

export interface Complaint {
  /** The server's UUID. */
  id: string;
  /** "CMP-000001". */
  number: string;
  /** "ORD-R7K2-583921". */
  order: string;
  customer: string;
  category: string;
  /** What the passenger wrote. */
  description: string;
  status: ComplaintStatus;
  createdAt: string;
  resolvedAt?: string;
  /** The conversation, oldest first; only the single-complaint request has it. */
  messages: ComplaintMessage[];
}

export interface ComplaintPage {
  rows: Complaint[];
  page: number;
  pages: number;
  total: number;
}

export interface ComplaintCounts {
  total: number;
  pending: number;
  replied: number;
  resolved: number;
}

export const statusLabel: Record<ComplaintStatus, string> = {
  PENDING: "NEEDS YOUR REPLY",
  REPLIED: "REPLIED",
  RESOLVED: "RESOLVED",
};

export const COMPLAINT_STATUSES: ComplaintStatus[] = ["PENDING", "REPLIED", "RESOLVED"];
