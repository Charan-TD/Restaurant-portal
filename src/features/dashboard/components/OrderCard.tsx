"use client";
import { useState, type ReactNode } from "react";
import { Box, Typography } from "@mui/material";
import { ItemsSummary } from "@/shared/components/feedback/ItemsSummary";
import { Hint } from "@/shared/components/feedback/Hint";
import { CommonButton } from "@/shared/components/actions/CommonButton";
import { DEMO_MODE } from "@/core/constants/config";
import { useGetOrderQuery } from "../services/orderApi";
import { formatRupees } from "@/shared/utils/format";
import {
  lineLabel,
  stateLabel,
  type Order,
  type OrderRider,
  type OrderStatus,
} from "../models/order";
import { AssignRiderDialog } from "@/features/riders/components/AssignRiderDialog";
import { PreparingAction } from "@/features/riders/components/PreparingAction";
import {
  DeliveryStatus,
  trainDhabaNote,
} from "@/features/riders/components/DeliveryStatus";
import { OrderDetailsDialog } from "./OrderDetailsDialog";
interface Props {
  order: Order;
  busy?: boolean;
  onChange?: (
    id: string,
    status: OrderStatus,
    rider?: OrderRider,
  ) => Promise<void>;
  /** Assigns the rider while the order is being prepared. */
  onAssignRider?: (id: string, rider: OrderRider) => void;
  /**
   * Set when TrainDhaba's riders deliver for this restaurant: the rider
   * search starts on accepting, and once the order is ready the rider
   * updates it (picked up, delivered) from the rider app.
   */
  trainDhabaRiders?: boolean;
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
        hour12: false,
      })
    : "–";
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
export function OrderCard({
  order: listed,
  busy,
  onChange,
  onAssignRider,
  trainDhabaRiders,
  readOnly,
}: Props) {
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
          rider: detail.rider ?? listed.rider,
        }
      : listed;
  const [detailsOpen, setDetailsOpen] = useState(false),
    // What the rider dialog is open for: assigning while preparing, or a
    // handover with no rider known (e.g. the order was packed on another device).
    [assignFor, setAssignFor] = useState<"Preparing" | "HandedOver" | null>(
      null,
    );
  const act = (status: OrderStatus) => void onChange?.(order.id, status),
    riderLine = order.rider && (
      <Typography
        noWrap
        color="text.secondary"
        title={order.rider.phone}
        sx={{ fontSize: 12.5 }}
      >
        Rider: {order.rider.name}
      </Typography>
    );
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
      <AssignRiderDialog
        open={!!assignFor}
        orderLabel={orderNumber(order.id)}
        confirmLabel={
          assignFor === "Preparing" ? "Assign rider" : "Assign and mark picked up"
        }
        busy={busy}
        onClose={() => setAssignFor(null)}
        onAssign={(rider) => {
          const picked = {
            id: rider.id,
            name: rider.name,
            phone: rider.phone,
          };
          if (assignFor === "Preparing") onAssignRider?.(order.id, picked);
          else if (assignFor) void onChange?.(order.id, assignFor, picked);
          setAssignFor(null);
        }}
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
          <DeliveryStatus
            label={stateLabel[order.state]}
            color={
              order.state === "Delivered"
                ? "success"
                : order.state === "Rejected"
                  ? "error"
                  : "default"
            }
            rider={order.state === "Rejected" ? undefined : order.rider}
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
          <PreparingAction
            rider={order.rider}
            busy={busy}
            onAssign={() => setAssignFor("Preparing")}
            onReady={() =>
              void onChange?.(
                order.id,
                "Ready",
                trainDhabaRiders ? undefined : order.rider,
              )
            }
            trainDhabaRiders={trainDhabaRiders}
          />
        ) : trainDhabaRiders ? (
          // The TrainDhaba rider updates the order from here on.
          <DeliveryStatus
            label={
              order.state === "Ready" ? "Awaiting pickup" : "Out for delivery"
            }
            color="info"
            rider={order.rider}
            note={trainDhabaNote(
              order.state === "Ready" ? "ready" : "pickedUp",
              order.rider,
            )}
          />
        ) : order.state === "Ready" ? (
          <Box sx={{ flex: 1, display: "grid", gap: 0.5 }}>
            <Hint title="The rider has picked up this order">
              <CommonButton
                disabled={busy}
                variant="contained"
                onClick={() =>
                  order.rider?.id
                    ? void onChange?.(order.id, "HandedOver", order.rider)
                    : setAssignFor("HandedOver")
                }
              >
                Picked up by rider
              </CommonButton>
            </Hint>
            {riderLine}
          </Box>
        ) : (
          <Box sx={{ flex: 1, display: "grid", gap: 0.5 }}>
            <Hint title="The rider delivered the order to the customer">
              <CommonButton
                disabled={busy}
                variant="contained"
                onClick={() => act("Delivered")}
              >
                Mark as delivered
              </CommonButton>
            </Hint>
            {riderLine}
          </Box>
        )}
      </Box>
    </Box>
  );
}
