"use client";
import { useWatch } from "react-hook-form";
import { usePortal } from "@/core/providers/PortalProvider";
function greeting(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}
export function useDashboardViewModel() {
  const portal = usePortal();
  const ownerName = useWatch({
    control: portal.form.control,
    name: "ownerName",
  });
  const now = new Date();
  return {
    greeting: `${greeting(now.getHours())}${ownerName?.trim() ? `, ${ownerName.trim().split(/\s+/)[0]}` : ""}`,
    today: now.toLocaleDateString("en-IN", {
      weekday: "long",
      day: "numeric",
      month: "long",
    }),
  };
}
