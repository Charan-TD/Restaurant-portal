"use client";
import type { ReactNode } from "react";
import { Box, Typography } from "@mui/material";
import ArrowDropUp from "@mui/icons-material/ArrowDropUp";
import ArrowDropDown from "@mui/icons-material/ArrowDropDown";
import { cardSx, tokens } from "@/core/theme/tokens";
import { formatRupees } from "@/shared/utils/format";
import { ScreenSurface } from "@/shared/components/layout/ScreenSurface";
import { CountTabs } from "@/shared/components/navigation/CountTabs";
import {
  RANGE_TABS,
  useInsightsViewModel,
  type InsightsViewModel,
} from "../viewmodels/useInsightsViewModel";

const BAR = "#b7cdf5",
  STRONG = "#1a56b0",
  EMPTY = "—";

const overline = {
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: "0.4px",
  textTransform: "uppercase",
  color: tokens.color.textMuted,
} as const;

/** A card with a bold title and a muted line under it. */
function Panel({
  title,
  subtitle,
  inline,
  children,
}: {
  title: string;
  subtitle?: string;
  /** Subtitle on the title's line instead of under it. */
  inline?: boolean;
  children: ReactNode;
}) {
  return (
    <Box sx={{ ...cardSx, p: 3, minWidth: 0 }}>
      <Box
        sx={{
          display: "flex",
          flexDirection: inline ? "row" : "column",
          alignItems: inline ? "baseline" : "flex-start",
          gap: inline ? 1.5 : 0,
          mb: 2,
        }}
      >
        <Typography sx={{ fontSize: 16, fontWeight: 700 }}>{title}</Typography>
        {subtitle && (
          <Typography sx={{ fontSize: 13, color: tokens.color.textMuted }}>
            {subtitle}
          </Typography>
        )}
      </Box>
      {children}
    </Box>
  );
}

function Delta({ percent, vs }: { percent: number | null; vs: string }) {
  if (percent === null)
    return (
      <Typography sx={{ fontSize: 12, color: tokens.color.textMuted }}>
        Nothing to compare with yet
      </Typography>
    );
  const up = percent >= 0;
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        fontSize: 12,
        color: tokens.color.textMuted,
      }}
    >
      <Box
        component="span"
        sx={{
          display: "inline-flex",
          alignItems: "center",
          fontWeight: 600,
          color: up ? tokens.color.success : tokens.color.error,
        }}
      >
        {up ? <ArrowDropUp /> : <ArrowDropDown />}
        {up ? "+" : ""}
        {percent}%
      </Box>
      &nbsp;{vs}
    </Box>
  );
}

function Stat({
  label,
  value,
  children,
}: {
  label: string;
  value: ReactNode;
  children?: ReactNode;
}) {
  return (
    <Box sx={{ ...cardSx, p: 2.25, minWidth: 0 }}>
      <Typography sx={overline}>{label}</Typography>
      <Typography sx={{ mt: 0.5, fontSize: 24, lineHeight: "32px", fontWeight: 700 }}>
        {value}
      </Typography>
      <Box sx={{ minHeight: 18 }}>{children}</Box>
    </Box>
  );
}

function Track({
  value,
  max,
  color,
  height = 10,
}: {
  value: number;
  max: number;
  color: string;
  height?: number;
}) {
  return (
    <Box
      sx={{
        flex: 1,
        height,
        borderRadius: 999,
        bgcolor: tokens.color.muted,
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          width: `${max ? (value / max) * 100 : 0}%`,
          height: "100%",
          borderRadius: 999,
          bgcolor: color,
        }}
      />
    </Box>
  );
}

const Note = ({ children }: { children: ReactNode }) => (
  <Typography sx={{ fontSize: 13, color: tokens.color.textMuted }}>
    {children}
  </Typography>
);

