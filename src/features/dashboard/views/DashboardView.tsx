"use client";
import { Box } from "@mui/material";
import CurrencyRupee from "@mui/icons-material/CurrencyRupee";
import ReceiptLongOutlined from "@mui/icons-material/ReceiptLongOutlined";
import ShoppingBagOutlined from "@mui/icons-material/ShoppingBagOutlined";
import PendingActionsOutlined from "@mui/icons-material/PendingActionsOutlined";
import BarChartOutlined from "@mui/icons-material/BarChartOutlined";
import DonutLargeOutlined from "@mui/icons-material/DonutLargeOutlined";
import DeliveryDiningOutlined from "@mui/icons-material/DeliveryDiningOutlined";
import RestaurantMenuOutlined from "@mui/icons-material/RestaurantMenuOutlined";
import { PageHeader } from "@/shared/components/layout/PageHeader";
import { useDashboardViewModel } from "../viewmodels/useDashboardViewModel";
import { PlaceholderCard } from "../components/PlaceholderCard";
const rowSx = {
  display: "grid",
  gap: 3,
  gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 2fr) minmax(0, 1fr)" },
  alignItems: "stretch",
} as const;
export function DashboardView() {
  const vm = useDashboardViewModel();
  return (
    <>
      <PageHeader
        eyebrow={vm.today}
        title={vm.greeting}
        subtitle="Here's how your restaurant is doing today."
      />
      <Box sx={{ display: "grid", gap: 3 }}>
        <Box
          sx={{
            display: "grid",
            gap: 3,
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, 1fr)",
              xl: "repeat(4, 1fr)",
            },
          }}
        >
          <PlaceholderCard
            title="Today's sales"
            description="Total sales value today, compared with yesterday."
            icon={<CurrencyRupee fontSize="small" />}
          />
          <PlaceholderCard
            title="Today's orders"
            description="Number of orders received today, compared with yesterday."
            icon={<ReceiptLongOutlined fontSize="small" />}
          />
          <PlaceholderCard
            title="Avg. order value"
            description="Average amount spent per order today."
            icon={<ShoppingBagOutlined fontSize="small" />}
          />
          <PlaceholderCard
            title="Pending orders"
            description="Orders waiting to be accepted or prepared."
            icon={<PendingActionsOutlined fontSize="small" />}
          />
        </Box>
        <Box sx={rowSx}>
          <PlaceholderCard
            title="Revenue summary"
            description="Daily revenue for the last 7 days, with weekly total and best day."
            icon={<BarChartOutlined fontSize="small" />}
            bodyHeight={200}
          />
          <PlaceholderCard
            title="Order status"
            description="Today's orders split into delivered, in progress and cancelled."
            icon={<DonutLargeOutlined fontSize="small" />}
            bodyHeight={200}
          />
        </Box>
        <Box sx={rowSx}>
          <PlaceholderCard
            title="Live orders"
            description="New orders to accept or reject, and accepted orders to mark ready for pickup."
            icon={<DeliveryDiningOutlined fontSize="small" />}
            bodyHeight={160}
          />
          <PlaceholderCard
            title="Top items today"
            description="Your best-selling dishes today, with quantity sold and revenue."
            icon={<RestaurantMenuOutlined fontSize="small" />}
            bodyHeight={160}
          />
        </Box>
      </Box>
    </>
  );
}
