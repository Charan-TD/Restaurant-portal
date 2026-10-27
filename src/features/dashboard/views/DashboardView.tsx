"use client";
import { Box } from "@mui/material";
import { useDashboardViewModel } from "../viewmodels/useDashboardViewModel";
import { LiveOrders } from "../components/LiveOrders";
import { RevenueSummary } from "../components/RevenueChart";
import { TodayOverview } from "../components/TodayOverview";
/** The top bar greets the vendor. */
export function DashboardView() {
  const vm = useDashboardViewModel();
  return (
    <Box sx={{ display: "grid", gap: 2.5 }}>
      <TodayOverview overview={vm.overview} />
      <LiveOrders showViewAll />
      <RevenueSummary vm={vm} />
    </Box>
  );
}
