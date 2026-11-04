"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { usePortal } from "@/core/providers/PortalProvider";
import { useLogoutMutation } from "@/features/auth/services/authApi";
import { useNotificationsViewModel } from "@/features/notifications/viewmodels/useNotificationsViewModel";
import { useVendorProfile } from "@/features/profile/viewmodels/useVendorProfile";
import { savedReopenAt } from "../models/offline";
export function usePortalShellViewModel() {
  const [logoutRequest] = useLogoutMutation(),
    portal = usePortal(),
    router = useRouter(),
    vendor = useVendorProfile(),
    notifications = useNotificationsViewModel(),
    [mobileOpen, setMobileOpen] = useState(false),
    [offlineOpen, setOfflineOpen] = useState(false),
    [reopenAt, setReopenAt] = useState<Date | null>(null),
    setOnline = useRef(vendor.setOnline);
  const { authenticated, restoring, orders } = portal;
  useEffect(() => {
    if (!restoring && !authenticated) router.replace("/login");
  }, [restoring, authenticated, router]);
  useEffect(() => {
    setOnline.current = vendor.setOnline;
  });
  // While the portal is open, the restaurant comes back online at the time
  // the vendor chose when stopping orders.
  useEffect(() => {
    const at = vendor.online ? null : savedReopenAt();
    queueMicrotask(() => setReopenAt(at));
    if (!at) return;
    const timer = setTimeout(
      () => setOnline.current(true),
      Math.max(0, at.getTime() - Date.now()),
    );
    return () => clearTimeout(timer);
  }, [vendor.online]);
  const logout = () => {
    // Leave the portal even if the backend call fails.
    void logoutRequest()
      .unwrap()
      .catch(() => undefined);
    portal.setAuthenticated(false);
    portal.setProfile({});
    router.replace("/login");
  };
  return {
    authenticated,
    vendor,
    vendorName: vendor.vendorName,
    restaurantName: vendor.restaurantName || "Restaurant name not added",
    initials: vendor.initials,
    notifications,
    /** Orders still to finish: new, being prepared or ready. */
    ordersInProgress: orders.filter((o) =>
      ["New", "Preparing", "Ready"].includes(o.state),
    ).length,
    /** When the restaurant comes back online, if it is offline until then. */
    reopenAt,
    offlineOpen,
    /** Turning on happens at once; turning off first asks why. */
    toggleOnline: (next: boolean) =>
      next ? vendor.setOnline(true) : setOfflineOpen(true),
    closeOffline: () => setOfflineOpen(false),
    mobileOpen,
    toggleMobile: () => setMobileOpen((open) => !open),
    closeMobile: () => setMobileOpen(false),
    logout,
  };
}
export type PortalShellViewModel = ReturnType<typeof usePortalShellViewModel>;
