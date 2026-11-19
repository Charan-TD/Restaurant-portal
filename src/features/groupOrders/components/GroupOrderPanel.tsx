"use client";
import { useState } from "react";
import { Box, ButtonBase, Typography } from "@mui/material";
import AccessTimeOutlined from "@mui/icons-material/AccessTimeOutlined";
import CallOutlined from "@mui/icons-material/CallOutlined";
import PrintOutlined from "@mui/icons-material/PrintOutlined";
import TwoWheelerOutlined from "@mui/icons-material/TwoWheelerOutlined";
import { cardSx, tokens } from "@/core/theme/tokens";
import { formatRupees } from "@/shared/utils/format";
import { FoodTypeMark } from "@/shared/components/feedback/FoodTypeMark";
import { Bar, big, box, Disc, Info } from "@/features/orders/components/OrderDetail";
import { AssignRiderDialog } from "@/features/riders/components/AssignRiderDialog";
import { mealCount, orderValue, readyAt, type GroupOrder } from "../models/groupOrder";
import type { GroupOrderHandlers } from "./GroupOrderActions";
import { clock, parse, stamp } from "./groupOrderFormat";

const badge: Record<string, { label: string; fg: string; bg: string; since: string }> = {
  PREPARING: { label: "Preparing", fg: "#8a5a00", bg: "#fff4d6", since: "Accepted" },
  READY: { label: "Ready", fg: tokens.color.success, bg: tokens.color.successBg, since: "Ready" },
  OUT_FOR_DELIVERY: { label: "With rider", fg: tokens.color.success, bg: tokens.color.successBg, since: "Picked up" },
};

