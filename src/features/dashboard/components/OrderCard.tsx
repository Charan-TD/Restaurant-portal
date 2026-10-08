"use client";
import { Chip, Typography } from "@mui/material";
import { CommonButton } from "@/shared/components/actions/CommonButton";
import type { Order, OrderStatus } from "../models/order";
interface Props {
  order: Order;
  busy: boolean;
  onChange: (id: string, status: OrderStatus) => Promise<void>;
}
export function OrderCard({ order, busy, onChange }: Props) {
  return (
    <div className="order">
      <div>
        <strong>
          {order.id} · {order.food}
        </strong>
        <Typography variant="body2" color="text.secondary">
          {order.station}
        </Typography>
      </div>
      <Chip label={order.state} />
      <strong>₹{order.amount}</strong>
      {order.state === "New" ? (
        <>
          <CommonButton
            disabled={busy}
            variant="contained"
            onClick={() => void onChange(order.id, "Accepted")}
          >
            Accept
          </CommonButton>
          <CommonButton
            disabled={busy}
            onClick={() => void onChange(order.id, "Rejected")}
          >
            Reject
          </CommonButton>
        </>
      ) : order.state === "Accepted" ? (
        <CommonButton
          disabled={busy}
          variant="outlined"
          onClick={() => void onChange(order.id, "Ready")}
        >
          Mark ready
        </CommonButton>
      ) : null}
    </div>
  );
}
