"use client";
import { useState } from "react";
import { Box, ButtonBase, Menu, MenuItem, Typography } from "@mui/material";
import ArrowDropDownRounded from "@mui/icons-material/ArrowDropDownRounded";
import InboxOutlined from "@mui/icons-material/InboxOutlined";
import { cardSx, tokens } from "@/core/theme/tokens";
import { formatRupees } from "@/shared/utils/format";
import { mealCount, orderValue, type GroupOrder } from "../models/groupOrder";
import { parse } from "./groupOrderFormat";

type Period = "month" | "last" | "all";
const PERIODS: { id: Period; label: string }[] = [
  { id: "month", label: "This month" },
  { id: "last", label: "Last month" },
  { id: "all", label: "All time" },
];

/** When a finished order is dated: its last change, else the train's arrival, else when it was placed. */
const finishedAt = (o: GroupOrder) => parse(o.updatedAt) ?? parse(o.trainArrival) ?? parse(o.placedAt);

const inPeriod = (at: number | undefined, period: Period, now: number) => {
  if (period === "all") return true;
  if (at === undefined) return false;
  const d = new Date(at),
    n = new Date(now),
    last = new Date(n.getFullYear(), n.getMonth() - 1, 1);
  const target = period === "month" ? n : last;
  return d.getFullYear() === target.getFullYear() && d.getMonth() === target.getMonth();
};

const TONES = {
  green: { fg: tokens.color.success, bg: tokens.color.successBg },
  red: { fg: tokens.color.error, bg: tokens.color.errorBg },
} as const;

/** "Delivered" in green; a rejected order reads Cancelled, a failed one Failed, both red. */
const result = (status: string) =>
  status === "DELIVERED"
    ? { label: "Delivered", tone: TONES.green }
    : { label: status === "FAILED" ? "Failed" : "Cancelled", tone: TONES.red };

const COLUMNS = "0.8fr 1fr 2fr 1.6fr 0.7fr 0.9fr 1fr";

const row = {
  display: "grid",
  gridTemplateColumns: COLUMNS,
  alignItems: "center",
  gap: 1,
  px: 3,
  fontSize: 13,
  "& > :nth-of-type(n+5):nth-of-type(-n+6)": { textAlign: "right" },
} as const;

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <Box sx={{ ...cardSx, px: 3, py: 2.25, minWidth: 0 }}>
      <Typography sx={{ fontSize: 13, color: tokens.color.textMuted }}>{label}</Typography>
      <Typography sx={{ fontSize: 26, lineHeight: "34px", fontWeight: 700 }}>{value}</Typography>
    </Box>
  );
}

/**
 * The Completed tab: how this month's group orders went (orders, meals
 * delivered, earnings) and a list of the finished ones, latest first. A row
 * opens the order's side panel.
 */
