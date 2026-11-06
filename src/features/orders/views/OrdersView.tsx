"use client";
import { Box, ButtonBase, Typography } from "@mui/material";
import { ToastAlert } from "@/core/providers/ToastProvider";
import { usePortal } from "@/core/providers/PortalProvider";
import { tokens } from "@/core/theme/tokens";
import { formatRupees } from "@/shared/utils/format";
import { SetupChecklist } from "@/features/portal/components/SetupChecklist";
import { useGoLiveSetup } from "@/features/portal/viewmodels/useGoLiveSetup";
import { useVendorProfile } from "@/features/profile/viewmodels/useVendorProfile";
import { useNow, useOrdersWorkspace, type OrdersTab } from "../viewmodels/useOrdersWorkspace";
import { OrderDetail } from "../components/OrderDetail";
import { OrderList } from "../components/OrderList";

const tabs: { id: OrdersTab; label: string; count?: boolean }[] = [
  { id: "new", label: "New", count: true },
  { id: "preparing", label: "Preparing", count: true },
  { id: "ready", label: "Ready", count: true },
  { id: "past", label: "Past orders" },
];

/**
 * Manage Orders: a tab for each stage, the orders of that stage on the left
 * and the open order, with its next step, on the right. A restaurant that is
 * approved but not live yet sees the setup list here instead.
 */
export function OrdersView() {
  const ws = useOrdersWorkspace(),
    setup = useGoLiveSetup(),
    { online } = usePortal(),
    { restaurantName } = useVendorProfile(),
    now = useNow(ws.tab === "preparing" || ws.tab === "ready" || ws.tab === "new");
  if (!online && !setup.loading && !setup.ready)
    return (
      <SetupChecklist setup={setup} restaurantName={restaurantName || "Your restaurant"} />
    );
  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          px: { xs: 2, md: 3 },
          bgcolor: tokens.color.card,
          borderBottom: `1px solid ${tokens.color.border}`,
          overflowX: "auto",
        }}
      >
        {tabs.map((tab) => {
          const on = ws.tab === tab.id,
            count = tab.count ? ws.counts[tab.id as "new" | "preparing" | "ready"] : undefined;
          return (
            <ButtonBase
              key={tab.id}
              role="tab"
              aria-selected={on}
              onClick={() => ws.setTab(tab.id)}
              sx={{
                gap: 1,
                height: 52,
                px: 1.75,
                fontSize: 14,
                fontWeight: on ? 700 : 500,
                whiteSpace: "nowrap",
                color: on ? tokens.color.primary : tokens.color.textMuted,
                borderBottom: `2px solid ${on ? tokens.color.primary : "transparent"}`,
              }}
            >
              {tab.label}
              {count !== undefined && (
                <Box
                  component="span"
                  sx={{
                    minWidth: 22,
                    px: 0.75,
                    fontSize: 12,
                    lineHeight: "20px",
                    fontWeight: 700,
                    borderRadius: "10px",
                    color: on ? "#fff" : tokens.color.textMuted,
                    bgcolor: on ? tokens.color.primary : tokens.color.muted,
                  }}
                >
                  {count}
                </Box>
              )}
            </ButtonBase>
          );
        })}
        <Box sx={{ flex: 1 }} />
        <Typography sx={{ display: { xs: "none", sm: "block" }, whiteSpace: "nowrap", fontSize: 12, color: tokens.color.textMuted }}>
          Today · <b style={{ color: tokens.color.text }}>{ws.todayOrders} orders</b> · {formatRupees(ws.todaySales)} sales
        </Typography>
      </Box>
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        {ws.error && (
          <ToastAlert severity="error" sx={{ mb: 2 }}>
            {ws.error}
          </ToastAlert>
        )}
        <Box
          sx={{
            display: "grid",
            gap: 2,
            alignItems: "start",
            gridTemplateColumns: { xs: "1fr", md: "300px minmax(0, 1fr)" },
          }}
        >
          <OrderList ws={ws} now={now} />
          <OrderDetail ws={ws} now={now} />
        </Box>
      </Box>
    </Box>
  );
}
