"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useWatch } from "react-hook-form";
import { usePortal } from "@/core/providers/PortalProvider";
import { logout as logoutRequest } from "@/features/auth/services/authService";
import { COUNTRY_CODE } from "@/features/onboarding/models/registration";
import { useNotificationsViewModel } from "@/features/notifications/viewmodels/useNotificationsViewModel";
const FALLBACK_NAME = "Restaurant Partner";
/** Two letters for the avatar: "Ravi Kumar" → "RK", "Ravi" → "RA". */
export function initialsOf(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const letters =
    words.length > 1 ? words[0][0] + words[1][0] : (words[0] ?? "").slice(0, 2);
  return letters.toUpperCase() || "RP";
}
export function usePortalShellViewModel() {
  const portal = usePortal(),
    router = useRouter(),
    notifications = useNotificationsViewModel(),
    [mobileOpen, setMobileOpen] = useState(false);
  const [ownerName, restaurantName, email, mobile, city] = useWatch({
    control: portal.form.control,
    name: ["ownerName", "restaurantName", "email", "mobile", "city"],
  });
  const { authenticated } = portal;
  useEffect(() => {
    if (!authenticated) router.replace("/login");
  }, [authenticated, router]);
  const vendorName = ownerName?.trim() || FALLBACK_NAME;
  const logout = () => {
    // Leave the portal even if the backend call fails.
    void logoutRequest().catch(() => undefined);
    portal.setAuthenticated(false);
    router.replace("/login");
  };
  return {
    authenticated,
    vendorName,
    restaurantName:
      restaurantName?.trim() ||
      portal.approval?.restaurantName ||
      "Your restaurant",
    initials: initialsOf(vendorName),
    /** Shown in the avatar's profile card; empty values mean "not added". */
    profile: {
      email: email?.trim() ?? "",
      mobile: mobile?.trim() ? `${COUNTRY_CODE} ${mobile.trim()}` : "",
      city: city?.trim() ?? "",
    },
    notifications,
    mobileOpen,
    toggleMobile: () => setMobileOpen((open) => !open),
    closeMobile: () => setMobileOpen(false),
    logout,
  };
}
export type PortalShellViewModel = ReturnType<typeof usePortalShellViewModel>;
