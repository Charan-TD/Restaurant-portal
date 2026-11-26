"use client";
import { useState } from "react";
import { Box, ButtonBase, InputBase, Typography } from "@mui/material";
import ArrowBackRounded from "@mui/icons-material/ArrowBackRounded";
import ChevronRightRounded from "@mui/icons-material/ChevronRightRounded";
import InfoOutlined from "@mui/icons-material/InfoOutlined";
import SearchRounded from "@mui/icons-material/SearchRounded";
import { DEMO_MODE } from "@/core/constants/config";
import { ToastAlert } from "@/core/providers/ToastProvider";
import { tokens } from "@/core/theme/tokens";
import { errorMessage } from "@/shared/utils/errors";
import { statusLabel, type Complaint, type ComplaintStatus } from "../models/complaints";
import {
  useGetComplaintCountsQuery,
  useGetComplaintQuery,
  useGetComplaintsQuery,
  useReplyToComplaintMutation,
} from "../services/complaintApi";
import { PaneHeading } from "./PaneHeading";

type Filter = ComplaintStatus | "ALL";
const MAX_REPLY = 5000;
const TAGS: Record<ComplaintStatus, { fg: string; bg: string }> = {
  PENDING: { fg: "#8a5a00", bg: "#fff4d6" },
  REPLIED: { fg: tokens.color.info, bg: tokens.color.infoBg },
  RESOLVED: { fg: tokens.color.success, bg: tokens.color.successBg },
};

const when = (iso: string) =>
  Number.isNaN(Date.parse(iso))
    ? ""
    : new Date(iso).toLocaleString("en-IN", {
        day: "numeric",
        month: "short",
        hour: "numeric",
        minute: "2-digit",
      });

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

function Chip({ label, count, on, onClick }: { label: string; count?: number; on: boolean; onClick: () => void }) {
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
      {count !== undefined && (
        <Box component="span" sx={{ color: on ? tokens.color.primary : tokens.color.textMuted }}>
          {count}
        </Box>
      )}
    </ButtonBase>
  );
}

/** One line of the list. */
function Row({ c, onOpen }: { c: Complaint; onOpen: () => void }) {
  const needs = c.status === "PENDING";
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
          <Typography sx={{ fontSize: 14, fontWeight: 700 }}>{c.category}</Typography>
          <Tag status={c.status} />
          <Typography sx={{ fontSize: 11, color: tokens.color.textMuted }}>{c.number}</Typography>
        </Box>
        <Typography sx={{ mt: 0.5, fontSize: 12, color: tokens.color.textMuted }}>
          Order {c.order} · {c.customer} · {when(c.createdAt)}
        </Typography>
        {c.description && <Typography sx={{ mt: 0.5, fontSize: 13 }}>“{c.description}”</Typography>}
      </Box>
      {needs ? (
        <ButtonBase
          component="span"
          sx={{ height: 40, px: 2.5, fontSize: 14, fontWeight: 700, borderRadius: "10px", color: "#fff", bgcolor: tokens.color.primary }}
        >
          Reply
        </ButtonBase>
      ) : (
        <ChevronRightRounded sx={{ color: tokens.color.textSubtle }} />
      )}
    </Box>
  );
}

