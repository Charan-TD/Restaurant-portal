"use client";
import { Box, ButtonBase, InputBase, Typography } from "@mui/material";
import SearchRounded from "@mui/icons-material/SearchRounded";
import { cardSx, tokens } from "@/core/theme/tokens";
import { formatRupees } from "@/shared/utils/format";
import { RiderMark } from "@/features/orders/components/OrderList";
import { mealCount, orderValue, readyAt, type GroupOrder } from "../models/groupOrder";
import { clock } from "./groupOrderFormat";

/** The line above an order id: station, train and coaches, in capitals. */
const routeLine = (o: GroupOrder) =>
  [o.stationName, [o.trainNumber, o.trainName].filter(Boolean).join(" "), o.coaches.join(", ")]
    .filter(Boolean)
    .join(" · ")
    .toUpperCase() || "GROUP ORDER";

/** Where the order stands, under its value: due time while cooking, then who has it. */
function stage(o: GroupOrder, now: number) {
  if (o.status === "READY") return { text: "Food ready" };
  if (o.status === "OUT_FOR_DELIVERY") return { text: o.rider ? `With ${o.rider.name}` : "With the rider" };
  const ready = readyAt(o);
  if (ready === undefined) return { text: "Preparing" };
  const late = Math.round((now - ready) / 60000);
  return late > 0 ? { text: `${late} min late`, late: true } : { text: `Ready by ${clock(ready)}` };
}

/** Accepted group orders, with a search box on top; the open one is highlighted. */
export function GroupOrderList({
  orders,
  openKey,
  onOpen,
  search,
  onSearch,
  now,
  own,
}: {
  orders: GroupOrder[];
  openKey?: string;
  onOpen: (key: string) => void;
  search: string;
  onSearch: (value: string) => void;
  now: number;
  own: boolean;
}) {
  return (
    <Box sx={{ ...cardSx, p: 0, overflow: "hidden", alignSelf: "start", minHeight: 320 }}>
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, height: 40, px: 2, borderRadius: "20px", bgcolor: tokens.color.page }}>
          <InputBase
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search"
            inputProps={{ "aria-label": "Search group orders" }}
            sx={{ flex: 1, fontSize: 14 }}
          />
          <SearchRounded sx={{ fontSize: 20, color: tokens.color.textMuted }} />
        </Box>
      </Box>
      {orders.length === 0 ? (
        <Typography sx={{ px: 2.5, pb: 3, fontSize: 14, color: tokens.color.textMuted }}>
          {search ? "No group orders match your search." : "Nothing is being prepared."}
        </Typography>
      ) : (
        orders.map((o) => {
          const on = o.key === openKey,
            s = stage(o, now);
          return (
            <ButtonBase
              key={o.key}
              aria-current={on}
              onClick={() => onOpen(o.key)}
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
                <Typography sx={{ fontSize: 11, lineHeight: "15px", fontWeight: 700 }}>{routeLine(o)}</Typography>
                <Box sx={{ width: 14, height: 2, my: 0.75, bgcolor: tokens.color.text }} />
                <Typography sx={{ fontSize: 18, lineHeight: "24px", fontWeight: 700, color: tokens.color.primary }}>
                  {o.id ?? "Group order"}
                </Typography>
                <Typography sx={{ fontSize: 13 }}>
                  {mealCount(o)} meals for {formatRupees(orderValue(o))}
                </Typography>
                <Typography sx={{ fontSize: 11, color: s.late ? tokens.color.error : tokens.color.textMuted }}>{s.text}</Typography>
              </Box>
              <RiderMark name={o.rider?.name} own={own} />
            </ButtonBase>
          );
        })
      )}
    </Box>
  );
}
