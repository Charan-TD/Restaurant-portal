"use client";
import { Box, ButtonBase, Drawer, Typography } from "@mui/material";
import AccessTimeOutlined from "@mui/icons-material/AccessTimeOutlined";
import AirlineSeatReclineNormalOutlined from "@mui/icons-material/AirlineSeatReclineNormalOutlined";
import CallOutlined from "@mui/icons-material/CallOutlined";
import CheckOutlined from "@mui/icons-material/CheckOutlined";
import CloseOutlined from "@mui/icons-material/CloseOutlined";
import PersonOutlineOutlined from "@mui/icons-material/PersonOutlineOutlined";
import PlaceOutlined from "@mui/icons-material/PlaceOutlined";
import TrainOutlined from "@mui/icons-material/TrainOutlined";
import { tokens } from "@/core/theme/tokens";
import { CommonButton } from "@/shared/components/actions/CommonButton";
import { mealCount, readyAt, startAt, statusLabel, type GroupOrder } from "../models/groupOrder";
import { GroupOrderActions, type GroupOrderHandlers } from "./GroupOrderActions";
import { arrivalText, Detail, GroupOrderItems, GroupOrderNote, Pill, statusTone } from "./GroupOrderTile";
import { clock, parse, stamp, SUPPORT_PHONE, weekday } from "./groupOrderFormat";

const stages = ["ASSIGNED", "PREPARING", "READY", "OUT_FOR_DELIVERY", "DELIVERED"];
/** How far along the order is: 0 assigned … 4 delivered; closed without delivery stays where it was. */
const progress = (status: string) => Math.max(0, stages.indexOf(status));

/** One step of the timeline: done (green tick), next (orange ring) or still to come (grey ring). */
function Step({ title, note, state, last, failed }: { title: string; note?: string; state: "done" | "next" | "todo"; last?: boolean; failed?: boolean }) {
  const ring = failed ? tokens.color.error : state === "next" ? tokens.color.primary : state === "done" ? tokens.color.success : tokens.color.borderInput;
  return (
    <Box sx={{ display: "flex", gap: 1.5, position: "relative", pb: last ? 0 : 2 }}>
      {!last && (
        <Box aria-hidden sx={{ position: "absolute", left: 9, top: 22, bottom: 2, width: 2, bgcolor: state === "done" ? tokens.color.success : tokens.color.border }} />
      )}
      <Box sx={{ width: 20, height: 20, flexShrink: 0, display: "grid", placeItems: "center", borderRadius: "50%", color: "#fff", bgcolor: state === "done" ? tokens.color.success : tokens.color.card, border: `2px solid ${ring}` }}>
        {state === "done" && <CheckOutlined sx={{ fontSize: 13 }} />}
      </Box>
      <Box>
        <Typography sx={{ fontSize: 13, fontWeight: 600, lineHeight: "20px", color: failed ? tokens.color.error : state === "todo" ? tokens.color.textMuted : tokens.color.text }}>{title}</Typography>
        {note && <Typography sx={{ fontSize: 11, color: tokens.color.textMuted }}>{note}</Typography>}
      </Box>
    </Box>
  );
}

/** The order opened from its card: details, timeline, items, contact and its next step. */
export function GroupOrderDrawer({
  order: shown,
  now,
  onClose,
  ...handlers
}: GroupOrderHandlers & { order: GroupOrder | null; now: number; onClose: () => void }) {
  return (
    <Drawer anchor="right" open={!!shown} onClose={onClose} slotProps={{ paper: { sx: { width: { xs: "100%", sm: 400 }, display: "flex", flexDirection: "column" } } }}>
      {shown && <Body order={shown} now={now} onClose={onClose} {...handlers} />}
    </Drawer>
  );
}

