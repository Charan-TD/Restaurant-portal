"use client";
import { useState, type ReactNode } from "react";
import { Box, Typography } from "@mui/material";
import { Hint } from "@/shared/components/feedback/Hint";
import { CommonButton } from "@/shared/components/actions/CommonButton";
import { AssignRiderDialog } from "@/features/riders/components/AssignRiderDialog";
import { PreparingAction } from "@/features/riders/components/PreparingAction";
import {
  DeliveryStatus,
  trainDhabaNote,
} from "@/features/riders/components/DeliveryStatus";
import type { PickedRider } from "@/features/riders/viewmodels/usePickedRiders";
import { statusLabel, type GroupOrder } from "../models/groupOrder";
import { GroupOrderDetailsDialog } from "./GroupOrderDetailsDialog";
/** Column template shared by the heading row and every group order row. */
export const groupOrderGrid =
  "minmax(150px, 1.2fr) minmax(120px, 1fr) minmax(170px, 1.4fr) minmax(80px, 0.6fr) minmax(220px, 2.4fr) minmax(190px, 1fr)";
const headings = [
  "Contact",
  "Mobile",
  "Email",
  "Group size",
  "Order details",
  "Action",
];
/** The column headings, shown once above a list of group orders. */
export function GroupOrderHeadings() {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: groupOrderGrid,
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
      {headings.map((heading) => (
        <span key={heading}>{heading}</span>
      ))}
    </Box>
  );
}
function Cell({ children, strong }: { children: ReactNode; strong?: boolean }) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography
        component="div"
        sx={{
          fontSize: 13.5,
          fontWeight: strong ? 700 : 500,
          lineHeight: 1.4,
          overflowWrap: "anywhere",
        }}
      >
        {children}
      </Typography>
    </Box>
  );
}
const dash = (
  <Box component="span" sx={{ color: "text.disabled" }}>
    –
  </Box>
);
const chipColor = (status: string) =>
  status === "DELIVERED"
    ? "success"
    : status === "REJECTED" || status === "FAILED"
      ? "error"
      : "default";
/**
 * The restaurant's next step after preparing, with its own riders. With
 * TrainDhaba riders the rider takes these steps from the rider app.
 */
const nextStep: Record<
  string,
  { to: string; label: string; hint: string } | undefined
