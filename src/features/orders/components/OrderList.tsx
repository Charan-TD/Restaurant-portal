"use client";
import { Box, ButtonBase, InputBase, Typography } from "@mui/material";
import SearchRounded from "@mui/icons-material/SearchRounded";
import TwoWheelerOutlined from "@mui/icons-material/TwoWheelerOutlined";
import { cardSx, tokens } from "@/core/theme/tokens";
import { formatRupees } from "@/shared/utils/format";
import { orderNumber } from "@/features/dashboard/components/OrderCard";
import type { Order } from "@/features/dashboard/models/order";
import type { OrdersWorkspace } from "../viewmodels/useOrdersWorkspace";

/** "Received 3 min ago". */
export function ago(iso: string | undefined, now: number) {
  const at = Date.parse(iso ?? "");
  if (!at) return "";
  const minutes = Math.max(0, Math.round((now - at) / 60000));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  return hours < 24 ? `${hours} h ago` : `${Math.floor(hours / 24)} d ago`;
}

/** The line above an order number: station, train and seat, in capitals. */
export const routeLine = (o: Order) =>
  [
    o.stationName,
    [o.trainNumber, o.trainName].filter(Boolean).join(" "),
    [o.coach, o.seat].filter(Boolean).join(" "),
  ]
    .filter(Boolean)
    .join(" · ")
    .toUpperCase() || "TRAIN DELIVERY";

/** The round mark at the right of a preparing order: no rider yet, searching, or who has it. */
function RiderMark({ order, own }: { order: Order; own: boolean }) {
  const name = order.rider?.name,
    initials = name
      ?.split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join("");
  const ring = name ? tokens.color.success : own ? tokens.color.borderInput : tokens.color.primary;
  return (
    <Box sx={{ ml: "auto", flexShrink: 0, textAlign: "center" }}>
      <Box
        sx={{
          width: 44,
          height: 44,
          display: "grid",
          placeItems: "center",
          borderRadius: "50%",
          fontSize: 14,
          fontWeight: 700,
          color: ring,
          border: `2px ${name ? "solid" : "dashed"} ${ring}`,
          bgcolor: tokens.color.card,
        }}
      >
        {name ? initials : <TwoWheelerOutlined sx={{ fontSize: 20 }} />}
      </Box>
      <Typography sx={{ mt: 0.25, fontSize: 9, fontWeight: 700, letterSpacing: "0.3px", color: ring }}>
        {name ? "ASSIGNED" : own ? "NO RIDER" : "ASSIGNING…"}
      </Typography>
    </Box>
  );
}

/** The orders of the open tab, with a search box on top. */
export function OrderList({ ws, now }: { ws: OrdersWorkspace; now: number }) {
  return (
    <Box sx={{ ...cardSx, p: 0, overflow: "hidden", alignSelf: "start", minHeight: 320 }}>
      <Box sx={{ p: 2 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            height: 40,
            px: 2,
            borderRadius: "20px",
            bgcolor: tokens.color.page,
          }}
        >
          <InputBase
            value={ws.search}
            onChange={(e) => ws.setSearch(e.target.value)}
            placeholder="Search"
            inputProps={{ "aria-label": "Search orders" }}
            sx={{ flex: 1, fontSize: 14 }}
          />
          <SearchRounded sx={{ fontSize: 20, color: tokens.color.textMuted }} />
        </Box>
      </Box>
      {ws.list.length === 0 ? (
        <Typography sx={{ px: 2.5, pb: 3, fontSize: 14, color: tokens.color.textMuted }}>
          {ws.search
            ? "No orders match your search."
            : ws.tab === "new"
              ? "No new orders right now."
              : ws.tab === "preparing"
                ? "Nothing is being prepared."
                : ws.tab === "ready"
                  ? "No orders waiting for a rider."
                  : "No past orders yet."}
        </Typography>
      ) : (
        ws.list.map((order) => {
          const on = order.id === ws.open?.id;
          return (
            <ButtonBase
              key={order.id}
              aria-current={on}
              onClick={() => ws.choose(order.id)}
              sx={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 1,
                px: 2.5,
                py: 1.75,
                textAlign: "left",
                borderTop: `1px solid ${tokens.color.borderSubtle}`,
                bgcolor: on ? tokens.color.muted : "transparent",
                "&:hover": { bgcolor: on ? tokens.color.muted : tokens.color.sunken },
              }}
            >
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontSize: 11, lineHeight: "15px", fontWeight: 700 }}>
                  {routeLine(order)}
                </Typography>
                <Box sx={{ width: 14, height: 2, my: 0.75, bgcolor: tokens.color.text }} />
                <Typography sx={{ fontSize: 18, lineHeight: "24px", fontWeight: 700, color: tokens.color.primary }}>
                  {orderNumber(order.id)}
                </Typography>
                <Typography sx={{ fontSize: 13 }}>
                  {order.items.length || 1} {(order.items.length || 1) === 1 ? "item" : "items"} for{" "}
                  {formatRupees(order.amount)}
                </Typography>
                <Typography sx={{ fontSize: 11, color: tokens.color.textMuted }}>
                  {ws.tab === "past" ? "" : "Received "}
                  {ago(order.placedAt, now)}
                </Typography>
              </Box>
              {ws.tab === "preparing" && <RiderMark order={order} own={!ws.trainDhabaRiders} />}
            </ButtonBase>
          );
        })
      )}
    </Box>
  );
}
