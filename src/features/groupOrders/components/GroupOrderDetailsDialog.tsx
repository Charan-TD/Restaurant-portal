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
import { statusLabel, type GroupOrder } from "../models/groupOrder";
const dateTime = (iso?: string) =>
  iso && !Number.isNaN(Date.parse(iso))
    ? new Date(iso).toLocaleString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : undefined;
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
function Field({ label, value }: { label: string; value: ReactNode }) {
  return (
    <Box sx={{ p: 1.25, borderRadius: 2, bgcolor: "#f7f8f6", minWidth: 0 }}>
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
/** A group order's items and details, fetched from its own endpoint when opened. */
export function GroupOrderDetailsDialog({
  order,
  open,
  onClose,
}: {
  order: GroupOrder;
  open: boolean;
  onClose: () => void;
}) {
  const priced = order.items.filter((line) => line.amount != null),
    total = priced.reduce((sum, line) => sum + (line.amount ?? 0), 0),
    fields: [string, ReactNode | undefined][] = [
      ["Contact", order.contactName],
      ["Mobile", order.mobile],
      ["Email", order.email],
      ["Group size", order.groupSize || undefined],
      ["Order placed", dateTime(order.placedAt)],
      [
        "Rider",
        order.rider &&
          [order.rider.name, order.rider.phone].filter(Boolean).join(" · "),
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
          GROUP ORDER
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
            {order.id ?? order.contactName}
          </Typography>
          <Chip
            size="small"
            label={statusLabel[order.status] ?? order.status}
            sx={{
              bgcolor: "common.white",
              color: "primary.main",
              fontWeight: 700,
            }}
          />
        </Box>
      </Box>
      <DialogContent sx={{ px: 3, pt: 0.5, pb: 2.5 }}>
        <Section title="Items ordered">
          {order.items.length ? (
            <Box sx={{ display: "grid", gap: 0.75 }}>
              {order.items.map((line, i) => (
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
                  <Typography sx={{ flex: 1, minWidth: 0, fontWeight: 600 }}>
                    {line.name}
                  </Typography>
                  {line.amount != null && (
                    <Typography sx={{ fontWeight: 500 }}>
                      {formatRupees(line.amount)}
                    </Typography>
                  )}
                </Box>
              ))}
            </Box>
          ) : (
            <Typography color="text.secondary">No items listed.</Typography>
          )}
        </Section>
        {order.details && (
          <Section title="Customer's request">
            <Box
              sx={{
                p: 1.5,
                borderRadius: 2,
                fontSize: 14,
                color: "primary.dark",
                bgcolor: (t) => alpha(t.palette.primary.main, 0.08),
                borderLeft: 3,
                borderColor: "primary.main",
                overflowWrap: "anywhere",
              }}
            >
              {order.details}
            </Box>
          </Section>
        )}
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
        {priced.length > 0 && (
          <Box
            sx={{
              mt: 2.5,
              p: 1.5,
              display: "flex",
              justifyContent: "space-between",
              borderRadius: 2,
              color: "primary.main",
              bgcolor: (t) => alpha(t.palette.primary.main, 0.1),
            }}
          >
            <Typography sx={{ fontWeight: 800 }}>Items total</Typography>
            <Typography sx={{ fontWeight: 800 }}>
              {formatRupees(total)}
            </Typography>
          </Box>
        )}
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
