"use client";
import { useState } from "react";
import { Box, ButtonBase, InputBase, Menu, MenuItem, Typography } from "@mui/material";
import ExpandMoreRounded from "@mui/icons-material/ExpandMoreRounded";
import ReplyRounded from "@mui/icons-material/ReplyRounded";
import SearchRounded from "@mui/icons-material/SearchRounded";
import StarRounded from "@mui/icons-material/StarRounded";
import { DEMO_MODE } from "@/core/constants/config";
import { tokens } from "@/core/theme/tokens";
import { errorMessage } from "@/shared/utils/errors";
import { ToastAlert } from "@/core/providers/ToastProvider";
import type { ReplyFilter, ReviewRow, ReviewSort } from "@/features/customers/models/review";
import {
  useGetRatingSummaryQuery,
  useGetReviewsQuery,
  useReplyToReviewMutation,
  useResubmitReviewReplyMutation,
} from "@/features/customers/services/reviewApi";
import { PaneHeading } from "./PaneHeading";

type Filter = ReplyFilter | "ALL";
const SORTS: { id: ReviewSort; label: string }[] = [
  { id: "newest", label: "Newest" },
  { id: "oldest", label: "Oldest" },
  { id: "highest_rating", label: "Highest rating" },
  { id: "lowest_rating", label: "Lowest rating" },
];
const QUICK_REPLIES = ["Sorry for the delay", "We will fix this", "Thank you for the feedback"];
const MAX_REPLY = 5000;
/** Bar colour for each star count. */
const BAR: Record<number, string> = { 5: tokens.color.success, 4: tokens.color.success, 3: "#e8a317", 2: tokens.color.error, 1: tokens.color.error };

