import { api } from "@/core/api/axios";
import { API_PATHS, endpoint } from "@/core/constants/config";
import type { ApprovalResult, ApprovalStatus } from "../models/approval";
const STATUS: Record<string, ApprovalStatus> = {
  pending: "Under review",
  accepted: "Approved",
  rejected: "Rejected",
};
/** GET /restaurants/registration/{id}/review-status. */
export async function getApproval(
  registrationId: string,
): Promise<ApprovalResult> {
  const { data } = await api.get(
    `${endpoint(API_PATHS.approval)}/${encodeURIComponent(registrationId)}/review-status`,
  );
  const review = data?.data ?? data;
  return {
    status: STATUS[String(review?.status).toLowerCase()] ?? "Under review",
    restaurantName: review?.restaurant_name,
    reason: Array.isArray(review?.reasons)
      ? review.reasons.join(" ")
      : undefined,
  };
}
