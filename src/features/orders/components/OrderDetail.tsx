"use client";
import { useState, type ReactNode } from "react";
import { Box, ButtonBase, Typography } from "@mui/material";
import AccessTimeOutlined from "@mui/icons-material/AccessTimeOutlined";
import AddRounded from "@mui/icons-material/AddRounded";
import CallOutlined from "@mui/icons-material/CallOutlined";
import PrintOutlined from "@mui/icons-material/PrintOutlined";
import RemoveRounded from "@mui/icons-material/RemoveRounded";
import TwoWheelerOutlined from "@mui/icons-material/TwoWheelerOutlined";
import { cardSx, tokens } from "@/core/theme/tokens";
import { formatRupees } from "@/shared/utils/format";
import { FoodTypeMark } from "@/shared/components/feedback/FoodTypeMark";
import { orderNumber } from "@/features/dashboard/components/OrderCard";
import { stateLabel, type Order } from "@/features/dashboard/models/order";
import { AssignRiderDialog } from "@/features/riders/components/AssignRiderDialog";
import type { OrdersWorkspace } from "../viewmodels/useOrdersWorkspace";
import { ago } from "./OrderList";

const clock = (ms: number) =>
    new Date(ms).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false }),
  stamp = (iso?: string) => {
    const at = Date.parse(iso ?? "");
    return at
      ? `${new Date(at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} · ${clock(at)}`
      : "";
  },
  mmss = (ms: number) => {
    const total = Math.max(0, Math.floor(ms / 1000));
    return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
  };

const badge: Record<string, { fg: string; bg: string }> = {
  New: { fg: tokens.color.info, bg: tokens.color.infoBg },
  Preparing: { fg: "#8a5a00", bg: "#fff4d6" },
  Ready: { fg: tokens.color.success, bg: tokens.color.successBg },
};

const box = {
  display: "flex",
  alignItems: "center",
  gap: 1.5,
  p: 1.5,
  borderRadius: "12px",
  border: `1px solid ${tokens.color.border}`,
  bgcolor: tokens.color.card,
} as const;

/** A round icon at the start of a bar. */
const Disc = ({ children, tint }: { children: ReactNode; tint?: string }) => (
  <Box
    sx={{
      width: 34,
      height: 34,
      flexShrink: 0,
      display: "grid",
      placeItems: "center",
      borderRadius: "50%",
      color: tokens.color.textMuted,
      bgcolor: tint ?? tokens.color.page,
      border: `1px solid ${tokens.color.border}`,
    }}
  >
    {children}
  </Box>
);

/** A bar of the footer: icon, a title with its line, and something at the right. */
function Bar({
  icon,
  title,
  note,
  end,
  sx,
}: {
  icon: ReactNode;
  title: string;
  note: ReactNode;
  end?: ReactNode;
  sx?: object;
}) {
  return (
    <Box sx={{ ...box, ...sx }}>
      {icon}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontSize: 13, fontWeight: 700 }}>{title}</Typography>
        <Typography sx={{ fontSize: 11, color: tokens.color.textMuted }}>{note}</Typography>
      </Box>
      {end}
    </Box>
  );
}

const big = (bg: string, color = "#fff") => ({
  height: 48,
  borderRadius: "10px",
  fontSize: 14,
  fontWeight: 700,
  color,
  bgcolor: bg,
  "&.Mui-disabled": { opacity: 0.6, color },
});

/** Opens a print window with a small kitchen order ticket. */
function printKot(order: Order) {
  const win = window.open("", "_blank", "width=380,height=600");
  if (!win) return;
  const esc = (v: string) => v.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c] ?? c);
  win.document.write(
    `<title>KOT ${esc(orderNumber(order.id))}</title><body style="font:14px sans-serif;padding:16px"><h2>${esc(orderNumber(order.id))}</h2><p>${esc(
      [order.trainNumber, order.trainName, order.coach, order.seat].filter(Boolean).join(" · "),
    )}</p><hr>${order.items
      .map((i) => `<p><b>${i.quantity} ×</b> ${esc(i.name)}${i.note ? `<br><i>Note: ${esc(i.note)}</i>` : ""}</p>`)
      .join("")}${order.note ? `<hr><p>Note: ${esc(order.note)}</p>` : ""}</body>`,
  );
  win.document.close();
  win.print();
}

