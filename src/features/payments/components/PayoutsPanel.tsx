"use client";
import { useState } from "react";
import NextLink from "next/link";
import { Box, ButtonBase, Typography } from "@mui/material";
import AccountBalanceOutlined from "@mui/icons-material/AccountBalanceOutlined";
import CalendarMonthOutlined from "@mui/icons-material/CalendarMonthOutlined";
import ExpandMoreRounded from "@mui/icons-material/ExpandMoreRounded";
import SendOutlined from "@mui/icons-material/SendOutlined";
import { cardHeaderSx, cardSx, tokens } from "@/core/theme/tokens";
import { useToast } from "@/core/providers/ToastProvider";
import { CommonButton } from "@/shared/components/actions/CommonButton";
import { errorMessage } from "@/shared/utils/errors";
import { formatRupees } from "@/shared/utils/format";
import { useGetRestaurantDetailsQuery } from "@/features/profile/services/restaurantApi";
import { breakdownLabel, monthRange, type PayoutStatus } from "../models/payments";
import {
  useGetPaymentBreakdownQuery,
  useGetPaymentSummaryQuery,
  useGetPayoutQuery,
  useGetPayoutsQuery,
  useRequestEmergencyPayoutMutation,
  useRequestRegularPayoutMutation,
} from "../services/paymentApi";

const caption = {
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: "0.5px",
  textTransform: "uppercase",
  color: tokens.color.textMuted,
} as const;

const shortDate = (iso?: string) =>
  iso
    ? new Date(iso).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })
    : "—";
const longDate = (iso?: string) =>
  iso
    ? new Date(iso).toLocaleString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : "—";

/** The design's status pills: Completed shows as PAID, Pending as PROCESSING. */
const STATUS: Record<PayoutStatus, { label: string; color: string; bg: string }> = {
  COMPLETED: { label: "PAID", color: "#1b7f4b", bg: "#e6f4ea" },
  PENDING: { label: "PROCESSING", color: "#8a5a00", bg: "#fff4d6" },
  REJECTED: { label: "REJECTED", color: "#b42318", bg: "#fdecea" },
};
function Pill({ status }: { status: PayoutStatus }) {
  const s = STATUS[status];
  return (
    <Box
      component="span"
      sx={{
        display: "inline-block",
        px: 1,
        py: 0.25,
        borderRadius: "6px",
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "0.4px",
        color: s.color,
        bgcolor: s.bg,
      }}
    >
      {s.label}
    </Box>
  );
}

/**
 * The 409 for a payout asked too early names when it opens up again
 * (next_eligible_at); say so instead of only repeating the error.
 */
function payoutError(error: unknown): string {
  const next = (error as { data?: { next_eligible_at?: string } } | null)?.data
    ?.next_eligible_at;
  return next
    ? `${errorMessage(error)} Next payout opens ${longDate(next)}.`
    : errorMessage(error);
}

function Line({
  label,
  note,
  value,
  tone,
  strong,
  line = true,
}: {
  label: string;
  note?: string;
  value: string;
  tone?: "error" | "success";
  strong?: boolean;
  line?: boolean;
}) {
  const color = tone === "error" ? tokens.color.error : tone === "success" ? tokens.color.success : undefined;
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
        gap: 2,
        py: 1.25,
        borderTop: line ? `1px solid ${tokens.color.borderSubtle}` : 0,
      }}
    >
      <Box>
        <Typography sx={{ fontSize: strong ? 15 : 14, fontWeight: strong ? 700 : 400 }}>{label}</Typography>
        {note && <Typography sx={{ fontSize: 11, color: tokens.color.textMuted }}>{note}</Typography>}
      </Box>
      <Typography sx={{ fontSize: strong ? 18 : 14, fontWeight: strong ? 700 : 500, color }}>{value}</Typography>
    </Box>
  );
}

function Tile({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <Box
      sx={{
        p: 2,
        borderRadius: tokens.radius.input,
        bgcolor: tokens.color.sunken,
        border: `1px solid ${tokens.color.borderSubtle}`,
      }}
    >
      <Typography sx={caption}>{label}</Typography>
      <Typography sx={{ fontSize: 18, fontWeight: 700 }}>{value}</Typography>
      {note && <Typography sx={{ fontSize: 12, color: tokens.color.textMuted }}>{note}</Typography>}
    </Box>
  );
}

