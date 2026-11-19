"use client";
import type { ReactNode } from "react";
import { Box, Typography } from "@mui/material";
import AccessTimeOutlined from "@mui/icons-material/AccessTimeOutlined";
import AirlineSeatReclineNormalOutlined from "@mui/icons-material/AirlineSeatReclineNormalOutlined";
import PersonOutlineOutlined from "@mui/icons-material/PersonOutlineOutlined";
import PlaceOutlined from "@mui/icons-material/PlaceOutlined";
import { cardSx, tokens } from "@/core/theme/tokens";
import { CommonButton } from "@/shared/components/actions/CommonButton";
import { FoodTypeMark } from "@/shared/components/feedback/FoodTypeMark";
import { formatRupees } from "@/shared/utils/format";
import {
  canStart,
  mealCount,
  orderValue,
  readyAt,
  statusLabel,
  type GroupOrder,
} from "../models/groupOrder";
import { GroupOrderActions, nextStep, type GroupOrderHandlers } from "./GroupOrderActions";
import { clock, day, parse } from "./groupOrderFormat";

/** A small rounded label, e.g. the order id or "Assigned by TrainDhaba". */
export function Pill({ children, fg, bg }: { children: ReactNode; fg: string; bg: string }) {
  return (
    <Box component="span" sx={{ px: 1, fontSize: 11, lineHeight: "22px", fontWeight: 700, borderRadius: "6px", color: fg, bgcolor: bg, whiteSpace: "nowrap" }}>
      {children}
    </Box>
  );
}

/** Colours of each status label. */
export const statusTone: Record<string, { fg: string; bg: string }> = {
  ASSIGNED: { fg: tokens.color.info, bg: tokens.color.infoBg },
  PREPARING: { fg: tokens.color.primary, bg: tokens.color.primarySubtle },
  READY: { fg: tokens.color.success, bg: tokens.color.successBg },
  OUT_FOR_DELIVERY: { fg: tokens.color.success, bg: tokens.color.successBg },
  DELIVERED: { fg: tokens.color.success, bg: tokens.color.successBg },
  REJECTED: { fg: tokens.color.error, bg: tokens.color.errorBg },
  FAILED: { fg: tokens.color.error, bg: tokens.color.errorBg },
};

/** One detail with its icon: label above, value below. */
export function Detail({ icon, label, value }: { icon: ReactNode; label: string; value?: string }) {
  if (!value) return null;
  return (
    <Box sx={{ display: "flex", gap: 1, minWidth: 0 }}>
      <Box sx={{ color: tokens.color.textMuted, pt: "1px", "& svg": { fontSize: 16 } }}>{icon}</Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontSize: 11, color: tokens.color.textMuted }}>{label}</Typography>
        <Typography sx={{ fontSize: 13, fontWeight: 600, overflowWrap: "anywhere" }}>{value}</Typography>
      </Box>
    </Box>
  );
}

/** "7:05 PM - Today". */
export const arrivalText = (order: GroupOrder, now: number, separator = " - ") => {
  const arrival = parse(order.trainArrival);
  return arrival === undefined ? undefined : `${clock(arrival)}${separator}${day(arrival, now)}`;
};

