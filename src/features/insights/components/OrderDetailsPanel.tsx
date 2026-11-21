"use client";
import type { ReactNode } from "react";
import { Box, ButtonBase, Drawer, IconButton, Typography } from "@mui/material";
import CloseRounded from "@mui/icons-material/CloseRounded";
import { tokens } from "@/core/theme/tokens";
import { formatRupees } from "@/shared/utils/format";
import { FoodTypeMark } from "@/shared/components/feedback/FoodTypeMark";
import type { DetailRow } from "../models/orderDetails";
import { panelDetails } from "../models/panelDetails";

const long = (ms: number) =>
    new Date(ms).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
  clock = (ms: number) =>
    new Date(ms)
      .toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true })
      .replace(/\b(am|pm)\b/, (m) => m.toUpperCase());

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Box sx={{ py: 2, borderTop: `1px solid ${tokens.color.borderSubtle}` }}>
      <Typography
        sx={{ mb: 1.25, fontSize: 11, fontWeight: 700, letterSpacing: "0.5px", color: tokens.color.textMuted }}
      >
        {title}
      </Typography>
      {children}
    </Box>
  );
}

function Line({ label, children, rule }: { label: string; children: ReactNode; rule?: boolean }) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 2,
        py: 0.75,
        fontSize: 13,
        ...(rule && { mt: 0.75, pt: 1.5, borderTop: `1px solid ${tokens.color.borderSubtle}` }),
      }}
    >
      <Box component="span" sx={{ color: tokens.color.textMuted }}>
        {label}
      </Box>
      <Box component="span" sx={{ fontWeight: 600, textAlign: "right" }}>
        {children}
      </Box>
    </Box>
  );
}

function Pill({ children, fg, bg }: { children: ReactNode; fg: string; bg: string }) {
  return (
    <Box
      component="span"
      sx={{ px: 1, fontSize: 10, lineHeight: "20px", fontWeight: 700, borderRadius: "6px", color: fg, bgcolor: bg }}
    >
      {children}
    </Box>
  );
}

/**
 * One order in full, in a panel from the right: passenger and train, items,
 * payment and earnings, and the timeline. DESIGN ONLY: worked out from the
 * sample row (see panelDetails); Report an issue and Download invoice do
 * nothing yet.
 */
