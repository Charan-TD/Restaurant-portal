"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usePortal } from "@/core/providers/PortalProvider";
import { useLogoutMutation } from "@/features/auth/services/authApi";
import { useNotificationsViewModel } from "@/features/notifications/viewmodels/useNotificationsViewModel";
import { useVendorProfile } from "@/features/profile/viewmodels/useVendorProfile";
export function usePortalShellViewModel() {
  const [logoutRequest] = useLogoutMutation(),
    portal = usePortal(),
    router = useRouter(),
    vendor = useVendorProfile(),
    notifications = useNotificationsViewModel(),
    [mobileOpen, setMobileOpen] = useState(false);
  const { authenticated, restoring } = portal;
  useEffect(() => {
    if (!restoring && !authenticated) router.replace("/login");
  }, [restoring, authenticated, router]);
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
    mobileOpen,
    toggleMobile: () => setMobileOpen((open) => !open),
    closeMobile: () => setMobileOpen(false),
    logout,
  };
}
export type PortalShellViewModel = ReturnType<typeof usePortalShellViewModel>;
