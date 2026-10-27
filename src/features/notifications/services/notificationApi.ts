import { baseApi } from "@/core/api/baseApi";
import { API_PATHS, endpoint } from "@/core/constants/config";
import type { PortalNotification } from "../models/notification";
// Adapt to the backend contract for marking alerts as read once confirmed.
export const notificationApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getNotifications: build.query<PortalNotification[], void>({
      query: () => ({ url: endpoint(API_PATHS.notifications) }),
    }),
  }),
});
export const { useGetNotificationsQuery } = notificationApi;
