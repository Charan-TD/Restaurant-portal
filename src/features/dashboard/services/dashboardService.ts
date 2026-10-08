import { api } from "@/core/api/axios";
import { API_PATHS, endpoint } from "@/core/constants/config";
import type { DashboardSummary } from "../models/dashboard";
export async function getDashboardSummary(): Promise<DashboardSummary> {
  const { data } = await api.get<DashboardSummary>(
    endpoint(API_PATHS.dashboardSummary),
  );
  return data;
}