/** One complaint with its conversation, and the reply form until it is resolved. */
function Detail({ id, onBack }: { id: string; onBack: () => void }) {
  const { data: c, isLoading, error } = useGetComplaintQuery(id),
    [reply, { isLoading: sending }] = useReplyToComplaintMutation(),
    [text, setText] = useState(""),
    [problem, setProblem] = useState("");
  async function send() {
    setProblem("");
    try {
      await reply({ id, message: text.trim() }).unwrap();
      setText("");
    } catch (e) {
      setProblem(errorMessage(e));
    }
  }
  return (
    <>
      <Box sx={{ px: 3, pt: 2.5, pb: 2, borderBottom: `1px solid ${tokens.color.borderSubtle}` }}>
        <ButtonBase onClick={onBack} sx={{ gap: 0.5, fontSize: 12, fontWeight: 600, color: tokens.color.primary }}>
          <ArrowBackRounded sx={{ fontSize: 14 }} /> All complaints
        </ButtonBase>
        {c && (
          <>
            <Box sx={{ mt: 0.5, display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
              <Typography component="h2" sx={{ fontSize: 18, fontWeight: 700 }}>
                {c.category}
              </Typography>
              <Tag status={c.status} />
            </Box>
            <Typography sx={{ fontSize: 12, color: tokens.color.textMuted }}>
              {c.number} · Order {c.order} · {c.customer} · raised {when(c.createdAt)}
              {c.resolvedAt ? ` · resolved ${when(c.resolvedAt)}` : ""}
            </Typography>
          </>
        )}
      </Box>
      <Box sx={{ p: 3, display: "grid", gap: 2 }}>
        {error && <ToastAlert severity="error">{errorMessage(error)}</ToastAlert>}
        {isLoading && <Typography sx={{ fontSize: 14, color: tokens.color.textMuted }}>Loading…</Typography>}
        {c && (
          <>
            <Box sx={{ p: 2, borderRadius: "12px", bgcolor: tokens.color.page }}>
              <Typography sx={{ fontSize: 12 }}>
                <b>{c.customer} says</b>
              </Typography>
              <Typography sx={{ mt: 1, fontSize: 14 }}>{c.description || "No details given."}</Typography>
            </Box>
            {c.messages.map((m) => {
              const mine = m.from === "RESTAURANT";
              return (
                <Box
                  key={m.id}
                  sx={{
                    p: 1.5,
                    maxWidth: "85%",
                    justifySelf: mine ? "end" : "start",
                    borderRadius: "12px",
                    bgcolor: mine ? tokens.color.primarySubtle : tokens.color.page,
                    border: `1px solid ${mine ? tokens.color.primarySubtleBorder : tokens.color.border}`,
                  }}
                >
                  <Typography sx={{ fontSize: 11, color: tokens.color.textMuted }}>
                    <b>{mine ? "You" : c.customer}</b> · {when(m.at)}
                  </Typography>
                  <Typography sx={{ mt: 0.5, fontSize: 14, whiteSpace: "pre-wrap" }}>{m.text}</Typography>
                </Box>
              );
            })}
            {c.status === "RESOLVED" ? (
              <Typography sx={{ fontSize: 13, fontWeight: 600, color: tokens.color.success }}>
                This complaint is resolved. It can no longer be replied to.
              </Typography>
            ) : (
              <Box>
                <Typography sx={{ fontSize: 15, fontWeight: 700 }}>Your reply</Typography>
                <Typography sx={{ fontSize: 12, color: tokens.color.textMuted }}>
                  The passenger sees this. Tell them your side: what happened and what you will do.
                </Typography>
                <InputBase
                  multiline
                  minRows={4}
                  fullWidth
                  value={text}
                  onChange={(e) => setText(e.target.value.slice(0, MAX_REPLY))}
                  placeholder="Write your reply"
                  inputProps={{ "aria-label": "Your reply" }}
                  sx={{ mt: 1.5, p: 1.5, fontSize: 14, borderRadius: "10px", border: `1px solid ${tokens.color.borderInput}` }}
                />
                {problem && (
                  <Typography sx={{ mt: 1, fontSize: 12, color: tokens.color.error }}>{problem}</Typography>
                )}
                <ButtonBase
                  disabled={!text.trim() || sending}
                  onClick={() => void send()}
                  sx={{
                    mt: 1.5,
                    width: "100%",
                    height: 48,
                    fontSize: 14,
                    fontWeight: 700,
                    borderRadius: "10px",
                    color: "#fff",
                    bgcolor: tokens.color.primary,
                    "&.Mui-disabled": { opacity: 0.5, color: "#fff" },
                  }}
                >
                  {sending ? "Sending…" : "Send reply"}
                </ButtonBase>
              </Box>
            )}
          </>
        )}
      </Box>
    </>
  );
}

/**
 * Complaints raised by passengers, from GET /restaurant/complaints: status
 * filter and search on the server, ten per page, and a conversation where the
 * restaurant can reply until the complaint is resolved.
 */
export function ComplaintsPane() {
  const [filter, setFilter] = useState<Filter>("PENDING"),
    [search, setSearch] = useState(""),
    [applied, setApplied] = useState(""),
    [page, setPage] = useState(1),
    [openId, setOpenId] = useState<string | null>(null),
    query = {
      page,
      search: applied,
      status: filter === "ALL" ? undefined : filter,
    },
    { data, isFetching, error } = useGetComplaintsQuery(query, { skip: DEMO_MODE }),
    { data: counts } = useGetComplaintCountsQuery(applied, { skip: DEMO_MODE });
  const choose = (next: Filter) => {
    setFilter(next);
    setPage(1);
  };
  if (openId) return <Detail key={openId} id={openId} onBack={() => setOpenId(null)} />;
  return (
    <>
      <PaneHeading title="Complaints" subtitle="Raised by passengers about their orders. Reply to sort it out." />
      <Box sx={{ p: 3, display: "grid", gap: 2 }}>
        {DEMO_MODE && <ToastAlert severity="info">Complaints are not available in demo mode.</ToastAlert>}
        {error && <ToastAlert severity="error">{errorMessage(error)}</ToastAlert>}
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
          <Typography sx={{ fontSize: 13 }}>Reply with your side. Once a complaint is resolved it is closed.</Typography>
        </Box>
        <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1 }}>
          <Chip label="Needs reply" count={counts?.pending} on={filter === "PENDING"} onClick={() => choose("PENDING")} />
          <Chip label="Replied" count={counts?.replied} on={filter === "REPLIED"} onClick={() => choose("REPLIED")} />
          <Chip label="Resolved" count={counts?.resolved} on={filter === "RESOLVED"} onClick={() => choose("RESOLVED")} />
          <Chip label="All" count={counts?.total} on={filter === "ALL"} onClick={() => choose("ALL")} />
          <Box
            component="form"
            onSubmit={(e) => {
              e.preventDefault();
              setApplied(search);
              setPage(1);
            }}
            sx={{
              ml: "auto",
              display: "flex",
              alignItems: "center",
              gap: 0.5,
              px: 1.25,
              height: 34,
              borderRadius: "17px",
              border: `1px solid ${tokens.color.borderInput}`,
            }}
          >
            <SearchRounded sx={{ fontSize: 17, color: tokens.color.textMuted }} />
            <InputBase
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                if (!e.target.value) {
                  setApplied("");
                  setPage(1);
                }
              }}
              placeholder="Complaint or order number"
              inputProps={{ "aria-label": "Search complaints" }}
              sx={{ fontSize: 13, width: 190 }}
            />
          </Box>
        </Box>
        <Box>
          {!data || data.rows.length === 0 ? (
            <Typography sx={{ py: 4, textAlign: "center", fontSize: 14, color: tokens.color.textMuted }}>
              {isFetching ? "Loading complaints…" : "No complaints here."}
            </Typography>
          ) : (
            data.rows.map((c) => <Row key={c.id} c={c} onOpen={() => setOpenId(c.id)} />)
          )}
        </Box>
        {data && data.pages > 1 && (
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 2 }}>
            <ButtonBase
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              sx={{ px: 1.5, height: 34, fontSize: 13, fontWeight: 600, "&.Mui-disabled": { opacity: 0.4 } }}
            >
              Previous
            </ButtonBase>
            <Typography sx={{ fontSize: 12, color: tokens.color.textMuted }}>
              Page {data.page} of {data.pages}
            </Typography>
            <ButtonBase
              disabled={page >= data.pages}
              onClick={() => setPage((p) => p + 1)}
              sx={{ px: 1.5, height: 34, fontSize: 13, fontWeight: 600, "&.Mui-disabled": { opacity: 0.4 } }}
            >
              Next
            </ButtonBase>
          </Box>
        )}
      </Box>
    </>
  );
}
