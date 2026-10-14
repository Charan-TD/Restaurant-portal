"use client";
import { useRouter } from "next/navigation";
import { Box } from "@mui/material";
import AddOutlined from "@mui/icons-material/AddOutlined";
import { PageHeader } from "@/shared/components/layout/PageHeader";
import { CommonButton } from "@/shared/components/actions/CommonButton";
import { useDashboardViewModel } from "../viewmodels/useDashboardViewModel";
import { LiveOrders } from "../components/LiveOrders";
import { RevenueSummary } from "../components/RevenueChart";
import { TodayOverview } from "../components/TodayOverview";
export function DashboardView() {
  const vm = useDashboardViewModel(),
    router = useRouter();
  return (
    <>
      <PageHeader
        eyebrow={vm.today.toUpperCase()}
        title={`${vm.greeting} 👋`}
        subtitle="Here is how your restaurant is doing today."
        actions={
          <CommonButton
            variant="contained"
            startIcon={<AddOutlined />}
            onClick={() => router.push("/menu/add")}
          >
            Add menu item
          </CommonButton>
        }
      />
      <Box sx={{ display: "grid", gap: 3 }}>
        <LiveOrders />
        <Box
          sx={{
            display: "grid",
            gap: 3,
            alignItems: "stretch",
            gridTemplateColumns: {
              xs: "1fr",
              lg: "minmax(0, 1.6fr) minmax(0, 1fr)",
            },
          }}
        >
          <RevenueSummary vm={vm} />
          <TodayOverview overview={vm.overview} />
        </Box>
      </Box>
    </>
  );
}