/** What one payout was made of, fetched when its row is opened. */
function PayoutDetail({ id }: { id: string }) {
  const { data, isLoading, error } = useGetPayoutQuery(id);
  if (isLoading) return <Typography sx={{ color: tokens.color.textMuted }}>Loading…</Typography>;
  if (error || !data)
    return <Typography sx={{ color: tokens.color.error }}>{errorMessage(error)}</Typography>;
  return (
    <Box sx={{ maxWidth: 420 }}>
      {data.breakdown?.map(({ key, amount }, i) => (
        <Line key={key} label={breakdownLabel(key)} value={formatRupees(amount)} line={i > 0} />
      ))}
      <Typography sx={{ mt: 1, fontSize: 12, color: tokens.color.textMuted }}>
        Requested {longDate(data.requestedAt)}
        {data.completedAt ? ` · Paid ${longDate(data.completedAt)}` : ""}
        {data.reviewedAt ? ` · Reviewed ${longDate(data.reviewedAt)}` : ""}
      </Typography>
      {data.rejectionReason && (
        <Typography sx={{ fontSize: 13, color: tokens.color.error }}>
          Rejected: {data.rejectionReason}
        </Typography>
      )}
    </Box>
  );
}

const HISTORY_COLUMNS = "1.3fr 0.9fr 1fr 1fr 1fr 1.1fr 1fr 110px";