function SalesChart({ vm }: { vm: InsightsViewModel }) {
  const { bars, best } = vm,
    max = Math.max(...bars.map((b) => b.value), 0),
    few = bars.length <= 7,
    today = vm.range === "today";
  return (
    <Panel
      title={today ? "Sales by hour" : "Sales by day"}
      subtitle={
        best
          ? `${best.label} was your best ${today ? "hour" : "day"}: ${formatRupees(best.value)} from ${best.orders} orders`
          : "Sales will show here once you have orders"
      }
    >
      <Box
        sx={{
          height: 250,
          display: "flex",
          alignItems: "flex-end",
          gap: few ? 3 : 0.5,
          px: few ? 3 : 0,
        }}
      >
        {bars.map((bar, i) => {
          const top = !!best && bar.value === best.value && bar.value > 0;
          return (
            <Box
              key={`${bar.label}-${i}`}
              sx={{
                flex: 1,
                minWidth: 0,
                height: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "flex-end",
                alignItems: "center",
              }}
            >
              {few && (
                <Typography
                  sx={{ fontSize: 11, mb: 0.5, fontWeight: top ? 700 : 400, color: tokens.color.textMuted }}
                >
                  {bar.value ? formatRupees(bar.value) : ""}
                </Typography>
              )}
              <Box
                title={`${bar.label}: ${formatRupees(bar.value)} · ${bar.orders} orders`}
                sx={{
                  width: "100%",
                  height: `${max ? (bar.value / max) * 78 : 0}%`,
                  minHeight: bar.value ? 4 : 2,
                  borderRadius: "6px 6px 0 0",
                  bgcolor: top ? STRONG : BAR,
                }}
              />
              <Typography
                sx={{
                  mt: 1,
                  fontSize: few ? 12 : 10,
                  fontWeight: few ? 600 : 400,
                  // A long axis shows every fifth label to stay readable.
                  visibility: few || i % 5 === 0 || today ? "visible" : "hidden",
                }}
              >
                {bar.label}
              </Typography>
              {few && (
                <Typography sx={{ fontSize: 11, color: tokens.color.textMuted }}>
                  {bar.orders} orders
                </Typography>
              )}
            </Box>
          );
        })}
      </Box>
    </Panel>
  );
}

function BusiestHours({ vm }: { vm: InsightsViewModel }) {
  const max = Math.max(...vm.bands.map((b) => b.count), 0);
  return (
    <Panel title="Busiest hours" subtitle="Orders by time of day">
      <Box sx={{ display: "grid", gap: 1.5 }}>
        {vm.bands.map((band) => (
          <Box key={band.label} sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Typography sx={{ width: 104, fontSize: 13 }}>{band.label}</Typography>
            <Track
              value={band.count}
              max={max}
              color={band.count && band.count === max ? STRONG : BAR}
            />
            <Typography sx={{ width: 28, textAlign: "right", fontSize: 13, fontWeight: 700 }}>
              {band.count}
            </Typography>
          </Box>
        ))}
      </Box>
    </Panel>
  );
}

/** Orders do not say how they were paid, so this card waits for that data. */
function PaymentMix() {
  const side = (color: string, label: string) => (
    <Box sx={{ flex: 1, px: 3, "&:first-of-type": { pl: 0 } }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, fontSize: 13 }}>
        <Box sx={{ width: 10, height: 10, borderRadius: "3px", bgcolor: color }} />
        {label}
      </Box>
      <Typography sx={{ my: 0.5, fontSize: 28, lineHeight: "36px", fontWeight: 700 }}>
        {EMPTY}
      </Typography>
      <Typography sx={{ fontSize: 13, color: tokens.color.textMuted }}>
        Sales {EMPTY}
      </Typography>
    </Box>
  );
  return (
    <Panel title="Paid online vs cash on delivery">
      <Box sx={{ display: "flex" }}>
        {side(tokens.color.success, "Paid online")}
        <Box sx={{ width: "1px", bgcolor: tokens.color.border }} />
        {side("#f0b43c", "Cash on delivery")}
      </Box>
      <Box sx={{ mt: 2.5, height: 10, borderRadius: 999, bgcolor: tokens.color.muted }} />
      <Box sx={{ mt: 1.5 }}>
        <Note>The split will show here once orders report how they were paid.</Note>
      </Box>
    </Panel>
  );
}

function TopDishes({ vm }: { vm: InsightsViewModel }) {
  return (
    <Panel title="Top dishes" subtitle="By portions ordered">
      {vm.topDishes.length === 0 ? (
        <Note>No orders in this period yet.</Note>
      ) : (
        vm.topDishes.map((dish, i) => (
          <Box
            key={dish.name}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              py: 1.25,
              fontSize: 14,
              borderTop: i ? `1px solid ${tokens.color.borderSubtle}` : 0,
            }}
          >
            <Box sx={{ width: 14, color: tokens.color.textMuted, fontSize: 13 }}>{i + 1}</Box>
            <Typography noWrap sx={{ flex: 1, fontSize: 14 }}>
              {dish.name}
            </Typography>
            <Typography sx={{ fontSize: 13, color: tokens.color.textMuted }}>
              {dish.quantity} {dish.quantity === 1 ? "portion" : "portions"}
            </Typography>
          </Box>
        ))
      )}
    </Panel>
  );
}

