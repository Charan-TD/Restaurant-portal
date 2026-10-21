"use client";
import type { ReactNode } from "react";
import { Box, Chip, Typography } from "@mui/material";
import { CommonButton } from "@/shared/components/actions/CommonButton";
import { formatRupees } from "@/shared/utils/format";
import { ItemsSummary } from "@/shared/components/feedback/ItemsSummary";
import { lineLabel, type Order, type OrderStatus } from "../models/order";
interface Props {
  order: Order;
  busy: boolean;
  onChange: (id: string, status: OrderStatus) => Promise<void>;
}
/** A readable order number: the last 6 characters of the id. */
export const orderNumber = (id: string) => `#${id.slice(-6).toUpperCase()}`;
const time = (iso?: string) =>
  iso && !Number.isNaN(Date.parse(iso))
    ? new Date(iso).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "–";
const stateLabel: Record<OrderStatus, string> = {
  New: "New",
  Accepted: "Accepted",
  Preparing: "Preparing",
  Ready: "Packed",
  HandedOver: "Handed to rider",
  Delivered: "Delivered",
  Rejected: "Rejected",
};
/** A value with its caption underneath, like the columns of the live orders list. */
function Cell({
  value,
  caption,
  strong,
  first,
  sx,
}: {
  value: ReactNode;
  caption: string;
  strong?: boolean;
  first?: boolean;
  sx?: object;
}) {
  return (
    <Box
      sx={{
        minWidth: 0,
        ...(!first && {
          borderLeft: { lg: 1 },
          borderColor: "divider",
          pl: { lg: 2.5 },
        }),
        ...sx,
      }}
    >
      <Typography
        component="div"
        sx={{ fontWeight: strong ? 800 : 600, lineHeight: 1.35 }}
      >
        {value}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {caption}
      </Typography>
    </Box>
  );
}
/** One order as a row: id, time, customer, items, amount and its next action. */
export function OrderCard({ order, busy, onChange }: Props) {
  const act = (status: OrderStatus) => void onChange(order.id, status);
  return (
    <Box
      sx={{
        display: "grid",
        alignItems: "center",
        gap: { xs: 1.5, lg: 2.5 },
        p: 2,
        borderRadius: "14px",
        border: 1,
        borderColor: "divider",
        gridTemplateColumns: {
          xs: "repeat(2, minmax(0, 1fr))",
          lg: "90px 110px minmax(100px, 0.9fr) minmax(160px, 1.8fr) 80px auto",
        },
      }}
    >
      <Cell first strong value={orderNumber(order.id)} caption="Order ID" />
      <Cell value={time(order.placedAt)} caption="Time" />
      <Cell value={order.customer || "Customer"} caption="Customer" />
      <Cell
        value={
          order.items.length ? (
            <ItemsSummary items={order.items.map(lineLabel)} />
          ) : (
            order.food
          )
        }
        caption={order.pnr ? `PNR ${order.pnr}` : "Order items"}
        sx={{ gridColumn: { xs: "1 / -1", lg: "auto" } }}
      />
      <Cell strong value={formatRupees(order.amount)} caption="Amount" />
      <Box
        sx={{
          display: "flex",
          gap: 1.25,
          justifyContent: { xs: "stretch", lg: "flex-end" },
          gridColumn: { xs: "1 / -1", lg: "auto" },
          "& > *": { flex: { xs: 1, lg: "none" }, minWidth: { lg: 96 } },
        }}
      >
        {order.state === "New" ? (
          <>
            <CommonButton
              disabled={busy}
              variant="contained"
              onClick={() => act("Accepted")}
            >
              Accept
            </CommonButton>
            <CommonButton
              disabled={busy}
              variant="outlined"
              onClick={() => act("Rejected")}
            >
              Reject
            </CommonButton>
          </>
        ) : order.state === "Accepted" ? (
          <CommonButton
            disabled={busy}
            variant="contained"
            onClick={() => act("Preparing")}
          >
            Start preparing
          </CommonButton>
        ) : order.state === "Preparing" ? (
          <CommonButton
            disabled={busy}
            variant="contained"
            onClick={() => act("Ready")}
          >
            Mark as packed
          </CommonButton>
        ) : order.state === "Ready" ? (
          <CommonButton
            disabled={busy}
            variant="contained"
            onClick={() => act("HandedOver")}
          >
            Handed to the rider
          </CommonButton>
        ) : (
          <Chip
            size="small"
            label={stateLabel[order.state]}
            variant="outlined"
          />
        )}
      </Box>
    </Box>
  );
}