function Body({ order: o, now, onClose, ...handlers }: GroupOrderHandlers & { order: GroupOrder; now: number; onClose: () => void }) {
  const at = progress(o.status),
    closedEarly = o.status === "REJECTED" || o.status === "FAILED",
    state = (step: number): "done" | "next" | "todo" => (at >= step ? "done" : at + 1 === step && !closedEarly ? "next" : "todo"),
    assigned = parse(o.assignedAt),
    start = startAt(o),
    ready = readyAt(o),
    riderAt = parse(o.riderAt),
    tone = statusTone[o.status] ?? { fg: tokens.color.textMuted, bg: tokens.color.muted };
  return (
    <>
      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1, p: 2.5, borderBottom: `1px solid ${tokens.color.border}` }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {o.id && <Typography sx={{ fontSize: 12, color: tokens.color.textMuted }}>{o.id}</Typography>}
            <Pill fg={tone.fg} bg={tone.bg}>{statusLabel[o.status] ?? o.status}</Pill>
          </Box>
          <Typography component="h2" sx={{ mt: 0.5, fontSize: 20, fontWeight: 700 }}>
            {mealCount(o)} meals{o.trainName ? ` · ${o.trainName}` : ""}
          </Typography>
        </Box>
        <ButtonBase aria-label="Close" onClick={onClose} sx={{ width: 36, height: 36, borderRadius: "50%", bgcolor: tokens.color.muted }}>
          <CloseOutlined sx={{ fontSize: 18 }} />
        </ButtonBase>
      </Box>

      <Box sx={{ flex: 1, overflowY: "auto", p: 2.5, display: "grid", gap: 2.5, alignContent: "start" }}>
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5 }}>
          <Detail icon={<TrainOutlined />} label="Train" value={[o.trainNumber, o.trainName].filter(Boolean).join(" · ")} />
          <Detail icon={<PlaceOutlined />} label="Delivery station" value={o.stationName} />
          <Detail icon={<AccessTimeOutlined />} label="Train arrives" value={arrivalText(o, now, " · ")} />
          <Detail icon={<AirlineSeatReclineNormalOutlined />} label="Coaches" value={o.coaches.join(", ")} />
        </Box>

        <Box>
          <Typography sx={{ mb: 1.5, fontSize: 14, fontWeight: 700 }}>Timeline</Typography>
          <Step title="Assigned by TrainDhaba" note={assigned ? stamp(assigned) : undefined} state="done" />
          <Step
            title={at >= 1 ? "Preparing" : "Start preparing"}
            note={at >= 1 ? "Started" : start !== undefined ? `From ${clock(start)}, ${weekday(start)}` : "Any time"}
            state={state(1)}
          />
          <Step title="Food ready" note={ready !== undefined ? `By ${clock(ready)}` : undefined} state={state(2)} />
          <Step
            title="Handed to rider"
            note={[o.rider?.name, riderAt !== undefined && `Rider reaches at ${clock(riderAt)}`].filter(Boolean).join(" · ") || undefined}
            state={state(3)}
            last={!closedEarly && o.status !== "DELIVERED"}
          />
          {o.status === "DELIVERED" && <Step title="Delivered" state="done" last />}
          {closedEarly && <Step title={statusLabel[o.status]} state="todo" failed last />}
        </Box>

        <Box>
          <Typography sx={{ mb: 1.5, fontSize: 14, fontWeight: 700 }}>Items</Typography>
          <GroupOrderItems order={o} detailed />
        </Box>
        <GroupOrderNote note={o.note} />

        {(o.contactName || o.mobile) && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, p: 1.5, borderRadius: "10px", border: `1px solid ${tokens.color.border}` }}>
            <Box sx={{ width: 36, height: 36, display: "grid", placeItems: "center", borderRadius: "50%", bgcolor: tokens.color.muted }}>
              <PersonOutlineOutlined sx={{ fontSize: 18 }} />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontSize: 11, color: tokens.color.textMuted }}>Contact person</Typography>
              <Typography sx={{ fontSize: 14, fontWeight: 600 }}>{o.contactName}</Typography>
            </Box>
            {o.mobile && (
              <CommonButton variant="outlined" startIcon={<CallOutlined />} href={`tel:${o.mobile}`}>
                Call
              </CommonButton>
            )}
          </Box>
        )}
      </Box>

      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", p: 2, borderTop: `1px solid ${tokens.color.border}` }}>
        <CommonButton variant="outlined" href={`tel:${SUPPORT_PHONE}`}>Call support</CommonButton>
        <GroupOrderActions order={o} now={now} wide {...handlers} />
      </Box>
    </>
  );
}
