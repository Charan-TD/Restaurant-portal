"use client";
import { useRef, useState } from "react";
import { Box, ButtonBase, InputBase, Typography } from "@mui/material";
import ArrowBackRounded from "@mui/icons-material/ArrowBackRounded";
import ChevronRightRounded from "@mui/icons-material/ChevronRightRounded";
import InfoOutlined from "@mui/icons-material/InfoOutlined";
import PhotoCameraOutlined from "@mui/icons-material/PhotoCameraOutlined";
import ScheduleOutlined from "@mui/icons-material/ScheduleOutlined";
import UploadOutlined from "@mui/icons-material/UploadOutlined";
import { tokens } from "@/core/theme/tokens";
import { formatRupees } from "@/shared/utils/format";
import {
  complaintsSample,
  statusLabel,
  type Complaint,
  type ComplaintStatus,
} from "../models/complaints";
import { PaneHeading } from "./PaneHeading";

type Filter = ComplaintStatus | "all";
const MAX_PHOTOS = 3;
const TAGS: Record<ComplaintStatus, { fg: string; bg: string }> = {
  needs: { fg: "#8a5a00", bg: "#fff4d6" },
  review: { fg: tokens.color.info, bg: tokens.color.infoBg },
  resolved: { fg: tokens.color.success, bg: tokens.color.successBg },
};

function Tag({ status }: { status: ComplaintStatus }) {
  return (
    <Box
      component="span"
      sx={{
        px: 1,
        fontSize: 10,
        lineHeight: "20px",
        fontWeight: 700,
        letterSpacing: "0.3px",
        borderRadius: "6px",
        whiteSpace: "nowrap",
        color: TAGS[status].fg,
        bgcolor: TAGS[status].bg,
      }}
    >
      {statusLabel[status]}
    </Box>
  );
}

function Chip({ label, count, on, onClick }: { label: string; count: number; on: boolean; onClick: () => void }) {
  return (
    <ButtonBase
      onClick={onClick}
      aria-pressed={on}
      sx={{
        gap: 0.75,
        px: 1.75,
        height: 34,
        fontSize: 13,
        fontWeight: 600,
        borderRadius: "17px",
        color: on ? tokens.color.primary : tokens.color.text,
        bgcolor: on ? tokens.color.primarySubtle : tokens.color.card,
        border: `1px solid ${on ? tokens.color.primary : tokens.color.borderInput}`,
      }}
    >
      {label}
      <Box component="span" sx={{ color: on ? tokens.color.primary : tokens.color.textMuted }}>
        {count}
      </Box>
    </ButtonBase>
  );
}

const meta = (c: Complaint) => `Order #${c.order} · ${c.passenger} · ${c.train} · ${c.seat} · ${c.raised}`;

/** One line of the list. */
function Row({ c, onOpen }: { c: Complaint; onOpen: () => void }) {
  const needs = c.status === "needs";
  return (
    <Box
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 2,
        py: 2,
        cursor: "pointer",
        borderTop: `1px solid ${tokens.color.borderSubtle}`,
        "&:hover": { bgcolor: tokens.color.sunken },
      }}
    >
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
          <Typography sx={{ fontSize: 14, fontWeight: 700 }}>{c.title}</Typography>
          <Tag status={c.status} />
          <Typography sx={{ fontSize: 11, color: tokens.color.textMuted }}>#{c.id}</Typography>
        </Box>
        <Typography sx={{ mt: 0.5, fontSize: 12, color: tokens.color.textMuted }}>{meta(c)}</Typography>
        <Typography sx={{ mt: 0.5, fontSize: 13 }}>“{c.message}”</Typography>
        {needs && c.respondBy ? (
          <Box sx={{ mt: 0.5, display: "flex", alignItems: "center", gap: 0.5, fontSize: 11, fontWeight: 600, color: "#8a5a00" }}>
            <ScheduleOutlined sx={{ fontSize: 13 }} /> Respond by {c.respondBy}
          </Box>
        ) : (
          c.outcome && (
            <Typography
              sx={{
                mt: 0.5,
                fontSize: 11,
                fontWeight: 600,
                color: c.status === "review" ? tokens.color.info : c.outcome.good ? tokens.color.success : tokens.color.error,
              }}
            >
              {c.outcome.text}
            </Typography>
          )
        )}
      </Box>
      {needs ? (
        <ButtonBase
          component="span"
          sx={{ height: 40, px: 2.5, fontSize: 14, fontWeight: 700, borderRadius: "10px", color: "#fff", bgcolor: tokens.color.primary }}
        >
          Respond
        </ButtonBase>
      ) : (
        <ChevronRightRounded sx={{ color: tokens.color.textSubtle }} />
      )}
    </Box>
  );
}

