"use client";
import { useEffect, useState } from "react";
import { DEMO_MODE } from "@/core/constants/config";
import { getNotifications } from "../services/notificationService";
import type {
  AlertSource,
  PortalNotification,
} from "../models/notification";
export function useNotificationsViewModel() {
  const [notifications, setNotifications] = useState<PortalNotification[]>([]);
  useEffect(() => {
    if (DEMO_MODE) return;
    let active = true;
    getNotifications()
      .then((data) => {
        if (active) setNotifications(data);
      })
      // Alerts are secondary; the navbar still works without them.
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);
  const unread = notifications.filter((n) => !n.read);
  const markRead = (match: (n: PortalNotification) => boolean) =>
    setNotifications((old) =>
      old.map((n) => (!n.read && match(n) ? { ...n, read: true } : n)),
    );
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
