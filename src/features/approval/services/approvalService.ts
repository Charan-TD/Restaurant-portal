import { api } from "@/core/api/axios";
import { API_PATHS, endpoint } from "@/core/constants/config";
import type { ApprovalResult } from "../models/approval";
export async function getApproval(): Promise<ApprovalResult> {
  const { data } = await api.get<ApprovalResult>(endpoint(API_PATHS.approval));
  return data;
}
