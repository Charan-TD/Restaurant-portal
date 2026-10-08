export type ApprovalStatus = "Under review" | "Approved" | "Rejected";
export interface ApprovalResult {
  status: ApprovalStatus;
  reason?: string;
  restaurantName?: string;
}
