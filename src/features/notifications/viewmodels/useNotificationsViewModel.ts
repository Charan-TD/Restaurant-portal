"use client";
import { useMemo, useState } from "react";
import { API_PATHS, DEMO_MODE } from "@/core/constants/config";
import { useGetNotificationsQuery } from "../services/notificationApi";
import type { AlertSource, PortalNotification } from "../models/notification";
const NONE: PortalNotification[] = [];
export function useNotificationsViewModel() {
  // Alerts are secondary; the navbar still works if they fail to load.
  const { data = NONE } = useGetNotificationsQuery(undefined, {
      skip: DEMO_MODE || !API_PATHS.notifications,
    }),
    [readIds, setReadIds] = useState<string[]>([]);
  const notifications = useMemo(
    () => data.map((n) => (readIds.includes(n.id) ? { ...n, read: true } : n)),
    [data, readIds],
  );
  const unread = notifications.filter((n) => !n.read);
  const markRead = (match: (n: PortalNotification) => boolean) =>
    setReadIds((old) => [
      ...old,
      ...notifications.filter((n) => !n.read && match(n)).map((n) => n.id),
    ]);
  return {
    notifications,
    unreadCount: unread.length,
    hasAlert: (source: AlertSource) => unread.some((n) => n.source === source),
    hasPageAlert: (href: string) => unread.some((n) => n.href === href),
    markSourceRead: (source: AlertSource) =>
      markRead((n) => n.source === source),
    markRead: (id: string) => markRead((n) => n.id === id),
    markAllRead: () => markRead(() => true),
  };
}
export type NotificationsViewModel = ReturnType<
  typeof useNotificationsViewModel
>;