/** Payout summary, breakdown and history, from the payments API. */
export function PayoutsPanel() {
  const toast = useToast(),
    { data: details } = useGetRestaurantDetailsQuery(),
    { data: summary, isLoading, error: summaryError } = useGetPaymentSummaryQuery(),
    { data: breakdown } = useGetPaymentBreakdownQuery(),
    [page, setPage] = useState(1),
    [month, setMonth] = useState(""),
    [open, setOpen] = useState<string | null>(null),
    [confirmEmergency, setConfirmEmergency] = useState(false),
    range = monthRange(month),
    { data: history, isFetching: loadingHistory } = useGetPayoutsQuery({ page, ...range }),
    [requestRegular, { isLoading: payingOut }] = useRequestRegularPayoutMutation(),
    [requestEmergency, { isLoading: requestingEmergency }] = useRequestEmergencyPayoutMutation(),
    bank = details?.bank,
    last4 = bank?.account ? `••${bank.account.slice(-4)}` : "",
    dash = (n?: number) => (n == null ? "—" : formatRupees(n)),
    nothingToPay = !summary || summary.availableForPayout <= 0;

  async function regular() {
    try {
      const payout = await requestRegular().unwrap();
      toast.success(`${formatRupees(payout.net)} moved to your wallet.`);
    } catch (e) {
      toast.error(payoutError(e));
    }
  }
  async function emergency() {
    setConfirmEmergency(false);
    try {
      const payout = await requestEmergency().unwrap();
      toast.success(
        `Emergency payout of ${formatRupees(payout.net)} requested. It waits for admin approval.`,
      );
    } catch (e) {
      toast.error(payoutError(e));
    }
  }

  return (
    <Box sx={{ mt: 2.5, display: "grid", gap: 2.5 }}>
      <Box
        sx={{
          display: "grid",
          gap: 2.5,
          alignItems: "start",
          gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 1fr) 360px" },
        }}
      >
        <Box sx={{ ...cardSx, p: 3 }}>
          <Box sx={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 2 }}>
            <Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography sx={caption}>Next payout</Typography>
                {!!summary?.pendingEmergencyAmount && <Pill status="PENDING" />}
              </Box>
              <Typography sx={{ fontSize: 34, fontWeight: 700, lineHeight: 1.2 }}>
                {isLoading ? "…" : dash(summary?.availableForPayout)}
              </Typography>
              <Typography sx={{ fontSize: 13, color: tokens.color.textMuted }}>
                {summaryError
                  ? errorMessage(summaryError)
                  : `Moves to your wallet · wallet balance ${dash(summary?.walletBalance)}`}
              </Typography>
              <Box sx={{ mt: 2, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1.5 }}>
                <CommonButton
                  variant="contained"
                  startIcon={<SendOutlined />}
                  onClick={regular}
                  disabled={payingOut || nothingToPay}
                  sx={{ bgcolor: tokens.color.success, "&:hover": { bgcolor: "#166a3f" } }}
                >
                  {payingOut ? "Requesting…" : "Request payout"}
                </CommonButton>
                {confirmEmergency ? (
                  <>
                    <CommonButton variant="outlined" onClick={emergency} disabled={requestingEmergency}>
                      Yes, request emergency payout
                    </CommonButton>
                    <CommonButton variant="text" onClick={() => setConfirmEmergency(false)}>
                      Cancel
                    </CommonButton>
                  </>
                ) : (
                  <CommonButton
                    variant="text"
                    onClick={() => setConfirmEmergency(true)}
                    disabled={requestingEmergency || nothingToPay}
                  >
                    Emergency payout
                  </CommonButton>
                )}
              </Box>
            </Box>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                alignSelf: "flex-start",
                px: 2,
                py: 1.25,
                border: `1px solid ${tokens.color.border}`,
                borderRadius: tokens.radius.input,
              }}
            >
              <AccountBalanceOutlined sx={{ color: tokens.color.textMuted }} />
              <Box>
                <Typography sx={{ fontSize: 14, fontWeight: 600 }}>
                  {bank?.bank ? `${bank.bank} ${last4}` : "No bank account"}
                </Typography>
              </Box>
              <NextLink
                href="/profile"
                style={{ color: tokens.color.primary, fontWeight: 600, fontSize: 14, marginLeft: 16 }}
              >
                {bank?.bank ? "Change" : "Add"}
              </NextLink>
            </Box>
          </Box>
          <Box
            sx={{
              mt: 2.5,
              display: "grid",
              gap: 2,
              gridTemplateColumns: { xs: "1fr", sm: "repeat(3, minmax(0, 1fr))" },
            }}
          >
            <Tile label="Unsettled earnings" value={dash(summary?.unsettledEarnings)} note="Not paid out yet" />
            <Tile
              label="Last payout"
              value={dash(summary?.lastPayoutAmount)}
              note={summary?.lastPayoutAt ? `Paid ${shortDate(summary.lastPayoutAt)}` : "No payout yet"}
            />
            <Tile
              label="Refunds"
              value={dash(breakdown?.refundDeductions)}
              note="Adjusted in your payout"
            />
          </Box>
          {!!summary?.outstandingDues && (
            <Typography sx={{ mt: 2, fontSize: 13, color: tokens.color.error }}>
              Outstanding dues: {formatRupees(summary.outstandingDues)}
            </Typography>
          )}
        </Box>
        <Box sx={{ ...cardSx, p: 3 }}>
          <Typography sx={{ fontSize: 16, fontWeight: 700 }}>Payout breakdown</Typography>
          <Typography sx={{ fontSize: 12, color: tokens.color.textMuted, mb: 1 }}>
            Unsettled orders
          </Typography>
          <Line line={false} label="Order value" value={dash(breakdown?.orderEarnings)} />
          <Line
            label={breakdown?.codFeePercent ? `COD fee (${breakdown.codFeePercent}%)` : "COD fee"}
            note={breakdown?.totalCod ? `On ${formatRupees(breakdown.totalCod)} collected in cash` : undefined}
            value={breakdown ? `− ${formatRupees(breakdown.codFeeDeductions)}` : "—"}
            tone="error"
          />
          <Line
            label="Refunds"
            value={breakdown ? `− ${formatRupees(breakdown.refundDeductions)}` : "—"}
            tone="error"
          />
          <Line
            label="Other deductions"
            value={breakdown ? `− ${formatRupees(breakdown.otherDeductions)}` : "—"}
            tone="error"
          />
          <Line
            label="Adjustments"
            value={
              breakdown
                ? formatRupees(breakdown.positiveAdjustments - breakdown.negativeAdjustments)
                : "—"
            }
          />
          <Line strong label="You get" value={dash(breakdown?.net)} tone="success" />
          <Typography sx={{ mt: 1, fontSize: 11, color: tokens.color.textMuted }}>
            Refunds for cancelled orders were adjusted inside order value.
          </Typography>
        </Box>
      </Box>
      <Box sx={{ ...cardSx, overflow: "hidden" }}>
        <Box
          sx={{
            ...cardHeaderSx,
            borderBottom: 0,
            display: "flex",
            flexWrap: "wrap",
            gap: 2,
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "baseline", gap: 1.5 }}>
            <Typography className="title">Payout history</Typography>
            <Typography sx={{ fontSize: 12, color: tokens.color.textMuted }}>
              {history ? `${history.total} payouts` : ""}
            </Typography>
          </Box>
          <Box
            component="label"
            sx={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              gap: 1,
              px: 1.5,
              height: 38,
              border: `1px solid ${tokens.color.borderInput}`,
              borderRadius: tokens.radius.input,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <CalendarMonthOutlined sx={{ fontSize: 18 }} />
            {month
              ? new Date(`${month}-01T00:00:00`).toLocaleDateString("en-IN", { month: "short", year: "numeric" })
              : "All time"}
            <ExpandMoreRounded sx={{ fontSize: 18 }} />
            <input
              type="month"
              aria-label="Filter payouts by month"
              value={month}
              onChange={(e) => {
                setMonth(e.target.value);
                setPage(1);
                setOpen(null);
              }}
              style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }}
            />
          </Box>
        </Box>
        <Box sx={{ overflowX: "auto" }}>
          <Box sx={{ minWidth: 860 }}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: HISTORY_COLUMNS,
                gap: 2,
                px: 3,
                py: 1.25,
                bgcolor: tokens.color.sunken,
                borderTop: `1px solid ${tokens.color.borderSubtle}`,
                borderBottom: `1px solid ${tokens.color.borderSubtle}`,
              }}
            >
              {["Requested", "Type", "Sales", "Deductions", "Payout", "Status", "Paid on", ""].map(
                (name, i) => (
                  <Typography key={i} sx={caption}>
                    {name}
                  </Typography>
                ),
              )}
            </Box>
            {!history?.payouts.length ? (
              <Typography sx={{ px: 3, py: 4, color: tokens.color.textMuted }}>
                {loadingHistory ? "Loading payouts…" : "No payouts yet. They will be listed here."}
              </Typography>
            ) : (
              history.payouts.map((p) => (
                <Box key={p.id} sx={{ borderBottom: `1px solid ${tokens.color.borderSubtle}` }}>
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: HISTORY_COLUMNS,
                      alignItems: "center",
                      gap: 2,
                      px: 3,
                      py: 1.5,
                      fontSize: 14,
                    }}
                  >
                    <b>{shortDate(p.requestedAt)}</b>
                    <span style={{ color: tokens.color.textMuted }}>
                      {p.type === "EMERGENCY" ? "Emergency" : "Regular"}
                    </span>
                    <span>{formatRupees(p.gross)}</span>
                    <span style={{ color: tokens.color.error }}>− {formatRupees(p.deductions)}</span>
                    <b>{formatRupees(p.net)}</b>
                    <span>
                      <Pill status={p.status} />
                    </span>
                    <span style={{ color: tokens.color.textMuted }}>{shortDate(p.completedAt)}</span>
                    <ButtonBase
                      aria-expanded={open === p.id}
                      onClick={() => setOpen(open === p.id ? null : p.id)}
                      sx={{
                        height: 34,
                        px: 1.5,
                        fontSize: 13,
                        fontWeight: 600,
                        borderRadius: tokens.radius.input,
                        border: `1px solid ${tokens.color.borderInput}`,
                      }}
                    >
                      {open === p.id ? "Hide" : "Details"}
                    </ButtonBase>
                  </Box>
                  {open === p.id && (
                    <Box sx={{ px: 3, pb: 2 }}>
                      <PayoutDetail id={p.id} />
                    </Box>
                  )}
                </Box>
              ))
            )}
          </Box>
        </Box>
        {(history?.pages ?? 1) > 1 && (
          <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1.5, p: 2 }}>
            <CommonButton variant="outlined" disabled={page <= 1} onClick={() => setPage((n) => n - 1)}>
              Previous
            </CommonButton>
            <Typography sx={{ alignSelf: "center", fontSize: 13 }}>
              Page {history?.page} of {history?.pages}
            </Typography>
            <CommonButton
              variant="outlined"
              disabled={page >= (history?.pages ?? 1)}
              onClick={() => setPage((n) => n + 1)}
            >
              Next
            </CommonButton>
          </Box>
        )}
      </Box>
    </Box>
  );
}
