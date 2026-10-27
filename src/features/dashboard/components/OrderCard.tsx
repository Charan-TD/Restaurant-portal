"use client";
import { useState, type ReactNode } from "react";
import { Box, Chip, Typography } from "@mui/material";
import { ItemsSummary } from "@/shared/components/feedback/ItemsSummary";
import { Hint } from "@/shared/components/feedback/Hint";
import { CommonButton } from "@/shared/components/actions/CommonButton";
import { DEMO_MODE } from "@/core/constants/config";
import { useGetOrderQuery } from "../services/orderApi";
import { formatRupees } from "@/shared/utils/format";
import { lineLabel, type Order, type OrderStatus } from "../models/order";
import { OrderDetailsDialog } from "./OrderDetailsDialog";
interface Props {
  order: Order;
  busy?: boolean;
  onChange?: (id: string, status: OrderStatus) => Promise<void>;
  /** Show the order's status instead of its action buttons, with the date it was placed. */
  readOnly?: boolean;
}
const day = (iso?: string) =>
  iso && !Number.isNaN(Date.parse(iso))
    ? new Date(iso).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
      })
    : "";
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
  Preparing: "Preparing",
  Ready: "Packed",
  HandedOver: "Out for delivery",
  Delivered: "Delivered",
  Rejected: "Rejected",
};
/** Column template shared by the heading row and every order row. */
export const orderGrid =
  "minmax(84px, 0.7fr) minmax(84px, 0.7fr) minmax(150px, 1.3fr) minmax(120px, 1fr) minmax(170px, 2fr) minmax(130px, 1.3fr) minmax(80px, 0.7fr) minmax(190px, 1fr)";