function Info({ label, value, sub, late }: { label: string; value?: string; sub?: string; late?: boolean }) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography sx={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.4px", color: tokens.color.textMuted }}>
        {label}
      </Typography>
      <Typography sx={{ fontSize: 13, fontWeight: 700 }}>{value || "–"}</Typography>
      {sub && (
        <Typography sx={{ fontSize: 11, color: late ? tokens.color.error : tokens.color.textMuted }}>{sub}</Typography>
      )}
    </Box>
  );
}

/** The order open on the right: what was ordered, then what to do next. */
export function OrderDetail({ ws, now }: { ws: OrdersWorkspace; now: number }) {
  const order = ws.open,
    [prep, setPrep] = useState(15),
    [picking, setPicking] = useState(false),
    busy = !!order && ws.busyId === order.id;
  if (!order)
    return (
      <Box sx={{ ...cardSx, p: 4, display: "grid", placeItems: "center", color: tokens.color.textMuted, fontSize: 14, minHeight: 320 }}>
        Pick an order to see its details.
      </Box>
    );
  const tone = badge[order.state],
    own = !ws.trainDhabaRiders,
    prepMinutes = order.prepMinutes ?? 15,
    deadline = Date.parse(order.acceptedAt ?? "") + prepMinutes * 60000,
    left = Number.isFinite(deadline) ? deadline - now : prepMinutes * 60000,
    arrival = Date.parse(order.deliveryBy ?? ""),
    arrives = arrival ? clock(arrival) : "",
    count = order.items.length || 1,
    code = order.stationName?.split(/\s+/)[0]?.toUpperCase();
  const rider = order.rider;
  return (
    <Box sx={{ ...cardSx, p: 2, display: "flex", flexDirection: "column", gap: 1.5, minHeight: 560 }}>
      {/* Order number, status, when, and the ticket */}
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 2,
          p: 1.75,
          borderRadius: "12px",
          bgcolor: tokens.color.page,
        }}
      >
        <Box sx={{ flex: 1, minWidth: 200 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography sx={{ fontSize: 22, lineHeight: "28px", fontWeight: 700, color: tokens.color.primary }}>
              {orderNumber(order.id)}
            </Typography>
            <Box
              component="span"
              sx={{
                px: 0.75,
                fontSize: 10,
                lineHeight: "16px",
                fontWeight: 700,
                borderRadius: "4px",
                textTransform: "uppercase",
                color: tone?.fg ?? tokens.color.textMuted,
                bgcolor: tone?.bg ?? tokens.color.muted,
              }}
            >
              {stateLabel[order.state]}
            </Box>
          </Box>
          <Typography sx={{ fontSize: 12, color: tokens.color.textMuted }}>
            {count} {count === 1 ? "item" : "items"} for {formatRupees(order.amount)}
            {order.customer ? ` · ${order.customer}` : ""}
          </Typography>
        </Box>
        <Typography sx={{ fontSize: 12 }}>
          {order.state === "New" ? "Placed" : stateLabel[order.state]} {stamp(order.placedAt)}
        </Typography>
        <ButtonBase
          onClick={() => printKot(order)}
          sx={{
            gap: 0.75,
            height: 36,
            px: 1.75,
            fontSize: 13,
            fontWeight: 600,
            borderRadius: "10px",
            bgcolor: tokens.color.card,
            border: `1px solid ${tokens.color.borderInput}`,
          }}
        >
          <PrintOutlined sx={{ fontSize: 18 }} />
          Print KOT
        </ButtonBase>
      </Box>
      {/* Passenger, train, seat and where it goes */}
      <Box
        sx={{
          ...box,
          display: "grid",
          gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" },
          gap: 2,
          alignItems: "start",
        }}
      >
        <Info label="PASSENGER" value={order.customer} />
        <Info label="TRAIN" value={[order.trainNumber, order.trainName].filter(Boolean).join(" ")} />
        <Info label="COACH · SEAT" value={[order.coach, order.seat].filter(Boolean).join(" · ")} />
        <Info label="DELIVER AT" value={order.stationName} sub={arrives ? `Arrives ${arrives}` : undefined} />
      </Box>
      {/* The dishes */}
      {order.items.map((item, i) => (
        <Box key={i} sx={{ ...box, alignItems: "flex-start", justifyContent: "space-between" }}>
          <Box sx={{ minWidth: 0 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              {item.type && <FoodTypeMark type={item.type} />}
              <Typography sx={{ fontSize: 14, fontWeight: 600 }}>
                {item.quantity > 1 ? `${item.quantity} × ` : ""}
                {item.name}
              </Typography>
            </Box>
            {item.category && (
              <Typography sx={{ mt: 0.5, fontSize: 10, fontWeight: 600, letterSpacing: "0.4px", color: tokens.color.textMuted }}>
                {item.category.toUpperCase()}
              </Typography>
            )}
            {item.note && (
              <Typography sx={{ fontSize: 11, fontWeight: 600, color: "#b45309" }}>Note: {item.note}</Typography>
            )}
          </Box>
          {item.price !== undefined && (
            <Typography sx={{ fontSize: 14, fontWeight: 700 }}>{formatRupees(item.price)}</Typography>
          )}
        </Box>
      ))}
      {order.note && (
        <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#b45309" }}>Note: {order.note}</Typography>
      )}
      <Box sx={{ flex: 1 }} />
      {/* What to do next */}
      {order.state === "New" && (
        <>
          <Bar
            icon={<Disc><TwoWheelerOutlined sx={{ fontSize: 18 }} /></Disc>}
            title="Delivery executive"
            note={own ? "You choose a rider after you confirm" : "TrainDhaba finds the rider after you confirm"}
            end={
              <Box sx={{ textAlign: "right" }}>
                <Typography sx={{ fontSize: 10, color: tokens.color.textMuted }}>Grand total</Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, justifyContent: "flex-end" }}>
                  {order.paymentStatus === "PAID" && (
                    <Box component="span" sx={{ px: 0.75, fontSize: 10, lineHeight: "16px", fontWeight: 700, borderRadius: "4px", color: tokens.color.success, bgcolor: tokens.color.successBg }}>
                      PAID
                    </Box>
                  )}
                  <Typography sx={{ fontSize: 16, fontWeight: 700 }}>{formatRupees(order.amount)}</Typography>
                </Box>
              </Box>
            }
          />
          <Bar
            icon={<Disc><AccessTimeOutlined sx={{ fontSize: 18 }} /></Disc>}
            title="Prep time"
            note={
              <>
                Food ready by <b>{clock(now + prep * 60000)}</b>
                {arrives && code ? ` · train reaches ${code} ${arrives}` : ""}
              </>
            }
            end={
              <Box sx={{ display: "flex", alignItems: "center", height: 44, borderRadius: "10px", border: `1px solid ${tokens.color.borderInput}` }}>
                <ButtonBase aria-label="Less prep time" onClick={() => setPrep((p) => Math.max(5, p - 5))} sx={{ width: 40, height: "100%" }}>
                  <RemoveRounded sx={{ fontSize: 18 }} />
                </ButtonBase>
                <Typography sx={{ minWidth: 56, textAlign: "center", fontSize: 14, fontWeight: 600 }}>{prep} min</Typography>
                <ButtonBase aria-label="More prep time" onClick={() => setPrep((p) => Math.min(120, p + 5))} sx={{ width: 40, height: "100%" }}>
                  <AddRounded sx={{ fontSize: 18 }} />
                </ButtonBase>
              </Box>
            }
          />
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 1.5 }}>
            <ButtonBase disabled={busy} onClick={() => void ws.changeOrder(order.id, "Rejected")} sx={big(tokens.color.muted, tokens.color.text)}>
              Mark out of stock
            </ButtonBase>
            <ButtonBase disabled={busy} onClick={() => void ws.changeOrder(order.id, "Preparing", undefined, prep)} sx={big(tokens.color.success)}>
              Confirm order
            </ButtonBase>
          </Box>
        </>
      )}
      {order.state === "Preparing" && (
        <>
          <Bar
            icon={<Disc><AccessTimeOutlined sx={{ fontSize: 18 }} /></Disc>}
            title="Time left to prep"
            note={arrives ? `Food due ${clock(deadline)} · train reaches ${code ?? ""} ${arrives}` : `Food due ${clock(deadline)}`}
            end={<Typography sx={{ fontSize: 24, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{mmss(left)}</Typography>}
          />
          {own ? (
            <Bar
              sx={{ bgcolor: tokens.color.primarySubtle, borderColor: tokens.color.primarySubtleBorder }}
              icon={<Disc tint="#fff"><TwoWheelerOutlined sx={{ fontSize: 18, color: tokens.color.primary }} /></Disc>}
              title={rider ? `${rider.name} will pick it up` : "No rider yet"}
              note={rider?.phone ?? "Choose who takes this order to the train"}
              end={
                <ButtonBase
                  onClick={() => setPicking(true)}
                  sx={{ height: 36, px: 1.75, fontSize: 13, fontWeight: 600, borderRadius: "10px", color: tokens.color.primary, bgcolor: "#fff", border: `1px solid ${tokens.color.primary}` }}
                >
                  {rider ? "Change rider" : "Choose rider"}
                </ButtonBase>
              }
            />
          ) : (
            <Bar
              sx={{ bgcolor: tokens.color.primarySubtle, borderColor: tokens.color.primarySubtleBorder }}
              icon={<Disc tint="#fff"><TwoWheelerOutlined sx={{ fontSize: 18, color: tokens.color.primary }} /></Disc>}
              title={rider ? `${rider.name} is assigned` : "Finding a TrainDhaba rider"}
              note={rider ? "TrainDhaba rider" : "We are looking for a rider for this order"}
            />
          )}
          <ButtonBase
            disabled={busy || (own && !rider)}
            onClick={() => void ws.changeOrder(order.id, "Ready", rider)}
            sx={big(tokens.color.success)}
          >
            Order ready ({mmss(left)})
          </ButtonBase>
          <AssignRiderDialog
            open={picking}
            orderLabel={orderNumber(order.id)}
            confirmLabel="Choose rider"
            busy={busy}
            onClose={() => setPicking(false)}
            onAssign={(r) => {
              ws.assignRider(order.id, { id: r.id, name: r.name, phone: r.phone });
              setPicking(false);
            }}
          />
        </>
      )}
      {order.state === "Ready" && (
        <>
          <Bar
            icon={<Disc><AccessTimeOutlined sx={{ fontSize: 18 }} /></Disc>}
            title="Train arrives in"
            note={
              arrives
                ? `Hand over by ${clock(arrival - 6 * 60000)} so the rider reaches the platform in time`
                : "Hand the food to the rider"
            }
            end={
              arrival ? (
                <Typography sx={{ fontSize: 22, fontWeight: 700 }}>
                  {Math.max(0, Math.round((arrival - now) / 60000))} min
                </Typography>
              ) : undefined
            }
          />
          {(rider || !own) && (
            <Bar
              sx={{ bgcolor: tokens.color.successBg, borderColor: "#cfe8da" }}
              icon={
                <Disc tint="#fff">
                  <Typography sx={{ fontSize: 12, fontWeight: 700, color: tokens.color.text }}>
                    {rider?.name
                      .split(/\s+/)
                      .slice(0, 2)
                      .map((w) => w[0]?.toUpperCase())
                      .join("") ?? "TD"}
                  </Typography>
                </Disc>
              }
              title={rider ? `${rider.name} is picking it up` : "A TrainDhaba rider will pick it up"}
              note={
                order.pickupOtp ? (
                  <>
                    Pickup OTP{" "}
                    <b style={{ fontSize: 14, letterSpacing: "2px", color: tokens.color.text }}>{order.pickupOtp}</b>
                  </>
                ) : (
                  rider?.phone ?? ago(order.placedAt, now)
                )
              }
              end={
                rider?.phone ? (
                  <ButtonBase
                    component="a"
                    href={`tel:${rider.phone}`}
                    aria-label={`Call ${rider.name}`}
                    sx={{ width: 36, height: 36, borderRadius: "50%", color: tokens.color.success, bgcolor: "#fff", border: `1px solid ${tokens.color.border}` }}
                  >
                    <CallOutlined sx={{ fontSize: 18 }} />
                  </ButtonBase>
                ) : undefined
              }
            />
          )}
          {own ? (
            <ButtonBase
              disabled={busy || !rider}
              onClick={() => void ws.changeOrder(order.id, "HandedOver", rider)}
              sx={big(tokens.color.success)}
            >
              Handed over{rider ? ` to ${rider.name.split(/\s+/)[0]}` : ""}
            </ButtonBase>
          ) : null}
        </>
      )}
    </Box>
  );
}