/** "Today, 3:10 PM", "Yesterday", "2 days ago", then the date. */
function when(iso: string, now: number) {
  const at = Date.parse(iso);
  if (!at) return "";
  const day = (t: number) => {
      const d = new Date(t);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    },
    days = Math.round((day(now) - day(at)) / 86_400_000);
  if (days <= 0)
    return `Today, ${new Date(at)
      .toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true })
      .replace(/\b(am|pm)\b/, (m) => m.toUpperCase())}`;
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return new Date(at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

const initials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
const AVATARS = [
  { fg: "#c0392b", bg: "#fdecea" },
  { fg: "#8a5a00", bg: "#fff4d6" },
  { fg: "#1e7a4c", bg: "#e6f4ec" },
  { fg: "#1a56b0", bg: "#e8f0fe" },
];
const tone = (name: string) => AVATARS[[...name].reduce((h, c) => (h + c.charCodeAt(0)) % AVATARS.length, 0)];

function Stars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <Box component="span" sx={{ display: "inline-flex" }} aria-label={`${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <StarRounded key={n} sx={{ fontSize: size, color: n <= Math.round(value) ? "#f0a500" : "#d6dad6" }} />
      ))}
    </Box>
  );
}

function Chip({ children, on, onClick }: { children: string; on?: boolean; onClick: () => void }) {
  return (
    <ButtonBase
      onClick={onClick}
      aria-pressed={on}
      sx={{
        px: 1.5,
        height: 32,
        fontSize: 12,
        fontWeight: 600,
        borderRadius: "16px",
        color: on ? tokens.color.primary : tokens.color.text,
        bgcolor: on ? tokens.color.primarySubtle : tokens.color.card,
        border: `1px solid ${on ? tokens.color.primary : tokens.color.borderInput}`,
      }}
    >
      {children}
    </ButtonBase>
  );
}

/** The reply box under a review. */
function ReplyBox({
  name,
  initial,
  busy,
  onPost,
  onCancel,
}: {
  name: string;
  initial: string;
  busy?: boolean;
  onPost: (text: string) => void;
  onCancel: () => void;
}) {
  const [text, setText] = useState(initial);
  return (
    <Box sx={{ mt: 1.5, p: 1.5, borderRadius: "12px", border: `1px solid ${tokens.color.primary}` }}>
      <InputBase
        multiline
        minRows={2}
        autoFocus
        fullWidth
        value={text}
        onChange={(e) => setText(e.target.value.slice(0, MAX_REPLY))}
        placeholder={`Reply to ${name}`}
        inputProps={{ "aria-label": "Your reply" }}
        sx={{ fontSize: 13 }}
      />
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, my: 1 }}>
        {QUICK_REPLIES.map((q) => (
          <Chip key={q} onClick={() => setText((t) => (t ? `${t.trimEnd()} ${q}.` : `${q}.`).slice(0, MAX_REPLY))}>
            {q}
          </Chip>
        ))}
      </Box>
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1,
          pt: 1,
          borderTop: `1px solid ${tokens.color.borderSubtle}`,
        }}
      >
        <Typography sx={{ fontSize: 11, color: tokens.color.textMuted }}>
          A TrainDhaba admin approves replies before they show. Keep it polite.
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <ButtonBase onClick={onCancel} sx={{ px: 1.5, height: 36, fontSize: 13, fontWeight: 700 }}>
            Cancel
          </ButtonBase>
          <ButtonBase
            disabled={!text.trim() || busy}
            onClick={() => onPost(text.trim())}
            sx={{
              px: 2,
              height: 36,
              fontSize: 13,
              fontWeight: 700,
              borderRadius: "8px",
              color: "#fff",
              bgcolor: tokens.color.primary,
              "&.Mui-disabled": { opacity: 0.5, color: "#fff" },
            }}
          >
            {busy ? "Sending…" : "Send for approval"}
          </ButtonBase>
        </Box>
      </Box>
    </Box>
  );
}

const REPLY_TAG = {
  APPROVED: { label: "APPROVED", fg: tokens.color.success, bg: tokens.color.successBg },
  REJECTED: { label: "NOT APPROVED", fg: tokens.color.error, bg: tokens.color.errorBg },
  PENDING_APPROVAL: { label: "AWAITING APPROVAL", fg: "#8a5a00", bg: "#fff4d6" },
} as const;

function Pager({ page, pages, onPage }: { page: number; pages: number; onPage: (p: number) => void }) {
  const btn = { px: 1.5, height: 34, fontSize: 13, fontWeight: 600, "&.Mui-disabled": { opacity: 0.4 } };
  return (
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 2 }}>
      <ButtonBase disabled={page <= 1} onClick={() => onPage(page - 1)} sx={btn}>
        Previous
      </ButtonBase>
      <Typography sx={{ fontSize: 12, color: tokens.color.textMuted }}>
        Page {page} of {pages}
      </Typography>
      <ButtonBase disabled={page >= pages} onClick={() => onPage(page + 1)} sx={btn}>
        Next
      </ButtonBase>
    </Box>
  );
}

/**
 * Ratings & reviews: the average and how the stars spread, then each review
 * with its reply. Everything comes from GET /restaurant/reviews and
 * /reviews/metrics, filtered and paged on the server. A reply goes to the
 * server and waits for admin approval; a rejected one can be reworded.
 */
export function ReviewsPane() {
  const [filter, setFilter] = useState<Filter>("ALL"),
    [sort, setSort] = useState<ReviewSort>("newest"),
    [page, setPage] = useState(1),
    [search, setSearch] = useState(""),
    [applied, setApplied] = useState(""),
    [anchor, setAnchor] = useState<HTMLElement | null>(null),
    [writing, setWriting] = useState<string | null>(null),
    [problem, setProblem] = useState(""),
    [now] = useState(() => Date.now()),
    { data, isFetching, error } = useGetReviewsQuery(
      { page, sort, search: applied, replyStatus: filter === "ALL" ? undefined : filter },
      { skip: DEMO_MODE },
    ),
    { data: summary } = useGetRatingSummaryQuery(undefined, { skip: DEMO_MODE }),
    [postReply, { isLoading: posting }] = useReplyToReviewMutation(),
    [resubmit, { isLoading: resubmitting }] = useResubmitReviewReplyMutation(),
    reviews = data?.rows ?? [],
    total = summary?.total ?? 0,
    replies = summary?.replies;
  const choose = (next: Filter) => {
    setFilter(next);
    setPage(1);
  };
  async function send(r: ReviewRow, text: string) {
    setProblem("");
    try {
      await (r.reply ? resubmit({ id: r.id, text }) : postReply({ id: r.id, text })).unwrap();
      setWriting(null);
    } catch (e) {
      setProblem(errorMessage(e));
    }
  }
  return (
    <>
      <PaneHeading title="Ratings & reviews" subtitle="What passengers say about your food. Reply to show you care." />
      <Box sx={{ p: 3, display: "grid", gap: 2.5 }}>
        {error && <ToastAlert severity="error">{errorMessage(error)}</ToastAlert>}
        {problem && <ToastAlert severity="error">{problem}</ToastAlert>}
        <Box
          sx={{
            display: "grid",
            gap: 3,
            alignItems: "center",
            gridTemplateColumns: { xs: "1fr", sm: "180px minmax(0, 1fr)" },
            p: 2.5,
            borderRadius: "12px",
            border: `1px solid ${tokens.color.border}`,
          }}
        >
          <Box sx={{ textAlign: "center" }}>
            <Typography sx={{ fontSize: 40, lineHeight: "48px", fontWeight: 700 }}>
              {summary?.average == null ? "—" : summary.average.toFixed(1)}
            </Typography>
            <Stars value={summary?.average ?? 0} size={18} />
            <Typography sx={{ mt: 0.5, fontSize: 11, color: tokens.color.textMuted }}>
              {total.toLocaleString("en-IN")} {total === 1 ? "review" : "reviews"}
            </Typography>
          </Box>
          <Box sx={{ display: "grid", gap: 0.75 }}>
            {[5, 4, 3, 2, 1].map((star) => {
              const count = summary?.counts[star as 1 | 2 | 3 | 4 | 5] ?? 0,
                percent = total ? Math.round((count / total) * 100) : 0;
              return (
                <Box key={star} sx={{ display: "flex", alignItems: "center", gap: 1.25, fontSize: 12 }}>
                  <Box component="span" sx={{ width: 22 }}>
                    {star} ★
                  </Box>
                  <Box sx={{ flex: 1, height: 6, borderRadius: 3, bgcolor: tokens.color.muted }}>
                    <Box sx={{ width: `${percent}%`, height: "100%", borderRadius: 3, bgcolor: BAR[star] }} />
                  </Box>
                  <Box component="span" sx={{ width: 32, textAlign: "right", color: tokens.color.textMuted }}>
                    {percent}%
                  </Box>
                </Box>
              );
            })}
          </Box>
        </Box>
        <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1 }}>
          <Chip on={filter === "ALL"} onClick={() => choose("ALL")}>{`All ${total}`}</Chip>
          <Chip on={filter === "NOT_REPLIED"} onClick={() => choose("NOT_REPLIED")}>{`Needs reply ${replies?.notReplied ?? 0}`}</Chip>
          <Chip on={filter === "PENDING_APPROVAL"} onClick={() => choose("PENDING_APPROVAL")}>{`Awaiting approval ${replies?.pending ?? 0}`}</Chip>
          <Chip on={filter === "APPROVED"} onClick={() => choose("APPROVED")}>{`Approved ${replies?.approved ?? 0}`}</Chip>
          <Chip on={filter === "REJECTED"} onClick={() => choose("REJECTED")}>{`Not approved ${replies?.rejected ?? 0}`}</Chip>
        </Box>
        <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1 }}>
          <Box
            component="form"
            onSubmit={(e) => {
              e.preventDefault();
              setApplied(search);
              setPage(1);
            }}
            sx={{ display: "flex", alignItems: "center", gap: 0.5, px: 1.25, height: 32, borderRadius: "8px", border: `1px solid ${tokens.color.borderInput}` }}
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
              placeholder="Review text or order number"
              inputProps={{ "aria-label": "Search reviews" }}
              sx={{ fontSize: 12, width: 200 }}
            />
          </Box>
          <ButtonBase
            onClick={(e) => setAnchor(e.currentTarget)}
            aria-haspopup="menu"
            sx={{
              ml: "auto",
              gap: 0.5,
              height: 32,
              px: 1.5,
              fontSize: 12,
              borderRadius: "8px",
              color: tokens.color.textMuted,
              border: `1px solid ${tokens.color.borderInput}`,
            }}
          >
            Sort: <b style={{ color: tokens.color.text }}>{SORTS.find((s) => s.id === sort)?.label}</b>
            <ExpandMoreRounded sx={{ fontSize: 16 }} />
          </ButtonBase>
          <Menu anchorEl={anchor} open={!!anchor} onClose={() => setAnchor(null)}>
            {SORTS.map((s) => (
              <MenuItem
                key={s.id}
                selected={s.id === sort}
                onClick={() => {
                  setSort(s.id);
                  setPage(1);
                  setAnchor(null);
                }}
                sx={{ fontSize: 13 }}
              >
                {s.label}
              </MenuItem>
            ))}
          </Menu>
        </Box>
        <Box>
          {reviews.length === 0 ? (
            <Typography sx={{ py: 4, textAlign: "center", fontSize: 14, color: tokens.color.textMuted }}>
              {isFetching ? "Loading reviews…" : "No reviews here yet."}
            </Typography>
          ) : (
            reviews.map((r) => {
              const reply = r.reply,
                a = tone(r.name),
                tag = reply ? REPLY_TAG[reply.status] : undefined;
              return (
                <Box key={r.id} sx={{ py: 2.5, borderTop: `1px solid ${tokens.color.borderSubtle}` }}>
                  <Box sx={{ display: "flex", gap: 1.5 }}>
                    <Box
                      sx={{ width: 36, height: 36, flexShrink: 0, display: "grid", placeItems: "center", borderRadius: "50%", fontSize: 12, fontWeight: 700, color: a.fg, bgcolor: a.bg }}
                    >
                      {initials(r.name)}
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Typography sx={{ fontSize: 14, fontWeight: 700 }}>{r.name}</Typography>
                        <Stars value={r.rating} />
                        <Typography sx={{ ml: "auto", fontSize: 11, color: tokens.color.textMuted, whiteSpace: "nowrap" }}>
                          {when(r.at, now)}
                        </Typography>
                      </Box>
                      <Typography sx={{ fontSize: 11, color: tokens.color.textMuted }}>Order {r.orderId}</Typography>
                      {r.comment && <Typography sx={{ mt: 1, fontSize: 13 }}>{r.comment}</Typography>}
                      {writing === r.id ? (
                        <ReplyBox
                          name={r.name}
                          initial={reply?.text ?? ""}
                          busy={posting || resubmitting}
                          onCancel={() => setWriting(null)}
                          onPost={(text) => void send(r, text)}
                        />
                      ) : reply && tag ? (
                        <Box
                          sx={{ mt: 1.5, p: 1.5, borderRadius: "8px", borderLeft: `3px solid ${tokens.color.primary}`, bgcolor: tokens.color.page }}
                        >
                          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11, gap: 1 }}>
                            <span>
                              <b>Your reply</b>
                              <Box
                                component="span"
                                sx={{ ml: 1, px: 0.75, fontSize: 10, lineHeight: "18px", fontWeight: 700, borderRadius: "6px", color: tag.fg, bgcolor: tag.bg }}
                              >
                                {tag.label}
                              </Box>
                            </span>
                            {reply.canEdit && (
                              <ButtonBase onClick={() => setWriting(r.id)} sx={{ fontSize: 11, fontWeight: 600, color: tokens.color.primary }}>
                                Edit and resend
                              </ButtonBase>
                            )}
                          </Box>
                          <Typography sx={{ mt: 0.5, fontSize: 13 }}>{reply.text}</Typography>
                          {reply.status === "REJECTED" && reply.rejectionReason && (
                            <Typography sx={{ mt: 0.75, fontSize: 12, color: tokens.color.error }}>
                              Reason: {reply.rejectionReason}
                            </Typography>
                          )}
                        </Box>
                      ) : (
                        <Box sx={{ mt: 1.5, display: "flex", alignItems: "center", gap: 1.5 }}>
                          <ButtonBase
                            onClick={() => setWriting(r.id)}
                            sx={{ gap: 0.75, height: 36, px: 1.75, fontSize: 13, fontWeight: 600, borderRadius: "8px", border: `1px solid ${tokens.color.borderInput}` }}
                          >
                            <ReplyRounded sx={{ fontSize: 16 }} /> Reply
                          </ButtonBase>
                          <Box
                            component="span"
                            sx={{ px: 1, fontSize: 10, lineHeight: "20px", fontWeight: 700, borderRadius: "6px", color: "#8a5a00", bgcolor: "#fff4d6" }}
                          >
                            NEEDS REPLY
                          </Box>
                        </Box>
                      )}
                    </Box>
                  </Box>
                </Box>
              );
            })
          )}
        </Box>
        {data && data.pages > 1 && <Pager page={data.page} pages={data.pages} onPage={setPage} />}
      </Box>
    </>
  );
}
