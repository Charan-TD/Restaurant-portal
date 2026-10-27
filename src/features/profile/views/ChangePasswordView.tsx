"use client";
import { Alert } from "@mui/material";
import { DEMO_MODE } from "@/core/constants/config";
import { PageHeader } from "@/shared/components/layout/PageHeader";
import { ChangePasswordCard } from "./ChangePasswordCard";
import { SettingsTabs } from "./SettingsTabs";
export function ChangePasswordView() {
  return (
    <>
      <PageHeader
        eyebrow="Settings"
        title="Change password"
        subtitle="Update the password you use to sign in to this portal."
      />
      <SettingsTabs />
      {DEMO_MODE && (
        <Alert severity="info">
          Password changes are available once the portal is connected to the
          live API.
        </Alert>
      )}
      <ChangePasswordCard />
    </>
  );
}