/** The column headings, shown once above a list of order rows. */
export function OrderListHeadings() {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: orderGrid,
        gap: 2.5,
        px: "17px",
        py: 1,
        borderRadius: "10px",
        bgcolor: "#f3f4f2",
        color: "text.secondary",
        fontSize: 12,
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: ".04em",
      }}
    >
      {[
        "Order ID",
        "Time",
        "Customer",
        "Contact",
        "Items",
        "Customer note",
        "Amount",
        "Action",
      ].map((heading, i) => (
        <span key={i}>{heading}</span>
      ))}
    </Box>
  );
}
/** One column of a row; the headings live in the single row above the list. */
function Cell({
  value,
  strong,
  sx,
}: {
  value: ReactNode;
  strong?: boolean;
  sx?: object;
}) {
  return (
    <Box sx={{ minWidth: 0, ...sx }}>
      <Typography
        component="div"
        sx={{
          fontSize: 13.5,
          fontWeight: strong ? 700 : 500,
          lineHeight: 1.4,
        }}
      >
        {value}
      </Typography>
    </Box>
  );
}
/** One order as a row: id, time, customer, items, amount and its next action. */
export function OrderCard({ order: listed, busy, onChange, readOnly }: Props) {
  // The list response has no items, so they come from the order's own endpoint.
  const { data: detail } = useGetOrderQuery(listed.id, {
      skip: DEMO_MODE || listed.items.length > 0,
    }),
    // The detail carries what the list lacks: items, and possibly names and times.
    order: Order = detail
      ? {
          ...listed,
          items: detail.items.length ? detail.items : listed.items,
          food: detail.items.length ? detail.food : listed.food,
          customer: detail.customer ?? listed.customer,
          customerPhone: detail.customerPhone ?? listed.customerPhone,
          trainName: detail.trainName ?? listed.trainName,
          trainNumber: detail.trainNumber ?? listed.trainNumber,
          coach: detail.coach ?? listed.coach,
          seat: detail.seat ?? listed.seat,
          stationName: detail.stationName ?? listed.stationName,
          deliveryBy: detail.deliveryBy ?? listed.deliveryBy,
          pnr: detail.pnr ?? listed.pnr,
          note: detail.note ?? listed.note,
        }
      : listed;
  const [detailsOpen, setDetailsOpen] = useState(false);
  const act = (status: OrderStatus) => void onChange?.(order.id, status);
  return (
    <Box
      sx={{
        display: "grid",
        alignItems: "center",
        gap: 2.5,
        px: 2,
        py: 1.25,
        borderRadius: "12px",
        border: 1,
        borderColor: "divider",
        bgcolor: "background.paper",
        transition: "box-shadow .15s, border-color .15s",
        "&:hover": {
          borderColor: "primary.light",
          boxShadow: "0 2px 10px rgba(0,0,0,.06)",
        },
        gridTemplateColumns: orderGrid,
      }}
    >
      <Cell strong value={orderNumber(order.id)} />
      <Cell
        value={
          <>
            {time(order.placedAt)}
            {readOnly && day(order.placedAt) && (
              <Typography color="text.secondary" sx={{ fontSize: 12.5 }}>
                {day(order.placedAt)}
              </Typography>
            )}
          </>
        }
      />
      <Cell
        value={
          <>
            <Typography
              noWrap
              title={order.customerId}
              sx={{ fontSize: 13.5, fontWeight: 600 }}
            >
              {order.customer ||
                (order.customerId ? order.customerId.slice(0, 8) : "–")}
            </Typography>
            {[
              order.trainName,
              [order.coach, order.seat].filter(Boolean).join("/") &&
                `Seat ${[order.coach, order.seat].filter(Boolean).join("/")}`,
              order.pnr && `PNR ${order.pnr}`,
            ]
              .filter(Boolean)
              .map((line) => (
                <Typography
                  key={line}
                  noWrap
                  color="text.secondary"
                  sx={{ fontSize: 12.5 }}
                >
                  {line}
                </Typography>
              ))}
          </>
        }
      />
      <Cell value={order.customerPhone ?? "–"} />
      <Cell
        value={
          <Box
            role="button"
            tabIndex={0}
            title="View order details"
            onClick={() => setDetailsOpen(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") setDetailsOpen(true);
            }}
            sx={{
              cursor: "pointer",
              "&:hover .view": { textDecoration: "underline" },
            }}
          >
            {order.items.length ? (
              <ItemsSummary items={order.items.map(lineLabel)} />
            ) : (
              order.food
            )}
            <Typography
              className="view"
              sx={{
                fontSize: 12.5,
                fontWeight: 600,
                color: "primary.main",
              }}
            >
              View details
            </Typography>
          </Box>
        }
        sx={{ gridColumn: "auto" }}
      />
      <Cell
        value={
          order.note || (
            <Box component="span" sx={{ color: "text.disabled" }}>
              –
            </Box>
          )
        }
      />
      <Cell strong value={formatRupees(order.amount)} />
      <OrderDetailsDialog
        order={order}
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
      />
      <Box
        sx={{
          display: "flex",
          gap: 1,
          justifyContent: "flex-start",
          "& > *": { minWidth: 88 },
        }}
      >
        {readOnly ||
        order.state === "Delivered" ||
        order.state === "Rejected" ? (
          <Chip
            size="small"
            label={stateLabel[order.state]}
            color={
              order.state === "Delivered"
                ? "success"
                : order.state === "Rejected"
                  ? "error"
                  : "default"
            }
            variant="outlined"
          />
        ) : order.state === "New" ? (
          <>
            <Hint title="Accept this order and start preparing it">
              <CommonButton
                sx={{ flex: 1 }}
                disabled={busy}
                variant="contained"
                onClick={() => act("Preparing")}
              >
                Accept
              </CommonButton>
            </Hint>
            <Hint title="Cancel this order">
              <CommonButton
                sx={{ flex: 1 }}
                disabled={busy}
                variant="outlined"
                onClick={() => act("Rejected")}
              >
                Reject
              </CommonButton>
            </Hint>
          </>
        ) : order.state === "Preparing" ? (
          <Hint title="The food is packed and ready for the rider">
            <CommonButton
              sx={{ flex: 1 }}
              disabled={busy}
              variant="contained"
              onClick={() => act("Ready")}
            >
              Mark as packed
            </CommonButton>
          </Hint>
        ) : order.state === "Ready" ? (
          <Hint title="The rider has collected this order">
            <CommonButton
              sx={{ flex: 1 }}
              disabled={busy}
              variant="contained"
              onClick={() => act("HandedOver")}
            >
              Handed to the rider
            </CommonButton>
          </Hint>
        ) : (
          <Hint title="The order reached the customer">
            <CommonButton
              sx={{ flex: 1 }}
              disabled={busy}
              variant="contained"
              onClick={() => act("Delivered")}
            >
              Mark as delivered
            </CommonButton>
          </Hint>
        )}
      </Box>
    </Box>
  );
}
