"use client";
import type { ReactNode } from "react";
import {
  alpha,
  Box,
  Chip,
  Dialog,
  DialogContent,
  Typography,
} from "@mui/material";
import { formatRupees } from "@/shared/utils/format";
import { lineLabel, type Order, type OrderStatus } from "../models/order";
interface Props {
  order: Order;
  open: boolean;
  onClose: () => void;
}
const stateLabel: Record<OrderStatus, string> = {
  New: "New",
  Preparing: "Preparing",
  Ready: "Packed",
  HandedOver: "Out for delivery",
  Delivered: "Delivered",
  Rejected: "Rejected",
};
const validDate = (iso?: string) =>
  iso && !Number.isNaN(Date.parse(iso)) ? new Date(iso) : undefined;
const dateTime = (iso?: string) =>
  validDate(iso)?.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
const dateOnly = (iso?: string) =>
  validDate(iso)?.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Box sx={{ mt: 2.5 }}>
      <Typography
        sx={{
          mb: 1,
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: ".05em",
          textTransform: "uppercase",
          color: "text.secondary",
        }}
      >
        {title}
      </Typography>
      {children}
    </Box>
  );
}
/** A labelled value in the details grid. */
function Field({ label, value }: { label: string; value: ReactNode }) {
  return (
    <Box
      sx={{
        p: 1.25,
        borderRadius: 2,
        bgcolor: "#f7f8f6",
        minWidth: 0,
      }}
    >
      <Typography sx={{ fontSize: 12, color: "text.secondary" }}>
        {label}
      </Typography>
      <Typography
        sx={{ fontSize: 14, fontWeight: 600, overflowWrap: "anywhere" }}
      >
        {value}
      </Typography>
    </Box>
  );
}
function BillRow({
  label,
  amount,
  negative,
}: {
  label: string;
  amount: number;
  negative?: boolean;
}) {
  return (
    <Box sx={{ display: "flex", justifyContent: "space-between" }}>
      <Typography sx={{ fontSize: 14, color: "text.secondary" }}>
        {label}
      </Typography>
      <Typography sx={{ fontSize: 14, fontWeight: 500 }}>
        {negative ? "− " : ""}
        {formatRupees(amount)}
      </Typography>
    </Box>
  );
}
/** Everything the orders API tells us about one order. */
export function OrderDetailsDialog({ order, open, onClose }: Props) {
  const { bill } = order;
  // Only fields the server actually sent are shown.
  const fields: [string, ReactNode | undefined][] = [
    ["Customer", order.customer],
    ["Phone", order.customerPhone],
    ["Train", order.trainName],
    ["PNR", order.pnr],
    ["Coach", order.coach],
    ["Seat", order.seat],
    ["Station", order.stationName],
    ["Journey date", dateOnly(order.journeyDate)],
    ["Order placed", dateTime(order.placedAt)],
    ["Deliver by", dateTime(order.deliveryBy)],
    [
      "Queue time",
      order.queueMinutes ? `${order.queueMinutes} min` : undefined,
    ],
  ];
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      slotProps={{
        paper: {
          onClick: onClose,
          sx: { cursor: "pointer", borderRadius: 3, overflow: "hidden" },
        },
      }}
    >
      <Box
        sx={{
          px: 3,
          py: 2.5,
          bgcolor: "primary.main",
          color: "primary.contrastText",
        }}
      >
        <Typography sx={{ fontSize: 12, opacity: 0.85, fontWeight: 600 }}>
          ORDER
        </Typography>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1,
          }}
        >
          <Typography sx={{ fontSize: 20, fontWeight: 800 }}>
            {order.id}
          </Typography>
          <Chip
            size="small"
            label={stateLabel[order.state]}
            sx={{
              bgcolor: "common.white",
              color: "primary.main",
              fontWeight: 700,
            }}
          />
        </Box>
      </Box>
      <DialogContent sx={{ px: 3, pt: 0.5, pb: 2.5 }}>
        <Section title="Items">
          <Box sx={{ display: "grid", gap: 0.75 }}>
            {order.items.length ? (
              order.items.map((line, i) => (
                <Box
                  key={i}
                  sx={{ display: "flex", alignItems: "center", gap: 1.25 }}
                >
                  <Box
                    sx={{
                      minWidth: 30,
                      textAlign: "center",
                      borderRadius: 1.5,
                      px: 0.75,
                      py: 0.25,
                      fontSize: 13,
                      fontWeight: 700,
                      color: "primary.main",
                      bgcolor: (t) => alpha(t.palette.primary.main, 0.1),
                    }}
                  >
                    {line.quantity}×
                  </Box>
                  <Typography sx={{ fontWeight: 600 }}>
                    {lineLabel({ ...line, quantity: 1 })}
                  </Typography>
                </Box>
              ))
            ) : (
              <Typography color="text.secondary">No items listed.</Typography>
            )}
          </Box>
        </Section>
        <Section title="Details">
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: 1,
            }}
          >
            {fields.map(([label, value]) =>
              value ? <Field key={label} label={label} value={value} /> : null,
            )}
          </Box>
        </Section>
        {order.note && (
          <Section title="Customer note">
            <Box
              sx={{
                p: 1.5,
                borderRadius: 2,
                fontSize: 14,
                color: "primary.dark",
                bgcolor: (t) => alpha(t.palette.primary.main, 0.08),
                borderLeft: 3,
                borderColor: "primary.main",
              }}
            >
              {order.note}
            </Box>
          </Section>
        )}
        <Section title="Bill">
          <Box sx={{ display: "grid", gap: 0.5 }}>
            {bill && (
              <>
                <BillRow label="Subtotal" amount={bill.subtotal} />
                {bill.tax > 0 && <BillRow label="Tax" amount={bill.tax} />}
                {bill.packagingFee > 0 && (
                  <BillRow label="Packaging" amount={bill.packagingFee} />
                )}
                {bill.deliveryFee > 0 && (
                  <BillRow label="Delivery" amount={bill.deliveryFee} />
                )}
                {bill.discount > 0 && (
                  <BillRow label="Discount" amount={bill.discount} negative />
                )}
              </>
            )}
            <Box
              sx={{
                mt: 0.75,
                p: 1.5,
                display: "flex",
                justifyContent: "space-between",
                borderRadius: 2,
                color: "primary.main",
                bgcolor: (t) => alpha(t.palette.primary.main, 0.1),
              }}
            >
              <Typography sx={{ fontWeight: 800 }}>Total</Typography>
              <Typography sx={{ fontWeight: 800 }}>
                {formatRupees(order.amount)}
              </Typography>
            </Box>
          </Box>
        </Section>
        <Typography
          sx={{
            mt: 2,
            textAlign: "center",
            fontSize: 12.5,
            color: "text.secondary",
          }}
        >
          Click anywhere to close
        </Typography>
      </DialogContent>
    </Dialog>
  );
}