function Fact({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography sx={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.4px", color: tokens.color.textMuted }}>
        {label}
      </Typography>
      <Typography sx={{ fontSize: 14, fontWeight: 700 }}>{value}</Typography>
      {sub && <Typography sx={{ fontSize: 11, color: tokens.color.textMuted }}>{sub}</Typography>}
    </Box>
  );
}

/** One complaint in full, with the response form while it still needs one. */
function Detail({
  c,
  onBack,
  onSend,
  onAccept,
}: {
  c: Complaint;
  onBack: () => void;
  onSend: (text: string) => void;
  onAccept: () => void;
}) {
  const [text, setText] = useState(c.response ?? ""),
    [photos, setPhotos] = useState<File[]>([]),
    pick = useRef<HTMLInputElement>(null),
    needs = c.status === "needs";
  return (
    <>
      <Box sx={{ px: 3, pt: 2.5, pb: 2, borderBottom: `1px solid ${tokens.color.borderSubtle}` }}>
        <ButtonBase onClick={onBack} sx={{ gap: 0.5, fontSize: 12, fontWeight: 600, color: tokens.color.primary }}>
          <ArrowBackRounded sx={{ fontSize: 14 }} /> All complaints
        </ButtonBase>
        <Box sx={{ mt: 0.5, display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
          <Typography component="h2" sx={{ fontSize: 18, fontWeight: 700 }}>
            {c.title}
          </Typography>
          <Tag status={c.status} />
        </Box>
        <Typography sx={{ fontSize: 12, color: tokens.color.textMuted }}>
          Complaint #{c.id} · raised {c.raised.replace(/^Today/, "today").replace(/^Yesterday/, "yesterday")}
        </Typography>
      </Box>
      <Box sx={{ p: 3, display: "grid", gap: 2.5 }}>
        <Box
          sx={{
            display: "grid",
            gap: 2,
            p: 2,
            borderRadius: "12px",
            border: `1px solid ${tokens.color.border}`,
            gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" },
          }}
        >
          <Fact label="ORDER" value={`#${c.order}`} sub={`${formatRupees(c.orderAmount)} · ${c.payment}`} />
          <Fact label="PASSENGER" value={c.passenger} sub={`${c.train} · ${c.seat}`} />
          <Fact label="RIDER" value={c.rider} sub={c.pickedUp} />
          <Fact label="HANDED OVER" value={c.handedOver} sub={c.handedOverNote} />
        </Box>
        <Box sx={{ p: 2, borderRadius: "12px", bgcolor: tokens.color.page }}>
          <Typography sx={{ fontSize: 12 }}>
            <b>Passenger says</b>{" "}
            <Box component="span" sx={{ color: tokens.color.textMuted }}>
              · {c.raised}
            </Box>
          </Typography>
          <Typography sx={{ mt: 1.5, fontSize: 14 }}>{c.message}</Typography>
          <Box
            aria-label="Photo from the passenger"
            sx={{ mt: 1.5, width: 74, height: 74, borderRadius: "10px", background: "linear-gradient(135deg, #e8d3b8, #c9a479)" }}
          />
          <Typography sx={{ mt: 1.5, fontSize: 12, color: tokens.color.textMuted }}>
            Asked for:{" "}
            <b style={{ color: tokens.color.text }}>
              {c.asked.label} {formatRupees(c.asked.amount)}
            </b>
          </Typography>
        </Box>
        {needs ? (
          <>
            <Box>
              <Typography sx={{ fontSize: 15, fontWeight: 700 }}>Your response</Typography>
              <Typography sx={{ fontSize: 12, color: tokens.color.textMuted }}>
                Only TrainDhaba support sees this. Respond by {c.respondBy}.
              </Typography>
              <InputBase
                multiline
                minRows={4}
                fullWidth
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Tell us your side: what happened and when."
                inputProps={{ "aria-label": "Your response" }}
                sx={{ mt: 1.5, p: 1.5, fontSize: 14, borderRadius: "10px", border: `1px solid ${tokens.color.borderInput}` }}
              />
            </Box>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                p: 1.5,
                borderRadius: "10px",
                border: `1px dashed ${tokens.color.borderInput}`,
                bgcolor: tokens.color.page,
              }}
            >
              <UploadOutlined sx={{ color: tokens.color.primary }} />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <ButtonBase
                  disabled={photos.length >= MAX_PHOTOS}
                  onClick={() => pick.current?.click()}
                  sx={{ fontSize: 13, color: tokens.color.text }}
                >
                  <b style={{ color: tokens.color.primary }}>Add photos</b>&nbsp;of packing or handover
                </ButtonBase>
                <Typography sx={{ fontSize: 11, color: tokens.color.textMuted }}>
                  {photos.length
                    ? photos.map((p) => p.name).join(", ")
                    : `Optional · JPG or PNG · up to ${MAX_PHOTOS} photos`}
                </Typography>
              </Box>
              {photos.length > 0 && (
                <ButtonBase onClick={() => setPhotos([])} sx={{ fontSize: 12, fontWeight: 600, color: tokens.color.primary }}>
                  <PhotoCameraOutlined sx={{ fontSize: 14, mr: 0.5 }} /> Clear
                </ButtonBase>
              )}
              <input
                ref={pick}
                type="file"
                hidden
                multiple
                accept="image/jpeg,image/png"
                onChange={(e) => {
                  const chosen = [...(e.target.files ?? [])].filter((f) => /^image\/(jpeg|png)$/.test(f.type));
                  setPhotos((old) => [...old, ...chosen].slice(0, MAX_PHOTOS));
                  e.target.value = "";
                }}
              />
            </Box>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1.4fr" }, gap: 1.5 }}>
              <ButtonBase
                onClick={onAccept}
                sx={{ height: 48, fontSize: 14, fontWeight: 700, borderRadius: "10px", border: `1px solid ${tokens.color.borderInput}` }}
              >
                Accept refund
              </ButtonBase>
              <ButtonBase
                disabled={!text.trim()}
                onClick={() => onSend(text.trim())}
                sx={{
                  height: 48,
                  fontSize: 14,
                  fontWeight: 700,
                  borderRadius: "10px",
                  color: "#fff",
                  bgcolor: tokens.color.primary,
                  "&.Mui-disabled": { opacity: 0.5, color: "#fff" },
                }}
              >
                Send response
              </ButtonBase>
            </Box>
          </>
        ) : (
          <Box>
            {c.response && (
              <Box sx={{ mb: 1.5 }}>
                <Typography sx={{ fontSize: 15, fontWeight: 700 }}>Your response</Typography>
                <Typography sx={{ mt: 0.5, fontSize: 14 }}>{c.response}</Typography>
              </Box>
            )}
            {c.outcome && (
              <Typography
                sx={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: c.status === "review" ? tokens.color.info : c.outcome.good ? tokens.color.success : tokens.color.error,
                }}
              >
                {c.outcome.text}
              </Typography>
            )}
          </Box>
        )}
      </Box>
    </>
  );
}