function ByStation({ vm }: { vm: InsightsViewModel }) {
  const max = Math.max(...vm.topStations.map((s) => s.count), 0);
  return (
    <Panel title="Orders by station" subtitle="Where your food meets the train">
      {vm.topStations.length === 0 ? (
        <Note>No station details on orders in this period.</Note>
      ) : (
        <Box sx={{ display: "grid", gap: 2 }}>
          {vm.topStations.map((station) => (
            <Box key={station.name}>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.75, fontSize: 13 }}>
                <Typography noWrap sx={{ fontSize: 13, fontWeight: 600 }}>
                  {station.name}
                </Typography>
                <Box component="span" sx={{ color: tokens.color.textMuted }}>
                  <b style={{ color: tokens.color.text }}>{station.count}</b> · {station.percent}%
                </Box>
              </Box>
              <Track value={station.count} max={max} color="#3b82c4" height={8} />
            </Box>
          ))}
        </Box>
      )}
    </Panel>
  );
}

/** Prep and pickup times are not reported by the orders API yet. */
function KitchenPerformance() {
  const rows = [
    ["Average prep time", "How long orders take to prepare"],
    ["Ready on time", "Orders ready by the promised time"],
    ["Rider wait at counter", "Average per pickup"],
  ];
  return (
    <Panel title="Kitchen performance" subtitle="How fast orders leave your counter">
      {rows.map(([title, note], i) => (
        <Box
          key={title}
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            py: 1.25,
            borderTop: i ? `1px solid ${tokens.color.borderSubtle}` : 0,
          }}
        >
          <Box>
            <Typography sx={{ fontSize: 14, fontWeight: 600 }}>{title}</Typography>
            <Typography sx={{ fontSize: 12, color: tokens.color.textMuted }}>{note}</Typography>
          </Box>
          <Typography sx={{ fontSize: 16, fontWeight: 700 }}>{EMPTY}</Typography>
        </Box>
      ))}
      <Box sx={{ mt: 1 }}>
        <Note>These will show here once the app reports prep and pickup times.</Note>
      </Box>
    </Panel>
  );
}

/** How the restaurant is doing: sales, busy times, dishes and stations. */
export function InsightsView() {
  const vm = useInsightsViewModel(),
    period =
      vm.range === "today" ? "yesterday" : `the ${vm.range} days before`;
  return (
    <ScreenSurface>
      <CountTabs
        label="Insights period"
        value={vm.range}
        onChange={vm.setRange}
        tabs={RANGE_TABS}
      />
      <Box sx={{ display: "grid", gap: 3 }}>
        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: {
              xs: "repeat(2, minmax(0, 1fr))",
              lg: "repeat(5, minmax(0, 1fr))",
            },
          }}
        >
          <Stat label="Sales" value={formatRupees(vm.sales)}>
            <Delta
              percent={vm.salesChange}
              vs={`vs ${formatRupees(vm.salesBefore)}`}
            />
          </Stat>
          <Stat label="Orders" value={vm.orders}>
            <Delta percent={vm.ordersChange} vs={`vs ${vm.ordersBefore}`} />
          </Stat>
          <Stat label="Ready on time" value={EMPTY}>
            <Note>Not reported yet</Note>
          </Stat>
          <Stat label="Rejected" value={vm.rejected}>
            <Note>{vm.rejectedPercent}% of orders</Note>
          </Stat>
          <Stat
            label="Rating"
            value={vm.rating.average === null ? EMPTY : `${vm.rating.average.toFixed(1)} ★`}
          >
            <Note>
              {vm.rating.count.toLocaleString("en-IN")}{" "}
              {vm.rating.count === 1 ? "rating" : "ratings"}
            </Note>
          </Stat>
        </Box>
        <Box
          sx={{
            display: "grid",
            gap: 3,
            alignItems: "start",
            gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 1fr) 400px" },
          }}
        >
          <SalesChart vm={vm} />
          <BusiestHours vm={vm} />
        </Box>
        <PaymentMix />
        <Box
          sx={{
            display: "grid",
            gap: 3,
            alignItems: "start",
            gridTemplateColumns: { xs: "1fr", lg: "repeat(3, minmax(0, 1fr))" },
          }}
        >
          <TopDishes vm={vm} />
          <ByStation vm={vm} />
          <KitchenPerformance />
        </Box>
        <Typography sx={{ fontSize: 12, color: tokens.color.textSubtle }}>
          Worked out from your {vm.loaded} most recent orders, compared with{" "}
          {period}.
        </Typography>
      </Box>
    </ScreenSurface>
  );
}
