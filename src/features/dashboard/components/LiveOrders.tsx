"use client";
import NextLink from "next/link";
import { Alert, Box, Link, Typography } from "@mui/material";
import { CommonCard } from "@/shared/components/layout/CommonCard";
import { useOrdersViewModel } from "../viewmodels/useOrdersViewModel";
import { OrderCard } from "./OrderCard";
/** Orders waiting for the kitchen, with accept / reject / ready actions. */
export function LiveOrders({ showViewAll = false }: { showViewAll?: boolean }) {
  const vm = useOrdersViewModel();
  return (
    <CommonCard>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
        }}
      >
        <div>
          <Typography variant="h6" component="h2">
            Live orders
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Accept new orders and mark them ready for pickup
          </Typography>
        </div>
        {showViewAll && (
          <Link
            component={NextLink}
            href="/orders/live"
            sx={{ fontWeight: 600 }}
            underline="hover"
          >
            View all
          </Link>
        )}
      </Box>
      {vm.error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {vm.error}
        </Alert>
      )}
      {vm.orders.length ? (
        vm.orders.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            busy={vm.busyId === order.id}
            onChange={vm.changeOrder}
          />
        ))
      ) : (
        <Typography color="text.secondary" sx={{ mt: 3 }}>
          No orders yet.
        </Typography>
      )}
    </CommonCard>
  );
}
