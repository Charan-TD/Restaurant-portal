"use client";
import { useMemo, useState } from "react";
import { Box, ButtonBase, InputBase, Menu, MenuItem, Typography } from "@mui/material";
import ExpandMoreRounded from "@mui/icons-material/ExpandMoreRounded";
import ReplyRounded from "@mui/icons-material/ReplyRounded";
import StarRounded from "@mui/icons-material/StarRounded";
import { DEMO_MODE } from "@/core/constants/config";
import { tokens } from "@/core/theme/tokens";
import { errorMessage } from "@/shared/utils/errors";
import { ToastAlert } from "@/core/providers/ToastProvider";
import type { ReviewRow } from "@/features/customers/models/review";
import {
  useGetRatingSummaryQuery,
  useGetReviewsQuery,
} from "@/features/customers/services/reviewApi";
import { PaneHeading } from "./PaneHeading";

type Filter = "all" | "needs" | "positive" | "negative";
type Sort = "newest" | "oldest" | "highest" | "lowest";
const SORTS: { id: Sort; label: string }[] = [
  { id: "newest", label: "Newest" },
  { id: "oldest", label: "Oldest" },
  { id: "highest", label: "Highest rating" },
  { id: "lowest", label: "Lowest rating" },
];
const sorters: Record<Sort, (a: ReviewRow, b: ReviewRow) => number> = {
  newest: (a, b) => b.at.localeCompare(a.at),
  oldest: (a, b) => a.at.localeCompare(b.at),
  highest: (a, b) => b.rating - a.rating,
  lowest: (a, b) => a.rating - b.rating,
};
const QUICK_REPLIES = ["Sorry for the delay", "We will fix this", "Thank you for the feedback"];
const MAX_REPLY = 500;
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

/** What the vendor wrote back to a review. Replies are not saved on the server yet. */
interface Reply {
  text: string;
  at: number;
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
  onPost,
  onCancel,
}: {
  name: string;
  initial: string;
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
          Replies are public. Keep it polite. {text.length}/{MAX_REPLY}
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <ButtonBase onClick={onCancel} sx={{ px: 1.5, height: 36, fontSize: 13, fontWeight: 700 }}>
            Cancel
          </ButtonBase>
          <ButtonBase
            disabled={!text.trim()}
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
            Post reply
          </ButtonBase>
        </Box>
      </Box>
    </Box>
  );
}

/**
 * Ratings & reviews: the average and how the stars spread, then each review
 * with a reply box. Ratings and reviews come from the server
 * (GET /restaurant/reviews and /reviews/rating-summary). DESIGN ONLY: the
 * server has no endpoint to post a reply yet, so replies live in this page
 * and are gone on refresh.
 */
