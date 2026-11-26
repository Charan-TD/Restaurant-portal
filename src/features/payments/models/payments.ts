/** Payments as the restaurant sees them: the wallet, what is owed, and payouts. */

export type PayoutType = "REGULAR" | "EMERGENCY";
export type PayoutStatus = "PENDING" | "COMPLETED" | "REJECTED";

/** GET /restaurant/payments/summary. Money is in rupees. */
export interface PaymentSummary {
  unsettledEarnings: number;
  outstandingDeductions: number;
  netSettlementBalance: number;
  availableForPayout: number;
  outstandingDues: number;
  walletBalance: number;
  lastPayoutAmount: number;
  lastPayoutAt?: string;
  pendingEmergencyAmount: number;
}

/** GET /restaurant/payments/breakdown: the unsettled money, line by line. */
export interface PaymentBreakdown {
  orderEarnings: number;
  totalCod: number;
  codFeePercent: number;
  codFeeDeductions: number;
  refundDeductions: number;
  otherDeductions: number;
  positiveAdjustments: number;
  negativeAdjustments: number;
  gross: number;
  deductions: number;
  net: number;
}

export interface Payout {
  id: string;
  type: PayoutType;
  status: PayoutStatus;
  gross: number;
  deductions: number;
  net: number;
  requestedAt?: string;
  completedAt?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  /** Only on a single payout: what it was made of, key → rupees. */
  breakdown?: { key: string; amount: number }[];
}

export interface PayoutPage {
  payouts: Payout[];
  page: number;
  pages: number;
  total: number;
}

type Row = Record<string, unknown>;
const asRow = (value: unknown): Row =>
  value && typeof value === "object" ? (value as Row) : {};
const text = (value: unknown) =>
  typeof value === "string" && value.trim() ? value.trim() : undefined;
/** The API sends money as strings ("5710.00"); anything unreadable is 0. */
export const money = (value: unknown): number => {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
};
/** Every payments answer is { success, data }. */
const data = (raw: unknown) => asRow(asRow(raw).data);

export function toSummary(raw: unknown): PaymentSummary {
  const d = data(raw);
  return {
    unsettledEarnings: money(d.unsettled_earnings),
    outstandingDeductions: money(d.outstanding_deductions),
    netSettlementBalance: money(d.net_settlement_balance),
    availableForPayout: money(d.available_for_payout),
    outstandingDues: money(d.outstanding_dues),
    walletBalance: money(d.wallet_balance),
    lastPayoutAmount: money(d.last_payout_amount),
    lastPayoutAt: text(d.last_payout_at),
    pendingEmergencyAmount: money(d.pending_emergency_payout_amount),
  };
}

export function toBreakdown(raw: unknown): PaymentBreakdown {
  const d = data(raw);
  return {
    orderEarnings: money(d.order_earnings),
    totalCod: money(d.total_cod_amount),
    codFeePercent: money(d.cod_fee_percentage),
    codFeeDeductions: money(d.cod_fee_deductions),
    refundDeductions: money(d.refund_deductions),
    otherDeductions: money(d.other_deductions),
    positiveAdjustments: money(d.positive_adjustments),
    negativeAdjustments: money(d.negative_adjustments),
    gross: money(d.gross_amount),
    deductions: money(d.deduction_amount),
    net: money(d.net_amount),
  };
}

const STATUSES: PayoutStatus[] = ["PENDING", "COMPLETED", "REJECTED"];

/** One payout, as the list, the detail and the payout requests all return it. */
export function toPayout(raw: unknown): Payout {
  const d = asRow(raw),
    status = text(d.status)?.toUpperCase() as PayoutStatus,
    breakdown = asRow(d.breakdown);
  return {
    id: text(d.id) ?? "",
    type:
      text(d.payout_type)?.toUpperCase() === "EMERGENCY" ? "EMERGENCY" : "REGULAR",
    status: STATUSES.includes(status) ? status : "PENDING",
    gross: money(d.gross_amount),
    deductions: money(d.deduction_amount),
    net: money(d.net_amount),
    requestedAt: text(d.requested_at),
    completedAt: text(d.completed_at),
    reviewedAt: text(d.reviewed_at),
    rejectionReason: text(d.rejection_reason),
    breakdown: Object.keys(breakdown).length
      ? Object.entries(breakdown)
          .filter(([, v]) => typeof v === "string" || typeof v === "number")
          .map(([key, v]) => ({ key, amount: money(v) }))
      : undefined,
  };
}

export function toPayoutPage(raw: unknown): PayoutPage {
  const d = data(raw),
    pagination = asRow(d.pagination);
  return {
    payouts: Array.isArray(d.payouts) ? d.payouts.map(toPayout) : [],
    page: Number(pagination.current_page) || 1,
    pages: Math.max(1, Number(pagination.total_pages) || 1),
    total: Number(pagination.total_records) || 0,
  };
}

/** "cod_fee_deductions" → "Cod fee deductions". */
export const breakdownLabel = (key: string) => {
  const words = key.replace(/_/g, " ").trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
};

/** "2026-10" → the first and last day of that month, as the history filter takes them. */
export function monthRange(month: string): { fromDate: string; toDate: string } | undefined {
  const m = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(month);
  if (!m) return undefined;
  const last = new Date(Date.UTC(Number(m[1]), Number(m[2]), 0)).getUTCDate();
  return { fromDate: `${month}-01`, toDate: `${month}-${String(last).padStart(2, "0")}` };
}