export function CompletedGroupOrders({
  orders,
  now,
  loading,
  onOpen,
}: {
  /** Finished group orders: delivered, rejected or failed. */
  orders: GroupOrder[];
  now: number;
  loading?: boolean;
  onOpen: (order: GroupOrder) => void;
}) {
  const [period, setPeriod] = useState<Period>("month"),
    [anchor, setAnchor] = useState<HTMLElement | null>(null),
    month = orders.filter((o) => inPeriod(finishedAt(o), "month", now)),
    delivered = month.filter((o) => o.status === "DELIVERED"),
    shown = orders
      .filter((o) => inPeriod(finishedAt(o), period, now))
      .sort((a, b) => (finishedAt(b) ?? 0) - (finishedAt(a) ?? 0));
  return (
    <Box sx={{ maxWidth: 1040, mx: "auto", p: { xs: 2, md: 3 }, display: "grid", gap: 2.5 }}>
      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "repeat(3, minmax(0, 1fr))" } }}>
        <Stat label="Group orders this month" value={month.length} />
        <Stat label="Meals delivered" value={delivered.reduce((sum, o) => sum + mealCount(o), 0).toLocaleString("en-IN")} />
        <Stat label="Earnings" value={formatRupees(delivered.reduce((sum, o) => sum + orderValue(o), 0))} />
      </Box>
      <Box sx={{ ...cardSx, p: 0, overflow: "hidden" }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, p: 3, pb: 2 }}>
          <Typography component="h2" sx={{ fontSize: 16, fontWeight: 700 }}>
            Past group orders
          </Typography>
          <ButtonBase
            aria-haspopup="menu"
            onClick={(e) => setAnchor(e.currentTarget)}
            sx={{
              height: 36,
              pl: 1.75,
              pr: 1,
              gap: 0.25,
              fontSize: 13,
              fontWeight: 600,
              borderRadius: "10px",
              border: `1px solid ${tokens.color.borderInput}`,
              bgcolor: tokens.color.card,
            }}
          >
            {PERIODS.find((p) => p.id === period)?.label}
            <ArrowDropDownRounded />
          </ButtonBase>
          <Menu anchorEl={anchor} open={!!anchor} onClose={() => setAnchor(null)}>
            {PERIODS.map((p) => (
              <MenuItem
                key={p.id}
                selected={p.id === period}
                onClick={() => {
                  setPeriod(p.id);
                  setAnchor(null);
                }}
                sx={{ fontSize: 13 }}
              >
                {p.label}
              </MenuItem>
            ))}
          </Menu>
        </Box>
        <Box sx={{ overflowX: "auto" }}>
          <Box sx={{ minWidth: 760 }}>
            <Box
              sx={{
                ...row,
                py: 1.25,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.4px",
                color: tokens.color.textMuted,
                bgcolor: tokens.color.page,
              }}
            >
              {["DATE", "ORDER", "TRAIN", "STATION", "MEALS", "VALUE", "STATUS"].map((h) => (
                <Box key={h} component="span">
                  {h}
                </Box>
              ))}
            </Box>
            {shown.length === 0 ? (
              <Box sx={{ display: "grid", placeItems: "center", gap: 1, py: 6, color: tokens.color.textMuted }}>
                <InboxOutlined sx={{ fontSize: 40, opacity: 0.5 }} />
                <Typography sx={{ fontSize: 14 }}>
                  {loading ? "Loading group orders…" : "No completed group orders in this period."}
                </Typography>
              </Box>
            ) : (
              shown.map((o) => {
                const at = finishedAt(o),
                  end = result(String(o.status));
                return (
                  <Box
                    key={o.key}
                    role="button"
                    tabIndex={0}
                    onClick={() => onOpen(o)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onOpen(o);
                      }
                    }}
                    sx={{
                      ...row,
                      py: 1.5,
                      cursor: "pointer",
                      borderTop: `1px solid ${tokens.color.borderSubtle}`,
                      "&:hover": { bgcolor: tokens.color.sunken },
                    }}
                  >
                    <Box component="span" sx={{ color: tokens.color.textMuted }}>
                      {at === undefined ? "—" : new Date(at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                    </Box>
                    <Box component="b">{o.id ?? "—"}</Box>
                    <Box component="span">
                      {[o.trainName, o.trainNumber].filter(Boolean).join(" · ") || "—"}
                    </Box>
                    <Box component="span">{o.stationName?.replace(/\s*\(.*\)$/, "") || "—"}</Box>
                    <Box component="span">{mealCount(o)}</Box>
                    <Box component="b">{formatRupees(orderValue(o))}</Box>
                    <Box>
                      <Box
                        component="span"
                        sx={{
                          display: "inline-block",
                          px: 1.25,
                          fontSize: 11,
                          lineHeight: "22px",
                          fontWeight: 700,
                          borderRadius: "11px",
                          color: end.tone.fg,
                          bgcolor: end.tone.bg,
                        }}
                      >
                        {end.label}
                      </Box>
                    </Box>
                  </Box>
                );
              })
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
