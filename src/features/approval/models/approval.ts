export type ApprovalStatus = "Under review" | "Approved" | "Rejected";
export interface ApprovalResult {
  status: ApprovalStatus;
  reason?: string;
  restaurantName?: string;
  /** When the registration was sent for review (ISO date-time). */
  submittedAt?: string;
}