/** The dishes, their counts and amounts, then the order value. */
export function GroupOrderItems({ order, detailed }: { order: GroupOrder; detailed?: boolean }) {
  return (
    <Box sx={{ display: "grid", gap: detailed ? 1.5 : 0.75 }}>
      {order.items.map((item, i) => (
        <Box key={`${item.name}-${i}`} sx={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto 72px", gap: 1.5, alignItems: "start" }}>
          <Box sx={{ minWidth: 0 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              {item.foodType && <FoodTypeMark type={item.foodType} />}
              <Typography sx={{ fontSize: detailed ? 14 : 13, fontWeight: detailed ? 600 : 500 }}>{item.name}</Typography>
            </Box>
            {detailed && (item.description || item.unitPrice !== undefined) && (
              <Typography sx={{ ml: item.foodType ? 3 : 0, fontSize: 12, color: tokens.color.textMuted }}>
                {[item.description, item.unitPrice !== undefined && `${formatRupees(item.unitPrice)} each`].filter(Boolean).join(" · ")}
              </Typography>
            )}
          </Box>
          <Typography sx={{ fontSize: 12, color: detailed ? tokens.color.info : tokens.color.textMuted, fontWeight: detailed ? 600 : 400 }}>
            × {item.quantity}
          </Typography>
          <Typography sx={{ fontSize: 13, fontWeight: detailed ? 700 : 500, textAlign: "right" }}>
            {item.amount !== undefined ? formatRupees(item.amount) : ""}
          </Typography>
        </Box>
      ))}
      {!order.items.length && order.details && (
        <Typography sx={{ fontSize: 13 }}>{order.details}</Typography>
      )}
      <Box sx={{ display: "flex", justifyContent: "space-between", pt: 1.25, mt: 0.5, borderTop: `1px solid ${tokens.color.border}` }}>
        <Typography sx={{ fontSize: detailed ? 15 : 13, fontWeight: 700 }}>Order value</Typography>
        <Typography sx={{ fontSize: detailed ? 15 : 13, fontWeight: 700 }}>{formatRupees(orderValue(order))}</Typography>
      </Box>
    </Box>
  );
}

/** "Note: Pack each meal separately…". */
export function GroupOrderNote({ note }: { note?: string }) {
  if (!note) return null;
  return (
    <Typography sx={{ p: 1.25, fontSize: 12, borderRadius: "8px", bgcolor: tokens.color.sunken }}>
      <b>Note:</b> {note}
    </Typography>
  );
}

/** One group order as a card: train, timing, items, value and its next step. */
export function GroupOrderTile({
  order,
  now,
  onOpen,
  ...handlers
}: GroupOrderHandlers & { order: GroupOrder; now: number; onOpen: () => void }) {
  const ready = readyAt(order),
    // An upcoming order the kitchen can start now is shown as urgent.
    urgent = order.status === "ASSIGNED" && canStart(order, now),
    step = nextStep(order, now, handlers.own),
    tone = statusTone[order.status];
  return (
    <Box component="article" sx={{ ...cardSx, p: 2, display: "grid", gap: 1.5 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
        {order.id && <Pill fg={tokens.color.textMuted} bg={tokens.color.muted}>{order.id}</Pill>}
        <Pill fg={tokens.color.info} bg={tokens.color.infoBg}>Assigned by TrainDhaba</Pill>
        {order.status !== "ASSIGNED" && tone && <Pill fg={tone.fg} bg={tone.bg}>{statusLabel[order.status] ?? order.status}</Pill>}
        <Box sx={{ flex: 1 }} />
        {ready !== undefined && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, color: urgent ? tokens.color.error : tokens.color.text }}>
            <AccessTimeOutlined sx={{ fontSize: 15 }} />
            <Typography sx={{ fontSize: 12, fontWeight: 600 }}>Food ready by {clock(ready)}</Typography>
          </Box>
        )}
      </Box>

      <Typography sx={{ fontSize: 18, fontWeight: 700 }}>
        {mealCount(order)} meals
        {(order.trainName || order.trainNumber) && (
          <Box component="span" sx={{ ml: 1, fontSize: 13, fontWeight: 400, color: tokens.color.textMuted }}>
            {[order.trainName, order.trainNumber].filter(Boolean).join(" · ")}
          </Box>
        )}
      </Typography>

      <Box sx={{ p: 1.5, display: "grid", gap: 1.5, gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", borderRadius: "10px", border: `1px solid ${tokens.color.border}` }}>
        <Detail icon={<PlaceOutlined />} label="Delivery station" value={order.stationName} />
        <Detail icon={<AccessTimeOutlined />} label="Train arrives" value={arrivalText(order, now)} />
        <Detail icon={<AirlineSeatReclineNormalOutlined />} label="Coaches" value={order.coaches.join(", ")} />
        <Detail icon={<PersonOutlineOutlined />} label="Contact person" value={order.contactName} />
      </Box>

      <GroupOrderItems order={order} />
      <GroupOrderNote note={order.note} />

      <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
        <Typography sx={{ flex: 1, minWidth: 160, fontSize: 12, color: tokens.color.textMuted }}>{step.hint}</Typography>
        <CommonButton variant="outlined" onClick={onOpen}>View details</CommonButton>
        <GroupOrderActions order={order} now={now} {...handlers} />
      </Box>
    </Box>
  );
}
