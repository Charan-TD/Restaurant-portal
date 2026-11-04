"use client";
import { useState, type ReactNode } from "react";
import { Box, ButtonBase, Typography } from "@mui/material";
import ChevronRight from "@mui/icons-material/ChevronRight";
import ExpandMoreOutlined from "@mui/icons-material/ExpandMoreOutlined";
import { tokens } from "@/core/theme/tokens";
import { ToggleSwitch } from "@/shared/components/form/ToggleSwitch";
import { useAlertPreferences } from "@/features/notifications/viewmodels/useAlertPreferences";
import { useVendorProfile } from "../viewmodels/useVendorProfile";
import { ChangePasswordCard } from "./ChangePasswordCard";
import { PaneHeading } from "./PaneHeading";

const group = {
  border: `1px solid ${tokens.color.border}`,
  borderRadius: tokens.radius.input,
  overflow: "hidden",
} as const;

function GroupTitle({ children }: { children: ReactNode }) {
  return (
    <Typography
      sx={{
        mb: 1,
        fontSize: 12,
        fontWeight: 600,
        letterSpacing: "0.5px",
        textTransform: "uppercase",
        color: tokens.color.textMuted,
      }}
    >
      {children}
    </Typography>
  );
}

function SwitchRow({
  title,
  hint,
  checked,
  onChange,
}: {
  title: string;
  hint: string;
  checked: boolean;
  onChange: (on: boolean) => void;
}) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 2,
        px: 2,
        py: 1.5,
        "& + &": { borderTop: `1px solid ${tokens.color.borderSubtle}` },
      }}
    >
      <Box sx={{ flex: 1 }}>
        <Typography sx={{ fontWeight: 600 }}>{title}</Typography>
        <Typography sx={{ fontSize: 13, color: tokens.color.textMuted }}>
          {hint}
        </Typography>
      </Box>
      <ToggleSwitch
        checked={checked}
        onChange={(_, on) => onChange(on)}
        slotProps={{ input: { "aria-label": title } }}
      />
    </Box>
  );
}

/** Order alerts and account settings; the password form opens in place. */
export function SettingsPane() {
  const [open, setOpen] = useState(false),
    { preferences, set } = useAlertPreferences(),
    { mobile } = useVendorProfile();
  return (
    <>
      <PaneHeading
        title="Settings"
        subtitle="Order alerts and your account"
      />
      <Box sx={{ p: 3, display: "grid", gap: 3 }}>
        <Box>
          <GroupTitle>Order alerts</GroupTitle>
          <Box sx={group}>
            <SwitchRow
              title="Sound for new orders"
              hint="Plays even when this tab is muted"
              checked={preferences.sound}
              onChange={(on) => set("sound", on)}
            />
            <SwitchRow
              title="Keep ringing"
              hint="Until the order is accepted"
              checked={preferences.keepRinging}
              onChange={(on) => set("keepRinging", on)}
            />
          </Box>
        </Box>
        <Box>
          <GroupTitle>Account</GroupTitle>
          <Box sx={group}>
            <ButtonBase
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
              sx={{
                display: "flex",
                width: "100%",
                justifyContent: "flex-start",
                textAlign: "left",
                gap: 1.5,
                px: 2,
                py: 1.5,
              }}
            >
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontWeight: 600 }}>Change password</Typography>
                <Typography sx={{ fontSize: 13, color: tokens.color.textMuted }}>
                  {mobile
                    ? `Login for ${mobile}`
                    : "The password you use to sign in to this portal"}
                </Typography>
              </Box>
              {open ? (
                <ExpandMoreOutlined sx={{ color: tokens.color.textSubtle }} />
              ) : (
                <ChevronRight sx={{ color: tokens.color.textSubtle }} />
              )}
            </ButtonBase>
            {open && (
              <Box
                sx={{ p: 2, borderTop: `1px solid ${tokens.color.borderSubtle}` }}
              >
                <ChangePasswordCard />
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    </>
  );
}
