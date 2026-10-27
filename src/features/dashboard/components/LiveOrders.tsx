"use client";
import { ToastAlert } from "@/core/providers/ToastProvider";
import { useState } from "react";
import NextLink from "next/link";
import { Box, Link, Tab, Tabs, Typography } from "@mui/material";
import InboxOutlined from "@mui/icons-material/InboxOutlined";
import { CommonCard } from "@/shared/components/layout/CommonCard";
import { useOrdersViewModel } from "../viewmodels/useOrdersViewModel";
import type { Order, OrderStatus } from "../models/order";
import { OrderCard, OrderListHeadings } from "./OrderCard";
const tabs: { label: string; states: OrderStatus[]; empty: string }[] = [
  { label: "New Orders", states: ["New"], empty: "No new orders right now." },
  {
    label: "Preparing",
    states: ["Preparing"],
    empty: "Nothing is being prepared.",
  },
  {
    label: "Packed Orders",
    states: ["Ready"],
    empty: "No packed orders waiting.",
  },
  {
    label: "Order status",
    states: ["HandedOver", "Delivered"],
    empty: "No orders to update yet.",
  },
];
/** Orders still to deliver come first, delivered ones last; newest first within each. */
const pendingFirst = (a: Order, b: Order) =>
  Number(a.state === "Delivered") - Number(b.state === "Delivered") ||
  (Date.parse(b.placedAt ?? "") || 0) - (Date.parse(a.placedAt ?? "") || 0);
/** Accept or reject new orders, then follow them through preparing, packed and delivery. */
export function LiveOrders({ showViewAll = false }: { showViewAll?: boolean }) {
  const vm = useOrdersViewModel(),
    [tab, setTab] = useState(0),
    current = tabs[tab];
  const shown = vm.orders
    .filter((o) => current.states.includes(o.state))
    .sort(pendingFirst);
  const count = (index: number) =>
    vm.orders.filter((o) => tabs[index].states.includes(o.state)).length;
  return (
    <CommonCard style={{ padding: 0 }}>
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 1,
          px: { xs: 2.5, sm: 3 },
          pt: 2.5,
        }}
      >
        <div>
          <Typography variant="h6" component="h2">
            Live orders
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Accept, prepare and pack orders, then update their status until
            delivered.
          </Typography>
        </div>
        {showViewAll && (
          <Link
            component={NextLink}
            href="/orders/all"
            sx={{ fontWeight: 600 }}
            underline="hover"
          >
            View all orders →
          </Link>
        )}
      </Box>
      <Tabs
        value={tab}
        variant="fullWidth"
        onChange={(_, value: number) => setTab(value)}
        sx={{
          mx: { xs: 2, sm: 3 },
          mt: 2.5,
          bgcolor: "#f3f4f2",
          borderRadius: "10px 10px 0 0",
        }}
      >
        {tabs.map((t, i) => (
          <Tab
            key={t.label}
            label={`${t.label} (${count(i)})`}
            sx={{ fontWeight: 700, minHeight: 52 }}
          />
        ))}
      </Tabs>
      {vm.error && (
        <ToastAlert severity="error" sx={{ m: 2.5 }}>
          {vm.error}
        </ToastAlert>
      )}
      <Box sx={{ p: { xs: 2, sm: 3 }, minHeight: 200 }}>
        {shown.length ? (
          <Box
            sx={{
              overflowX: "auto",
              // Its wide content scrolls here instead of widening the page.
              contain: "inline-size",
              // The list always scrolls inside the card once it is taller than this.
              maxHeight: 520,
              overflowY: "auto",
              pr: 0.5,
            }}
          >
            <Box
              sx={{
                display: "grid",
                gap: 1.5,
                alignContent: "start",
                minWidth: 1060,
              }}
            >
              {/* Column headings, shown once above all the rows. */}
              <Box
                sx={{
                  position: "sticky",
                  top: 0,
                  zIndex: 1,
                  bgcolor: "background.paper",
                }}
              >
                <OrderListHeadings />
              </Box>
              {shown.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  busy={vm.busyId === order.id}
                  onChange={vm.changeOrder}
                />
              ))}
            </Box>
          </Box>
        ) : (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 1,
              minHeight: 160,
              color: "text.secondary",
            }}
          >
            <InboxOutlined sx={{ fontSize: 44, opacity: 0.5 }} />
            <Typography>{current.empty}</Typography>
          </Box>
        )}
      </Box>
    </CommonCard>
  );
}
