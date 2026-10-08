import { api } from "@/core/api/axios";
import { API_PATHS, endpoint } from "@/core/constants/config";
import type { PortalNotification } from "../models/notification";
export async function getNotifications(): Promise<PortalNotification[]> {
  const { data } = await api.get<PortalNotification[]>(
    endpoint(API_PATHS.notifications),
  );
  return data;
}
// Adapt to the backend contract for marking alerts as read once confirmed.