/** "18:46", or "1:05:30" once it is an hour or more. */
function countdown(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000)),
    h = Math.floor(total / 3600),
    m = Math.floor((total % 3600) / 60),
    s = String(total % 60).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${s}` : `${String(m).padStart(2, "0")}:${s}`;
}

/** "18 min" or "2 h 5 min". */
function minutes(ms: number) {
  const total = Math.max(0, Math.round(ms / 60000)),
    h = Math.floor(total / 60);
  return h ? `${h} h ${total % 60} min` : `${total} min`;
}

/** "BNC" from "Bengaluru Cantt (BNC)"; otherwise the first word. */
const stationCode = (name?: string) =>
  name?.match(/\(([A-Za-z]+)\)/)?.[1]?.toUpperCase() ?? name?.split(/\s+/)[0]?.toUpperCase();

const initials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

/** Opens a print window with a kitchen ticket for the whole group. */
function printKot(o: GroupOrder) {
  const win = window.open("", "_blank", "width=380,height=600");
  if (!win) return;
  const esc = (v: string) => v.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c] ?? c),
    title = esc(o.id ?? "Group order");
  win.document.write(
    `<title>KOT ${title}</title><body style="font:14px sans-serif;padding:16px"><h2>${title} · ${mealCount(o)} meals</h2><p>${esc(
      [o.trainNumber, o.trainName, o.coaches.join(", ")].filter(Boolean).join(" · "),
    )}</p><hr>${o.items
      .map((i) => `<p><b>${i.quantity} ×</b> ${esc(i.name)}${i.description ? `<br><i>${esc(i.description)}</i>` : ""}</p>`)
      .join("")}${!o.items.length && o.details ? `<p>${esc(o.details)}</p>` : ""}${o.note ? `<hr><p>Note: ${esc(o.note)}</p>` : ""}</body>`,
  );
  win.document.close();
  win.print();
}

/**
 * An accepted group order, laid out like Manage Orders: what was ordered,
 * then the timer, the rider and the next step for its stage.
 */
export function GroupOrderPanel({
  order: o,
  now,
  busy,
  own,
  onChange,
  onAssignRider,
}: GroupOrderHandlers & { order?: GroupOrder; now: number }) {
  const [picking, setPicking] = useState<"assign" | "step" | null>(null);
  if (!o)
    return (
      <Box sx={{ ...cardSx, p: 4, display: "grid", placeItems: "center", color: tokens.color.textMuted, fontSize: 14, minHeight: 320 }}>
        Pick a group order to see its details.
      </Box>
    );
  const tone = badge[o.status],
    rider = o.rider,
    ready = readyAt(o),
    arrival = parse(o.trainArrival),
    riderAt = parse(o.riderAt),
    code = stationCode(o.stationName),
    trainLine = arrival !== undefined ? `train reaches ${code ?? ""} ${clock(arrival)}`.replace("  ", " ") : "",
    left = ready !== undefined ? ready - now : undefined,
    since = parse(o.updatedAt);
  // The step a rider is needed for, when the restaurant's own rider has not been chosen yet.
  const next =
    o.status === "PREPARING"
      ? { to: "READY", label: `Food ready${left !== undefined ? ` (${countdown(left)})` : ""}` }
      : o.status === "READY" && own
        ? { to: "OUT_FOR_DELIVERY", label: `Handed over${rider ? ` to ${rider.name.split(/\s+/)[0]}` : ""}` }
        : o.status === "OUT_FOR_DELIVERY" && own
          ? { to: "DELIVERED", label: "Mark delivered" }
          : undefined;
  const needsRider = own && !rider && (o.status === "PREPARING" || o.status === "READY");
  return (
    <Box sx={{ ...cardSx, p: 2, display: "flex", flexDirection: "column", gap: 1.5, minHeight: 560 }}>
      {/* Order id, status, when, and the ticket */}
      <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 2, p: 1.75, borderRadius: "12px", bgcolor: tokens.color.page }}>
        <Box sx={{ flex: 1, minWidth: 200 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography sx={{ fontSize: 22, lineHeight: "28px", fontWeight: 700, color: tokens.color.primary }}>
              {o.id ?? "Group order"}
            </Typography>
            <Box
              component="span"
              sx={{ px: 0.75, fontSize: 10, lineHeight: "16px", fontWeight: 700, borderRadius: "4px", textTransform: "uppercase", color: tone?.fg ?? tokens.color.textMuted, bgcolor: tone?.bg ?? tokens.color.muted }}
            >
              {tone?.label ?? o.status}
            </Box>
          </Box>
          <Typography sx={{ fontSize: 12, color: tokens.color.textMuted }}>
            {mealCount(o)} meals for {formatRupees(orderValue(o))} · Group order
          </Typography>
        </Box>
        {since !== undefined && tone && (
          <Typography sx={{ fontSize: 12 }}>
            {tone.since} {stamp(since)}
          </Typography>
        )}
        <ButtonBase
          onClick={() => printKot(o)}
          sx={{ gap: 0.75, height: 36, px: 1.75, fontSize: 13, fontWeight: 600, borderRadius: "10px", bgcolor: tokens.color.card, border: `1px solid ${tokens.color.borderInput}` }}
        >
          <PrintOutlined sx={{ fontSize: 18 }} />
          Print KOT
        </ButtonBase>
      </Box>

      {/* Contact, train, coaches and where it goes */}
      <Box sx={{ ...box, display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" }, gap: 2, alignItems: "start" }}>
        <Info label="CONTACT" value={o.contactName} sub={o.groupSize ? `${o.groupSize} people` : o.mobile || undefined} />
        <Info label="TRAIN" value={[o.trainNumber, o.trainName].filter(Boolean).join(" ")} />
        <Info label="COACHES" value={o.coaches.join(", ")} />
        <Info label="DELIVER AT" value={o.stationName} sub={arrival !== undefined ? `Arrives ${clock(arrival)}` : undefined} />
      </Box>

      {/* The dishes */}
      {o.items.map((item, i) => (
        <Box key={`${item.name}-${i}`} sx={{ ...box, alignItems: "flex-start", justifyContent: "space-between" }}>
          <Box sx={{ minWidth: 0 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              {item.foodType && <FoodTypeMark type={item.foodType} />}
              <Typography sx={{ fontSize: 14, fontWeight: 600 }}>
                {item.quantity} × {item.name}
              </Typography>
            </Box>
            {(item.description || item.unitPrice !== undefined) && (
              <Typography sx={{ mt: 0.5, fontSize: 11, color: tokens.color.textMuted }}>
                {[item.description, item.unitPrice !== undefined && `${formatRupees(item.unitPrice)} each`].filter(Boolean).join(" · ")}
              </Typography>
            )}
          </Box>
          {item.amount !== undefined && <Typography sx={{ fontSize: 14, fontWeight: 700 }}>{formatRupees(item.amount)}</Typography>}
        </Box>
      ))}
      {!o.items.length && o.details && <Box sx={box}><Typography sx={{ fontSize: 14 }}>{o.details}</Typography></Box>}
      {o.note && <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#b45309" }}>Note: {o.note}</Typography>}
      <Box sx={{ flex: 1 }} />

      {/* The clock for this stage */}
      {o.status === "PREPARING" && (
        <Bar
          icon={<Disc><AccessTimeOutlined sx={{ fontSize: 18 }} /></Disc>}
          title={left !== undefined && left < 0 ? "Running late" : "Time left to prep"}
          note={ready !== undefined ? [`Food due ${clock(ready)}`, trainLine].filter(Boolean).join(" · ") : "Mark it ready when every meal is packed"}
          end={
            left !== undefined ? (
              <Typography sx={{ fontSize: 24, fontWeight: 700, fontVariantNumeric: "tabular-nums", color: left < 0 ? tokens.color.error : tokens.color.text }}>
                {left < 0 ? `-${countdown(-left)}` : countdown(left)}
              </Typography>
            ) : undefined
          }
        />
      )}
      {o.status === "READY" && (
        <Bar
          icon={<Disc><AccessTimeOutlined sx={{ fontSize: 18 }} /></Disc>}
          title="Train arrives in"
          note={riderAt !== undefined ? `The rider reaches you at ${clock(riderAt)}` : "Hand the food to the rider"}
          end={arrival !== undefined ? <Typography sx={{ fontSize: 22, fontWeight: 700 }}>{minutes(arrival - now)}</Typography> : undefined}
        />
      )}

      {/* Who takes it */}
      {o.status === "PREPARING" && !rider ? (
        <Bar
          sx={{ bgcolor: tokens.color.primarySubtle, borderColor: tokens.color.primarySubtleBorder }}
          icon={<Disc tint="#fff"><TwoWheelerOutlined sx={{ fontSize: 18, color: tokens.color.primary }} /></Disc>}
          title={own ? "No rider yet" : "Finding a TrainDhaba rider"}
          note={own ? "Choose who takes this order to the train" : "We are looking for a rider for this order"}
          end={
            own ? (
              <ButtonBase
                onClick={() => setPicking("assign")}
                sx={{ height: 36, px: 1.75, fontSize: 13, fontWeight: 600, borderRadius: "10px", color: tokens.color.primary, bgcolor: "#fff", border: `1px solid ${tokens.color.primary}` }}
              >
                Choose rider
              </ButtonBase>
            ) : undefined
          }
        />
      ) : rider || !own ? (
        <Bar
          sx={{ bgcolor: tokens.color.successBg, borderColor: "#cfe8da" }}
          icon={
            <Disc tint="#fff">
              <Typography sx={{ fontSize: 12, fontWeight: 700, color: tokens.color.text }}>{rider ? initials(rider.name) : "TD"}</Typography>
            </Disc>
          }
          title={
            rider
              ? o.status === "OUT_FOR_DELIVERY"
                ? `${rider.name} has the order`
                : o.status === "READY"
                  ? `${rider.name} is picking it up`
                  : `${rider.name} will pick it up`
              : o.status === "OUT_FOR_DELIVERY"
                ? "With the TrainDhaba rider"
                : "A TrainDhaba rider will pick it up"
          }
          note={rider?.phone ?? (own ? "" : "TrainDhaba rider")}
          end={
            <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
              {own && o.status === "PREPARING" && (
                <ButtonBase onClick={() => setPicking("assign")} sx={{ fontSize: 13, fontWeight: 600, color: tokens.color.primary }}>
                  Change
                </ButtonBase>
              )}
              {rider?.phone && (
                <ButtonBase
                  component="a"
                  href={`tel:${rider.phone}`}
                  aria-label={`Call ${rider.name}`}
                  sx={{ width: 36, height: 36, borderRadius: "50%", color: tokens.color.success, bgcolor: "#fff", border: `1px solid ${tokens.color.border}` }}
                >
                  <CallOutlined sx={{ fontSize: 18 }} />
                </ButtonBase>
              )}
            </Box>
          }
        />
      ) : null}

      {/* The next step */}
      {next && (
        <ButtonBase
          disabled={busy}
          onClick={() => (needsRider ? setPicking("step") : onChange(o, next.to, rider))}
          sx={big(tokens.color.success)}
        >
          {needsRider ? `Choose rider · ${next.label}` : next.label}
        </ButtonBase>
      )}

      <AssignRiderDialog
        open={!!picking}
        orderLabel={o.id ?? "Group order"}
        confirmLabel={picking === "step" && next ? `Choose rider and ${next.label.replace(/ \(.*\)$/, "").toLowerCase()}` : "Choose rider"}
        busy={busy}
        onClose={() => setPicking(null)}
        onAssign={(r) => {
          const chosen = { id: r.id, name: r.name, phone: r.phone };
          if (picking === "step" && next) onChange(o, next.to, chosen);
          else onAssignRider(o, chosen);
          setPicking(null);
        }}
      />
    </Box>
  );
}