> = {
  READY: {
    to: "OUT_FOR_DELIVERY",
    label: "Picked up by rider",
    hint: "The rider has picked up this order",
  },
  OUT_FOR_DELIVERY: {
    to: "DELIVERED",
    label: "Mark as delivered",
    hint: "The rider delivered the order to the customer",
  },
};
/** Steps after acceptance; anything else not closed is still new. */
const accepted = ["PREPARING", "READY", "OUT_FOR_DELIVERY"];
const closed = ["DELIVERED", "REJECTED", "FAILED"];
/** One group order as a row, laid out and updated like a live order. */
export function GroupOrderCard({
  order,
  busy,
  onChange,
  onAssignRider,
  trainDhabaRiders,
  readOnly,
}: {
  order: GroupOrder;
  busy?: boolean;
  onChange?: (order: GroupOrder, status: string, rider?: PickedRider) => void;
  /** Assigns the rider while the order is being prepared. */
  onAssignRider?: (order: GroupOrder, rider: PickedRider) => void;
  /**
   * Set when TrainDhaba's riders deliver for this restaurant: the rider
   * search starts on accepting, and once the order is ready the rider
   * updates it (picked up, delivered) from the rider app.
   */
  trainDhabaRiders?: boolean;
  /** Show the order's status instead of its action buttons. */
  readOnly?: boolean;
}) {
  // What the rider dialog is open for: assigning while preparing, or a
  // handover with no rider known (e.g. the order was packed on another device).
  const [assignFor, setAssignFor] = useState<
    "PREPARING" | "OUT_FOR_DELIVERY" | null
  >(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  /** Marking it picked up sends the rider assigned while preparing. */
  const advance = (to: string) =>
    to === "OUT_FOR_DELIVERY" && !order.rider?.id
      ? setAssignFor("OUT_FOR_DELIVERY")
      : onChange?.(order, to, order.rider);
  const next = nextStep[order.status],
    // The first step: anything not yet accepted and not closed. The server
    // has the final say on whether the order can still be accepted.
    isNew =
      !accepted.includes(order.status) && !closed.includes(order.status);
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
        gridTemplateColumns: groupOrderGrid,
      }}
    >
      <Cell strong>{order.contactName}</Cell>
      <Cell>{order.mobile || dash}</Cell>
      <Cell>{order.email || dash}</Cell>
      <Cell strong>{order.groupSize || dash}</Cell>
      <Cell>
        <Box
          component="span"
          title={order.details}
          sx={{
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {order.details || dash}
        </Box>
        {order.id && (
          <Box
            component="button"
            type="button"
            onClick={() => setDetailsOpen(true)}
            sx={{
              display: "block",
              p: 0,
              border: 0,
              bgcolor: "transparent",
              cursor: "pointer",
              color: "primary.main",
              fontSize: 12.5,
              fontWeight: 700,
              "&:hover": { textDecoration: "underline" },
            }}
          >
            View items
          </Box>
        )}
      </Cell>
      <Box
        sx={{
          display: "flex",
          gap: 1,
          justifyContent: "flex-start",
          "& > *": { minWidth: 88 },
        }}
      >
        {readOnly || closed.includes(order.status) ? (
          <DeliveryStatus
            label={statusLabel[order.status] ?? order.status}
            color={chipColor(order.status)}
            rider={
              order.status === "REJECTED" || order.status === "FAILED"
                ? undefined
                : order.rider
            }
          />
        ) : isNew ? (
          <>
            <Hint title="Accept this order and start preparing it">
              <CommonButton
                sx={{ flex: 1 }}
                disabled={busy}
                variant="contained"
                onClick={() => onChange?.(order, "PREPARING")}
              >
                Accept
              </CommonButton>
            </Hint>
            <Hint title="Cancel this order">
              <CommonButton
                sx={{ flex: 1 }}
                disabled={busy}
                variant="outlined"
                onClick={() => onChange?.(order, "REJECTED")}
              >
                Reject
              </CommonButton>
            </Hint>
          </>
        ) : order.status === "PREPARING" ? (
          <PreparingAction
            rider={order.rider}
            busy={busy}
            onAssign={() => setAssignFor("PREPARING")}
            onReady={() =>
              onChange?.(
                order,
                "READY",
                trainDhabaRiders ? undefined : order.rider,
              )
            }
            trainDhabaRiders={trainDhabaRiders}
          />
        ) : trainDhabaRiders ? (
          // The TrainDhaba rider updates the order from here on.
          <DeliveryStatus
            label={
              order.status === "READY" ? "Awaiting pickup" : "Out for delivery"
            }
            color="info"
            rider={order.rider}
            note={trainDhabaNote(
              order.status === "READY" ? "ready" : "pickedUp",
              order.rider,
            )}
          />
        ) : next ? (
          <Box sx={{ flex: 1, display: "grid", gap: 0.5 }}>
            <Hint title={next.hint}>
              <CommonButton
                disabled={busy}
                variant="contained"
                onClick={() => advance(next.to)}
              >
                {next.label}
              </CommonButton>
            </Hint>
            {order.rider && (
              <Typography
                noWrap
                color="text.secondary"
                title={order.rider.phone}
                sx={{ fontSize: 12.5 }}
              >
                Rider: {order.rider.name}
              </Typography>
            )}
          </Box>
        ) : null}
      </Box>
      <GroupOrderDetailsDialog
        order={order}
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
      />
      <AssignRiderDialog
        open={!!assignFor}
        orderLabel={order.contactName}
        confirmLabel={
          assignFor === "PREPARING" ? "Assign rider" : "Assign and mark picked up"
        }
        busy={busy}
        onClose={() => setAssignFor(null)}
        onAssign={(rider) => {
          const picked = {
            id: rider.id,
            name: rider.name,
            phone: rider.phone,
          };
          if (assignFor === "PREPARING") onAssignRider?.(order, picked);
          else if (assignFor) onChange?.(order, assignFor, picked);
          setAssignFor(null);
        }}
      />
    </Box>
  );
}