/**
 * Complaints raised by passengers: the list with its filters, and one complaint
 * in full. DESIGN ONLY: the backend has no complaints API yet, so the list is
 * sample data (models/complaints.ts) and Send response / Accept refund only
 * change it here, until the page is refreshed. Photos are chosen but not sent.
 */
export function ComplaintsPane() {
  const [items, setItems] = useState<Complaint[]>(complaintsSample),
    [filter, setFilter] = useState<Filter>("needs"),
    [openId, setOpenId] = useState<string | null>(null),
    count = (status: ComplaintStatus) => items.filter((c) => c.status === status).length,
    shown = filter === "all" ? items : items.filter((c) => c.status === filter),
    open = items.find((c) => c.id === openId);
  const update = (id: string, patch: Partial<Complaint>) =>
    setItems((old) => old.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  if (open)
    return (
      <Detail
        key={open.id}
        c={open}
        onBack={() => setOpenId(null)}
        onSend={(text) => {
          update(open.id, {
            status: "review",
            response: text,
            outcome: { text: "You responded · TrainDhaba support is checking", good: true },
          });
          setOpenId(null);
          setFilter("review");
        }}
        onAccept={() => {
          update(open.id, {
            status: "resolved",
            outcome: {
              text: `${formatRupees(open.asked.amount)} refunded to passenger · taken from your next payout`,
              good: false,
            },
          });
          setOpenId(null);
          setFilter("resolved");
        }}
      />
    );
  return (
    <>
      <PaneHeading title="Complaints" subtitle="Raised by passengers and handled by TrainDhaba support with you." />
      <Box sx={{ p: 3, display: "grid", gap: 2 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            px: 2,
            py: 1.25,
            borderRadius: "10px",
            color: tokens.color.info,
            bgcolor: tokens.color.infoBg,
          }}
        >
          <InfoOutlined sx={{ fontSize: 17 }} />
          <Typography sx={{ fontSize: 13 }}>
            Reply within 3 hours with your side. If no response, TrainDhaba decides on the complaint and any refund is
            taken from your payout.
          </Typography>
        </Box>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
          <Chip label="Needs response" count={count("needs")} on={filter === "needs"} onClick={() => setFilter("needs")} />
          <Chip label="In review" count={count("review")} on={filter === "review"} onClick={() => setFilter("review")} />
          <Chip label="Resolved" count={count("resolved")} on={filter === "resolved"} onClick={() => setFilter("resolved")} />
          <Chip label="All" count={items.length} on={filter === "all"} onClick={() => setFilter("all")} />
        </Box>
        <Box>
          {shown.length === 0 ? (
            <Typography sx={{ py: 4, textAlign: "center", fontSize: 14, color: tokens.color.textMuted }}>
              No complaints here.
            </Typography>
          ) : (
            shown.map((c) => <Row key={c.id} c={c} onOpen={() => setOpenId(c.id)} />)
          )}
        </Box>
      </Box>
    </>
  );
}

/** Open complaints (waiting on you or on support), for the profile menu's hint. */
export const openComplaints = (items: Complaint[] = complaintsSample) =>
  items.filter((c) => c.status !== "resolved").length;
