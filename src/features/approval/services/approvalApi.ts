import { baseApi, flow, type Send } from "@/core/api/baseApi";
import { API_PATHS, endpoint } from "@/core/constants/config";
import type { ApprovalResult, ApprovalStatus } from "../models/approval";
const STATUS: Record<string, ApprovalStatus> = {
  pending: "Under review",
  accepted: "Approved",
  rejected: "Rejected",
};
/** GET /restaurants/registration/{id}/review-status. */
async function getApproval(
  registrationId: string,
  send: Send,
): Promise<ApprovalResult> {
  const data = await send({
    url: `${endpoint(API_PATHS.approval)}/${encodeURIComponent(registrationId)}/review-status`,
  });
  const review = data?.data ?? data;
  return {
    status: STATUS[String(review?.status).toLowerCase()] ?? "Under review",
    restaurantName: review?.restaurant_name,
    reason: Array.isArray(review?.reasons)
      ? review.reasons.join(" ")
      : undefined,
  };
}

export const approvalApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getApproval: build.query<ApprovalResult, string>({
      queryFn: flow(getApproval),
    }),
  }),
});
export const { useLazyGetApprovalQuery } = approvalApi;
