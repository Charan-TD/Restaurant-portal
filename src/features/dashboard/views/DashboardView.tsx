"use client";
import { Box } from "@mui/material";
import { usePortal } from "@/core/providers/PortalProvider";
import { SetupChecklist } from "@/features/portal/components/SetupChecklist";
import { useGoLiveSetup } from "@/features/portal/viewmodels/useGoLiveSetup";
import { useVendorProfile } from "@/features/profile/viewmodels/useVendorProfile";
import { useDashboardViewModel } from "../viewmodels/useDashboardViewModel";
import { LiveOrders } from "../components/LiveOrders";
import { RevenueSummary } from "../components/RevenueChart";
import { TodayOverview } from "../components/TodayOverview";
/** The top bar greets the vendor. */
export function DashboardView() {
  const vm = useDashboardViewModel(),
    setup = useGoLiveSetup(),
    { online } = usePortal(),
    { restaurantName } = useVendorProfile();
  // An approved restaurant that is not live yet adds its menu (and riders) first.
  if (!online && !setup.loading && !setup.ready)
    return (
      <SetupChecklist
        setup={setup}
        restaurantName={restaurantName || "Your restaurant"}
      />
    );
  return (
    <Box sx={{ display: "grid", gap: 2.5 }}>
      <TodayOverview overview={vm.overview} />
      <LiveOrders showViewAll />
      <RevenueSummary vm={vm} />
    </Box>
  );
}