export function ReviewsPane() {
  const { data, isLoading, error } = useGetReviewsQuery(undefined, { skip: DEMO_MODE }),
    { data: summary } = useGetRatingSummaryQuery(undefined, { skip: DEMO_MODE }),
    reviews = useMemo(() => data ?? [], [data]),
    [filter, setFilter] = useState<Filter>("all"),
    [sort, setSort] = useState<Sort>("newest"),
    [anchor, setAnchor] = useState<HTMLElement | null>(null),
    [replies, setReplies] = useState<Record<string, Reply>>({}),
    [writing, setWriting] = useState<string | null>(null),
    [now] = useState(() => Date.now());
  const needs = reviews.filter((r) => !replies[r.id]),
    positive = reviews.filter((r) => r.rating >= 4),
    negative = reviews.filter((r) => r.rating <= 2),
    shown = (
      filter === "needs" ? needs : filter === "positive" ? positive : filter === "negative" ? negative : reviews
    )
      .slice()
      .sort(sorters[sort]);
  const total = summary?.total ?? 0;
  return (
    <>
      <PaneHeading title="Ratings & reviews" subtitle="What passengers say about your food. Reply to show you care." />
      <Box sx={{ p: 3, display: "grid", gap: 2.5 }}>
        {error && <ToastAlert severity="error">{errorMessage(error)}</ToastAlert>}
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
              {total.toLocaleString("en-IN")} {total === 1 ? "rating" : "ratings"} ·{" "}
              {reviews.length.toLocaleString("en-IN")} {reviews.length === 1 ? "review" : "reviews"}
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
          <Chip on={filter === "all"} onClick={() => setFilter("all")}>{`All ${reviews.length}`}</Chip>
          <Chip on={filter === "needs"} onClick={() => setFilter("needs")}>{`Needs reply ${needs.length}`}</Chip>
          <Chip on={filter === "positive"} onClick={() => setFilter("positive")}>{`Positive ${positive.length}`}</Chip>
          <Chip on={filter === "negative"} onClick={() => setFilter("negative")}>{`Negative ${negative.length}`}</Chip>
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
          {shown.length === 0 ? (
            <Typography sx={{ py: 4, textAlign: "center", fontSize: 14, color: tokens.color.textMuted }}>
              {isLoading ? "Loading reviews…" : "No reviews here yet."}
            </Typography>
          ) : (
            shown.map((r) => {
              const reply = replies[r.id],
                a = tone(r.name);
              return (
                <Box key={r.id} sx={{ py: 2.5, borderTop: `1px solid ${tokens.color.borderSubtle}` }}>
                  <Box sx={{ display: "flex", gap: 1.5 }}>
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        flexShrink: 0,
                        display: "grid",
                        placeItems: "center",
                        borderRadius: "50%",
                        fontSize: 12,
                        fontWeight: 700,
                        color: a.fg,
                        bgcolor: a.bg,
                        ...(r.photo && { backgroundImage: `url(${r.photo})`, backgroundSize: "cover" }),
                      }}
                    >
                      {!r.photo && initials(r.name)}
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
                      {r.items.length > 0 && (
                        <Box sx={{ mt: 1, display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                          {r.items.map((item) => (
                            <Box
                              key={item.name}
                              component="span"
                              sx={{ px: 1, fontSize: 11, lineHeight: "22px", borderRadius: "6px", bgcolor: tokens.color.muted }}
                            >
                              {item.name}
                            </Box>
                          ))}
                        </Box>
                      )}
                      {writing === r.id ? (
                        <ReplyBox
                          name={r.name}
                          initial={reply?.text ?? ""}
                          onCancel={() => setWriting(null)}
                          onPost={(text) => {
                            setReplies((old) => ({ ...old, [r.id]: { text, at: Date.now() } }));
                            setWriting(null);
                          }}
                        />
                      ) : reply ? (
                        <Box
                          sx={{
                            mt: 1.5,
                            p: 1.5,
                            borderRadius: "8px",
                            borderLeft: `3px solid ${tokens.color.primary}`,
                            bgcolor: tokens.color.page,
                          }}
                        >
                          <Box sx={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
                            <span>
                              <b>Your reply</b>{" "}
                              <Box component="span" sx={{ color: tokens.color.textMuted }}>
                                · {when(new Date(reply.at).toISOString(), now).toLowerCase()}
                              </Box>
                            </span>
                            <ButtonBase onClick={() => setWriting(r.id)} sx={{ fontSize: 11, fontWeight: 600, color: tokens.color.primary }}>
                              Edit
                            </ButtonBase>
                          </Box>
                          <Typography sx={{ mt: 0.5, fontSize: 13 }}>{reply.text}</Typography>
                        </Box>
                      ) : (
                        <Box sx={{ mt: 1.5, display: "flex", alignItems: "center", gap: 1.5 }}>
                          <ButtonBase
                            onClick={() => setWriting(r.id)}
                            sx={{
                              gap: 0.75,
                              height: 36,
                              px: 1.75,
                              fontSize: 13,
                              fontWeight: 600,
                              borderRadius: "8px",
                              border: `1px solid ${tokens.color.borderInput}`,
                            }}
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
      </Box>
    </>
  );
}
