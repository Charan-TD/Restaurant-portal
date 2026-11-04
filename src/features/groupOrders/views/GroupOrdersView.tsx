"use client";
import { useState } from "react";
import NextLink from "next/link";
import { Box, Link, Tab, Tabs, Typography } from "@mui/material";
import InboxOutlined from "@mui/icons-material/InboxOutlined";
import { ToastAlert } from "@/core/providers/ToastProvider";
import { CommonCard } from "@/shared/components/layout/CommonCard";
import { PageHeader } from "@/shared/components/layout/PageHeader";
import {
  GroupOrderCard,
  GroupOrderHeadings,
} from "../components/GroupOrderCard";
import type { GroupOrder } from "../models/groupOrder";
import { useGroupOrdersViewModel } from "../viewmodels/useGroupOrdersViewModel";
const tabs: { label: string; statuses: string[]; empty: string }[] = [
  {
    label: "New Orders",
    statuses: ["ASSIGNED"],
    empty: "No new group orders right now.",
  },
  {
    label: "Preparing",
    statuses: ["PREPARING"],
    empty: "Nothing is being prepared.",
  },
  {
    label: "Ready",
    statuses: ["READY"],
    empty: "No group orders waiting for a rider.",
  },
  {
    label: "Delivery status",
    statuses: ["OUT_FOR_DELIVERY", "DELIVERED", "REJECTED", "FAILED"],
    empty: "No group orders to update yet.",
  },
];
const closed = ["DELIVERED", "REJECTED", "FAILED"];
/** Orders still to deliver come first; closed ones follow, the newest at the end. */
const pendingFirst = (a: GroupOrder, b: GroupOrder) =>
  Number(closed.includes(a.status)) - Number(closed.includes(b.status)) ||
  (Date.parse(a.updatedAt ?? "") || 0) - (Date.parse(b.updatedAt ?? "") || 0);
/** Group orders the admin has assigned to this restaurant. */
export function GroupOrdersView() {
  const vm = useGroupOrdersViewModel(),
    [tab, setTab] = useState(0),
    current = tabs[tab],
    // A status no tab lists (e.g. an older admin status) shows under New, as a
    // read-only chip, rather than the order disappearing.
    known = tabs.flatMap((t) => t.statuses),
    inTab = (index: number) =>
      vm.orders.filter(
        (o) =>
          tabs[index].statuses.includes(o.status) ||
          (index === 0 && !known.includes(o.status)),
      ),
    shown = [...inTab(tab)].sort(pendingFirst);
  return (
    <>
      <PageHeader
        eyebrow="Orders"
        title="Group orders"
        subtitle="Large bookings the TrainDhaba team has assigned to your restaurant."
      />
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
              Live group orders
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {vm.trainDhabaRiders
                ? "Accept and prepare group orders, then mark them ready. The TrainDhaba rider updates pickup and delivery."
                : "Accept and prepare group orders, assign a rider, then update their status until delivered."}
            </Typography>
          </div>
          <Link
            component={NextLink}
            href="/group-orders/all"
            sx={{ fontWeight: 600 }}
            underline="hover"
          >
            View all orders →
          </Link>
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
              label={`${t.label} (${inTab(i).length})`}
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
                contain: "inline-size",
                // Heading plus five rows; more orders scroll inside the card.
                maxHeight: 400,
                overflowY: "auto",
                pr: 0.5,
              }}
            >
              <Box
                sx={{
                  display: "grid",
                  gap: 1.5,
                  alignContent: "start",
                  minWidth: 900,
                }}
              >
                <Box
                  sx={{
                    position: "sticky",
                    top: 0,
                    zIndex: 1,
                    bgcolor: "background.paper",
                  }}
                >
                  <GroupOrderHeadings />
                </Box>
                {shown.map((order) => (
                  <GroupOrderCard
                    key={order.key}
                    order={order}
                    busy={vm.busyKey === order.key}
                    onChange={(o, status, rider) =>
                      void vm.changeOrder(o.key, o.id, status, rider)
                    }
                    onAssignRider={(o, rider) => vm.assignRider(o.id, rider)}
                    trainDhabaRiders={vm.trainDhabaRiders}
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
              <Typography>
                {vm.loading ? "Loading group orders…" : current.empty}
              </Typography>
            </Box>
          )}
        </Box>
      </CommonCard>
    </>
  );
}
