"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Box, Typography } from "@mui/material";
import AccountBalanceWalletOutlined from "@mui/icons-material/AccountBalanceWalletOutlined";
import LocalOfferOutlined from "@mui/icons-material/LocalOfferOutlined";
import NotificationsNoneOutlined from "@mui/icons-material/NotificationsNoneOutlined";
import PersonOutlineOutlined from "@mui/icons-material/PersonOutlineOutlined";
import ShoppingBagOutlined from "@mui/icons-material/ShoppingBagOutlined";
import { cardSx, tokens } from "@/core/theme/tokens";
import { CommonButton } from "@/shared/components/actions/CommonButton";
import { ScreenSurface } from "@/shared/components/layout/ScreenSurface";
import { CountTabs } from "@/shared/components/navigation/CountTabs";
import InfoOutlined from "@mui/icons-material/InfoOutlined";
import { ToggleSwitch } from "@/shared/components/form/ToggleSwitch";
import type { AlertSource } from "../models/notification";
import {
  ALERT_PREFERENCES,
  useAlertPreferences,
} from "../viewmodels/useAlertPreferences";
import { useNotificationsViewModel } from "../viewmodels/useNotificationsViewModel";

type TabId = "all" | "orders" | "payments" | "offers" | "account";

const TABS: { id: TabId; label: string }[] = [
  { id: "all", label: "All" },
  { id: "orders", label: "Orders" },
  { id: "payments", label: "Payments" },
  { id: "offers", label: "Offers" },
  { id: "account", label: "Account" },
];

const tabOf = (source: AlertSource): TabId =>
  source === "settings" || source === "profile" ? "account" : source;

const ICONS: Record<TabId, { icon: typeof ShoppingBagOutlined; color: string; bg: string }> = {
  all: { icon: NotificationsNoneOutlined, color: tokens.color.info, bg: tokens.color.infoBg },
  orders: { icon: ShoppingBagOutlined, color: tokens.color.info, bg: tokens.color.infoBg },
  payments: { icon: AccountBalanceWalletOutlined, color: tokens.color.success, bg: tokens.color.successBg },
  offers: { icon: LocalOfferOutlined, color: tokens.color.info, bg: tokens.color.infoBg },
  account: { icon: PersonOutlineOutlined, color: tokens.color.primary, bg: tokens.color.primarySubtle },
};

/** Which alerts this browser gives, as switches. */
function AlertSettings() {
  const { preferences, set } = useAlertPreferences();
  return (
    <Box sx={{ ...cardSx, p: 3 }}>
      <Typography sx={{ fontSize: 16, fontWeight: 700 }}>Alert settings</Typography>
      <Typography sx={{ fontSize: 13, color: tokens.color.textMuted, mb: 1 }}>
        Choose how this browser alerts you
      </Typography>
      {ALERT_PREFERENCES.map((p) => (
        <Box
          key={p.id}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            py: 1.5,
            borderTop: `1px solid ${tokens.color.borderSubtle}`,
          }}
        >
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontSize: 14, fontWeight: 600 }}>{p.label}</Typography>
            <Typography sx={{ fontSize: 12, color: tokens.color.textMuted }}>
              {p.hint}
            </Typography>
          </Box>
          <ToggleSwitch
            checked={preferences[p.id]}
            onChange={(_, on) => set(p.id, on)}
            slotProps={{ input: { "aria-label": p.label } }}
          />
        </Box>
      ))}
      <Box
        sx={{
          mt: 1,
          p: 1.5,
          display: "flex",
          gap: 1.25,
          fontSize: 13,
          borderRadius: tokens.radius.input,
          color: tokens.color.text,
          bgcolor: tokens.color.infoBg,
          border: `1px solid ${tokens.color.info}33`,
        }}
      >
        <InfoOutlined sx={{ fontSize: 18, color: tokens.color.info, mt: "1px" }} />
        Keep this tab open while you are online so you never miss a new order.
      </Box>
    </Box>
  );
}

/** Every alert in one list, split by what it is about. */
export function NotificationsView() {
  const vm = useNotificationsViewModel(),
    router = useRouter(),
    [tab, setTab] = useState<TabId>("all"),
    all = vm.notifications,
    shown = tab === "all" ? all : all.filter((n) => tabOf(n.source) === tab);
  return (
    <ScreenSurface>
      <CountTabs
        label="Notification types"
        value={tab}
        onChange={setTab}
        tabs={TABS.map((t) => ({
          ...t,
          count:
            t.id === "all"
              ? all.length
              : all.filter((n) => tabOf(n.source) === t.id).length,
        }))}
      />
      <Box
        sx={{
          display: "grid",
          gap: 3,
          alignItems: "start",
          gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 1fr) 340px" },
        }}
      >
      <Box sx={{ ...cardSx, overflow: "hidden" }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            px: 3,
            py: 2.25,
            borderBottom: `1px solid ${tokens.color.borderSubtle}`,
          }}
        >
          <Typography sx={{ fontSize: 18, fontWeight: 700 }}>
            All notifications
          </Typography>
          <Typography sx={{ flex: 1, fontSize: 13, color: tokens.color.textMuted }}>
            {vm.unreadCount} unread
          </Typography>
          <CommonButton
            variant="text"
            disabled={!vm.unreadCount}
            onClick={vm.markAllRead}
            sx={{ minHeight: "36px !important", bgcolor: "transparent !important", color: `${tokens.color.link} !important` }}
          >
            Mark all as read
          </CommonButton>
        </Box>
        {shown.length === 0 ? (
          <Typography sx={{ px: 3, py: 5, color: tokens.color.textMuted }}>
            {all.length === 0
              ? "You have no notifications yet."
              : "Nothing in this group."}
          </Typography>
        ) : (
          shown.map((n) => {
            const { icon: Icon, color, bg } = ICONS[tabOf(n.source)];
            return (
              <Box
                key={n.id}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  px: 3,
                  py: 1.75,
                  bgcolor: n.read ? tokens.color.card : tokens.color.sunken,
                  borderBottom: `1px solid ${tokens.color.borderSubtle}`,
                }}
              >
                <Box
                  aria-hidden
                  sx={{
                    width: 8,
                    height: 8,
                    flexShrink: 0,
                    borderRadius: "50%",
                    bgcolor: n.read ? "transparent" : tokens.color.link,
                  }}
                />
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    flexShrink: 0,
                    display: "grid",
                    placeItems: "center",
                    borderRadius: "50%",
                    color,
                    bgcolor: bg,
                  }}
                >
                  <Icon fontSize="small" />
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 600, fontSize: 15 }}>
                    {n.title}{" "}
                    <Box
                      component="span"
                      sx={{ fontWeight: 400, fontSize: 12, color: tokens.color.textMuted }}
                    >
                      {tabOf(n.source)[0].toUpperCase() + tabOf(n.source).slice(1)} · {n.time}
                    </Box>
                  </Typography>
                  <Typography sx={{ fontSize: 14, color: tokens.color.textMuted }}>
                    {n.message}
                  </Typography>
                </Box>
                <CommonButton
                  variant="outlined"
                  onClick={() => {
                    vm.markRead(n.id);
                    router.push(n.href);
                  }}
                >
                  Open
                </CommonButton>
              </Box>
            );
          })
        )}
      </Box>
      <AlertSettings />
      </Box>
    </ScreenSurface>
  );
}
