import { Box, Typography } from "@mui/material";
import ReceiptLongOutlined from "@mui/icons-material/ReceiptLongOutlined";
import CurrencyRupee from "@mui/icons-material/CurrencyRupee";
import OutdoorGrillOutlined from "@mui/icons-material/OutdoorGrillOutlined";
import StarRounded from "@mui/icons-material/StarRounded";
import ArrowUpward from "@mui/icons-material/ArrowUpward";
import ArrowDownward from "@mui/icons-material/ArrowDownward";
import { MetricCard } from "@/shared/components/layout/MetricCard";
import { formatRupees } from "@/shared/utils/format";
import type { DashboardViewModel } from "../viewmodels/useDashboardViewModel";
/** "+100% vs yesterday" in green, or red when it is lower; nothing when there is no yesterday. */
function Versus({ change }: { change: number | null }) {
  if (change === null) return null;
  const up = change >= 0;
  return (
    <Typography
      variant="body2"
      component="div"
      sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
    >
      <Box
        component="span"
        sx={{
          display: "inline-flex",
          alignItems: "center",
          fontWeight: 700,
          color: up ? "success.main" : "error.main",
        }}
      >
        {up ? (
          <ArrowUpward sx={{ fontSize: 15 }} />
        ) : (
          <ArrowDownward sx={{ fontSize: 15 }} />
        )}
        {up ? "+" : "−"}
        {Math.abs(change)}%
      </Box>
      <Box component="span" sx={{ color: "text.secondary" }}>
        vs yesterday
      </Box>
    </Typography>
  );
}
/** Key numbers for today. The rating shows a dash until the dashboard has a ratings summary. */
export function TodayOverview({
  overview,
}: {
  overview: DashboardViewModel["overview"];
}) {
  return (
    <Box
      sx={{
        display: "grid",
        gap: 2.5,
        gridTemplateColumns: {
          xs: "1fr",
          sm: "repeat(2, minmax(0, 1fr))",
          lg: "repeat(4, minmax(0, 1fr))",
        },
      }}
    >
      <MetricCard
        label="Today's orders"
        hint="Orders placed with you today, compared with yesterday."
        value={String(overview.orders)}
        icon={<ReceiptLongOutlined />}
        note={<Versus change={overview.ordersChange} />}
      />
      <MetricCard
        label="Today's revenue"
        hint="Total value of today's orders, compared with yesterday."
        value={formatRupees(overview.revenue)}
        icon={<CurrencyRupee />}
        note={<Versus change={overview.revenueChange} />}
      />
      <MetricCard
        label="Preparing orders"
        hint="Orders you have accepted that are still being prepared."
        value={String(overview.preparing)}
        icon={<OutdoorGrillOutlined />}
        note="In kitchen"
      />
      <MetricCard
        label="Customer rating"
        hint="Average rating from customer reviews."
        value="–"
        icon={<StarRounded />}
        note="Not enough reviews yet"
      />
    </Box>
  );
}