export function OrderDetailsPanel({ row, onClose }: { row: DetailRow | null; onClose: () => void }) {
  const d = row ? panelDetails(row) : null,
    delivered = row?.status === "DELIVERED";
  return (
    <Drawer
      anchor="right"
      open={!!row}
      onClose={onClose}
      slotProps={{ paper: { sx: { width: { xs: "100%", sm: 400 }, display: "flex", flexDirection: "column" } } }}
    >
      {row && d && (
        <>
          <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1, p: 2.5, pb: 2 }}>
            <Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography component="h2" sx={{ fontSize: 20, fontWeight: 700 }}>
                  Order {row.id}
                </Typography>
                {delivered ? (
                  <Pill fg={tokens.color.success} bg={tokens.color.successBg}>
                    DELIVERED
                  </Pill>
                ) : (
                  <Pill fg={tokens.color.error} bg={tokens.color.errorBg}>
                    UNDELIVERED
                  </Pill>
                )}
              </Box>
              <Typography sx={{ mt: 0.5, fontSize: 12, color: tokens.color.textMuted }}>
                {long(row.at)}, {clock(row.at)}
              </Typography>
            </Box>
            <IconButton aria-label="Close" onClick={onClose} sx={{ bgcolor: tokens.color.muted, borderRadius: "10px" }}>
              <CloseRounded />
            </IconButton>
          </Box>
          <Box sx={{ flex: 1, overflowY: "auto", px: 2.5 }}>
            <Section title="PASSENGER & TRAIN">
              <Line label="Passenger">{d.passenger}</Line>
              <Line label="Phone">{d.phone}</Line>
              <Line label="Train">{row.train}</Line>
              <Line label="Coach · Seat">
                {row.coach} · {row.seat}
              </Line>
              <Line label="Delivery station">{d.deliveryStation}</Line>
            </Section>
            <Section title="ITEMS">
              {d.items.map((item) => (
                <Box key={item.name} sx={{ display: "flex", alignItems: "center", gap: 1, py: 0.5, fontSize: 13 }}>
                  <FoodTypeMark type={item.type} />
                  <Box component="span" sx={{ flex: 1 }}>
                    {item.name} × {item.quantity}
                  </Box>
                  <b>{formatRupees(item.price)}</b>
                </Box>
              ))}
            </Section>
            <Section title="PAYMENT & EARNINGS">
              <Line label="Order value">{formatRupees(row.amount)}</Line>
              <Line label="Payment">
                {row.payment === "COD" ? (
                  <Pill fg="#8a5a00" bg="#fff4d6">
                    COD
                  </Pill>
                ) : (
                  <Pill fg="#1a56b0" bg="#e3ecfb">
                    PREPAID
                  </Pill>
                )}
              </Line>
              {row.payment === "COD" ? (
                <>
                  <Line label="Cash collected by">{row.rider}</Line>
                  <Line label="Cash status">
                    {row.cashStatus === "DEPOSITED" ? (
                      <Pill fg={tokens.color.success} bg={tokens.color.successBg}>
                        DEPOSITED
                      </Pill>
                    ) : (
                      <Pill fg="#8a5a00" bg="#fff4d6">
                        WITH RIDER
                      </Pill>
                    )}
                  </Line>
                </>
              ) : (
                <>
                  <Line label="Method">{row.method}</Line>
                  <Line label="Transaction ID">{row.transactionId}</Line>
                </>
              )}
              <Line label="TrainDhaba fee (20%)">{d.fee ? `−${formatRupees(d.fee)}` : "—"}</Line>
              <Line label="Your earning" rule>
                <Box component="span" sx={{ color: delivered ? tokens.color.success : tokens.color.textMuted }}>
                  {delivered ? formatRupees(d.earning) : "Not paid"}
                </Box>
              </Line>
            </Section>
            <Section title="ORDER TIMELINE">
              {d.timeline.map((step, i) => (
                <Box key={step.label} sx={{ display: "flex", gap: 1.5, position: "relative", pb: 1.25 }}>
                  {i < d.timeline.length - 1 && (
                    <Box sx={{ position: "absolute", left: 4, top: 14, bottom: -2, width: "1.5px", bgcolor: tokens.color.border }} />
                  )}
                  <Box
                    sx={{
                      mt: "5px",
                      width: 9,
                      height: 9,
                      flexShrink: 0,
                      borderRadius: "50%",
                      bgcolor: step.bad ? tokens.color.error : tokens.color.success,
                    }}
                  />
                  <Box
                    sx={{
                      flex: 1,
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 2,
                      fontSize: 13,
                      fontWeight: step.bold ? 700 : 500,
                      color: step.bad ? tokens.color.error : tokens.color.text,
                    }}
                  >
                    <span>{step.label}</span>
                    <Box component="span" sx={{ fontWeight: 400, color: tokens.color.textMuted }}>
                      {clock(step.at)}
                    </Box>
                  </Box>
                </Box>
              ))}
            </Section>
          </Box>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 1.5,
              p: 2.5,
              borderTop: `1px solid ${tokens.color.borderSubtle}`,
            }}
          >
            <ButtonBase
              sx={{ height: 44, fontSize: 14, fontWeight: 700, borderRadius: "10px", border: `1px solid ${tokens.color.borderInput}` }}
            >
              Report an issue
            </ButtonBase>
            <ButtonBase sx={{ height: 44, fontSize: 14, fontWeight: 700, borderRadius: "10px", color: "#fff", bgcolor: tokens.color.primary }}>
              Download invoice
            </ButtonBase>
          </Box>
        </>
      )}
    </Drawer>
  );
}
