"use client";
import { ToastAlert } from "@/core/providers/ToastProvider";
import type { ReactNode } from "react";
import { Box, Typography } from "@mui/material";
import LockOutlined from "@mui/icons-material/LockOutlined";
import ShieldOutlined from "@mui/icons-material/ShieldOutlined";
import VpnKeyOutlined from "@mui/icons-material/VpnKeyOutlined";
import GroupsOutlined from "@mui/icons-material/GroupsOutlined";
import VisibilityOffOutlined from "@mui/icons-material/VisibilityOffOutlined";
import AutorenewOutlined from "@mui/icons-material/AutorenewOutlined";
import { CommonCard } from "@/shared/components/layout/CommonCard";
import { CommonButton } from "@/shared/components/actions/CommonButton";
import { PasswordField } from "@/shared/components/form/PasswordField";
import { PasswordChecklist } from "@/features/onboarding/components/PasswordChecklist";
import { passwordRules } from "@/features/onboarding/models/validation";
import { DEMO_MODE } from "@/core/constants/config";
import { useChangePasswordViewModel } from "../viewmodels/useChangePasswordViewModel";
const STRENGTH = [
  { label: "Weak password", color: "error.main" },
  { label: "Fair password", color: "warning.main" },
  { label: "Good password", color: "success.light" },
  { label: "Strong password", color: "success.main" },
] as const;
const TIPS = [
  {
    icon: <VpnKeyOutlined />,
    text: "Use a unique password and avoid reusing old passwords.",
  },
  {
    icon: <GroupsOutlined />,
    text: "Include a mix of letters and special characters.",
  },
  {
    icon: <VisibilityOffOutlined />,
    text: "Don't share your password with anyone.",
  },
  {
    icon: <AutorenewOutlined />,
    text: "Update your password regularly for better security.",
  },
];
/** Four bars that fill as more of the password rules are met. */
function StrengthMeter({ password }: { password: string }) {
  const met = passwordRules.filter((rule) => rule.test(password)).length,
    level = password ? Math.min(met, passwordRules.length) : 0,
    shown = level ? STRENGTH[level - 1] : null;
  return (
    <Box sx={{ mt: 1.25 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Box sx={{ flex: 1, display: "flex", gap: 0.75 }}>
          {STRENGTH.map((_, i) => (
            <Box
              key={i}
              sx={{
                flex: 1,
                height: 5,
                borderRadius: 3,
                bgcolor: shown && i < level ? shown.color : "#e6eae6",
                transition: "background-color .2s",
              }}
            />
          ))}
        </Box>
        <Typography
          variant="caption"
          sx={{
            minWidth: 100,
            fontWeight: 600,
            color: shown?.color ?? "text.secondary",
          }}
        >
          {shown?.label ?? "Enter a password"}
        </Typography>
      </Box>
      <PasswordChecklist value={password} rules={passwordRules} />
    </Box>
  );
}
function Labeled({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Box>
      <Typography sx={{ fontWeight: 600, mb: 0.75 }}>{label}</Typography>
      {children}
    </Box>
  );
}
export function ChangePasswordCard() {
  const vm = useChangePasswordViewModel();
  if (DEMO_MODE) return null;
  return (
    <Box
      sx={{
        display: "grid",
        gap: 3,
        alignItems: "start",
        gridTemplateColumns: {
          xs: "1fr",
          lg: "minmax(0, 1.9fr) minmax(0, 1fr)",
        },
      }}
    >
      <CommonCard className="profile-card">
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              display: "grid",
              placeItems: "center",
              bgcolor: "rgba(242,106,46,.12)",
              color: "primary.main",
              flexShrink: 0,
            }}
          >
            <LockOutlined />
          </Box>
          <div>
            <Typography variant="h6" component="h2">
              New password
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Enter your current password, then choose a new one.
            </Typography>
          </div>
        </Box>
        {vm.done && (
          <ToastAlert severity="success" sx={{ mb: 2 }}>
            Password changed.
          </ToastAlert>
        )}
        {vm.error && (
          <ToastAlert severity="error" sx={{ mb: 2 }}>
            {vm.error}
          </ToastAlert>
        )}
        <form noValidate onSubmit={vm.submit}>
          <Box sx={{ display: "grid", gap: 2.5 }}>
            <Labeled label="Current password">
              <PasswordField
                placeholder="Enter your current password"
                autoComplete="current-password"
                value={vm.current}
                onChange={(e) => vm.setCurrent(e.target.value)}
              />
            </Labeled>
            <Labeled label="New password">
              <PasswordField
                placeholder="Create a new password"
                autoComplete="new-password"
                value={vm.next}
                onChange={(e) => vm.setNext(e.target.value)}
              />
              <StrengthMeter password={vm.next} />
            </Labeled>
            <Labeled label="Confirm new password">
              <PasswordField
                placeholder="Re-enter your new password"
                autoComplete="new-password"
                value={vm.confirm}
                error={!!vm.confirm && vm.confirm !== vm.next}
                helperText={
                  vm.confirm && vm.confirm !== vm.next
                    ? "Passwords do not match."
                    : ""
                }
                onChange={(e) => vm.setConfirm(e.target.value)}
              />
            </Labeled>
          </Box>
          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 1.5,
              mt: 3,
              pt: 3,
              borderTop: 1,
              borderColor: "divider",
            }}
          >
            <CommonButton
              type="button"
              variant="outlined"
              color="inherit"
              disabled={vm.busy}
              onClick={vm.cancel}
            >
              Cancel
            </CommonButton>
            <CommonButton
              type="submit"
              variant="contained"
              disabled={vm.busy || !vm.current || !vm.next || !vm.confirm}
            >
              {vm.busy ? "Updating…" : "Update password"}
            </CommonButton>
          </Box>
        </form>
      </CommonCard>
      <CommonCard className="profile-card" style={{ background: "#fff6f1" }}>
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            display: "grid",
            placeItems: "center",
            bgcolor: "rgba(242,106,46,.14)",
            color: "primary.main",
            mb: 2,
          }}
        >
          <ShieldOutlined />
        </Box>
        <Typography variant="h6" component="h2">
          Security tips
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
          Habits that keep your restaurant and customer data safe.
        </Typography>
        <Box sx={{ display: "grid", gap: 2.25 }}>
          {TIPS.map((tip) => (
            <Box
              key={tip.text}
              sx={{ display: "flex", gap: 1.5, color: "text.secondary" }}
            >
              <Box
                sx={{ flexShrink: 0, display: "grid", placeItems: "center" }}
              >
                {tip.icon}
              </Box>
              <Typography variant="body2">{tip.text}</Typography>
            </Box>
          ))}
        </Box>
      </CommonCard>
    </Box>
  );
}
