"use client";
import { ToastAlert } from "@/core/providers/ToastProvider";
import { ScreenSurface } from "@/shared/components/layout/ScreenSurface";
import { useProfileViewModel } from "../viewmodels/useProfileViewModel";
import { ProfileLayout } from "./ProfileLayout";
export function ProfileView() {
  const vm = useProfileViewModel();
  return (
    <ScreenSurface>
      {vm.saved && (
        <ToastAlert severity="success" onClose={vm.dismissSaved} sx={{ mb: 3 }}>
          Profile updated.
        </ToastAlert>
      )}
      {vm.error && (
        <ToastAlert severity="error" sx={{ mb: 3 }}>
          {vm.error}
        </ToastAlert>
      )}
      <ProfileLayout vm={vm} />
    </ScreenSurface>
  );
}
