"use client";
import { useState } from "react";
import { CommonButton } from "@/shared/components/actions/CommonButton";
import { AssignRiderDialog } from "@/features/riders/components/AssignRiderDialog";
import type { PickedRider } from "@/features/riders/viewmodels/usePickedRiders";
import { canStart, readyAt, startAt, type GroupOrder } from "../models/groupOrder";
import { clock, weekday } from "./groupOrderFormat";

export interface GroupOrderHandlers {
  busy?: boolean;
  /** True when the restaurant's own riders deliver; false with TrainDhaba riders. */
  own: boolean;
  onChange: (order: GroupOrder, status: string, rider?: PickedRider) => void;
  onAssignRider: (order: GroupOrder, rider: PickedRider) => void;
}

/** The next step for an order: its button (if the restaurant takes it) and the line beside it. */
export function nextStep(order: GroupOrder, now: number, own: boolean) {
  const ready = readyAt(order),
    start = startAt(order),
    rider = order.rider;
  switch (order.status) {
    case "ASSIGNED":
      return canStart(order, now)
        ? { label: "Start preparing", to: "PREPARING", hint: "Start now to be ready on time" }
        : {
            label: "Start preparing",
            waitLabel: `Start preparing at ${clock(start!)}`,
            disabled: true,
            hint: "You can start 2 hours before ready time",
          };
    case "PREPARING":
      return {
        label: "Mark food ready",
        to: "READY",
        // The restaurant's own rider is chosen before the food is ready.
        needsRider: own && !rider,
        hint: ready ? `Food due by ${clock(ready)}` : "Mark it ready when every meal is packed",
      };
    case "READY":
      return own
        ? {
            label: rider ? `Handed to ${rider.name.split(/\s+/)[0]}` : "Handed to rider",
            to: "OUT_FOR_DELIVERY",
            // No rider known (e.g. chosen on another device): choose one now instead of being stuck.
            needsRider: !rider,
            hint: rider ? `${rider.name} is picking it up` : "Choose the rider who picks it up",
          }
        : { hint: rider ? `${rider.name} (TrainDhaba) is picking it up` : "A TrainDhaba rider will pick it up" };
    case "OUT_FOR_DELIVERY":
      return own
        ? { label: "Mark delivered", to: "DELIVERED", hint: rider ? `With ${rider.name}` : "With the rider" }
        : { hint: "With the TrainDhaba rider" };
    case "DELIVERED":
      return { hint: "Delivered to the passengers" };
    case "REJECTED":
      return { hint: "This order was rejected" };
    case "FAILED":
      return { hint: "This order could not be delivered" };
    default:
      return { hint: start ? `From ${clock(start)}, ${weekday(start)}` : "" };
  }
}

/**
 * The buttons that move an order on, shared by the card and the details panel:
 * Choose rider while preparing (own riders), and the next step. A step that
 * needs a rider and has none opens the rider list first.
 */
export function GroupOrderActions({
  order,
  now,
  busy,
  own,
  onChange,
  onAssignRider,
  wide,
}: GroupOrderHandlers & {
  order: GroupOrder;
  now: number;
  /** In the details panel: the button fills the row and says when it unlocks. */
  wide?: boolean;
}) {
  const [picking, setPicking] = useState<"assign" | "step" | null>(null),
    step = nextStep(order, now, own),
    chooseRider = own && order.status === "PREPARING";
  return (
    <>
      {chooseRider && (
        <CommonButton variant="outlined" disabled={busy} onClick={() => setPicking("assign")}>
          {order.rider ? "Change rider" : "Choose rider"}
        </CommonButton>
      )}
      {step.label && (
        <CommonButton
          variant="contained"
          disabled={busy || step.disabled}
          onClick={() => {
            if (step.needsRider) setPicking("step");
            else if (step.to) onChange(order, step.to, order.rider);
          }}
          sx={wide ? { flex: 1 } : undefined}
        >
          {wide && step.waitLabel ? step.waitLabel : step.label}
        </CommonButton>
      )}
      <AssignRiderDialog
        open={!!picking}
        orderLabel={order.id ?? "Group order"}
        confirmLabel={picking === "step" ? `Choose rider and ${step.label?.toLowerCase()}` : "Choose rider"}
        busy={busy}
        onClose={() => setPicking(null)}
        onAssign={(r) => {
          const rider = { id: r.id, name: r.name, phone: r.phone };
          if (picking === "step" && step.to) onChange(order, step.to, rider);
          else onAssignRider(order, rider);
          setPicking(null);
        }}
      />
    </>
  );
}
