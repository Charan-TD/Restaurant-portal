"use client";
import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Box, ButtonBase, InputBase, Menu, MenuItem, Pagination, Typography } from "@mui/material";
import ArrowBackRounded from "@mui/icons-material/ArrowBackRounded";
import ExpandMoreRounded from "@mui/icons-material/ExpandMoreRounded";
import FilterListRounded from "@mui/icons-material/FilterListRounded";
import SearchRounded from "@mui/icons-material/SearchRounded";
import { DEMO_MODE } from "@/core/constants/config";
import { usePortal } from "@/core/providers/PortalProvider";
import { tokens } from "@/core/theme/tokens";
import { formatRupees } from "@/shared/utils/format";
import { ScreenSurface } from "@/shared/components/layout/ScreenSurface";
import { Card, DownloadButton, Notice, TableRow, TableScroll, errorText } from "../components/SettlementParts";
import { OrderDetailsPanel } from "../components/OrderDetailsPanel";
import { periodDates } from "../models/dates";
import { isInsightsPeriod, type InsightRow, type InsightListQuery } from "../models/insights";
import { detailCrumb, detailTitle, type DetailKind } from "../models/orderDetails";
import { useGetInsightListQuery } from "../services/insightsApi";

const ALL = "All",
  ALL_TIME = "All time",
  SEARCH_DELAY_MS = 350;

const DATE_OPTIONS: Record<string, number> = { Today: 1, "Last 7 days": 7, "Last 30 days": 30 },
  PERIOD_TO_DATE: Record<string, string> = { today: "Today", "7d": "Last 7 days", "30d": "Last 30 days" };

/** "14 Nov, 12:55 PM" in Indian time. */
const when = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const zone = { timeZone: "Asia/Kolkata" } as const;
  return `${d.toLocaleString("en-IN", { ...zone, day: "numeric", month: "short" })}, ${d
    .toLocaleString("en-IN", { ...zone, hour: "numeric", minute: "2-digit", hour12: true })
    .replace(/\b(am|pm)\b/, (m) => m.toUpperCase())}`;
};

const TONES = {
  blue: { fg: "#1a56b0", bg: "#e3ecfb" },
  amber: { fg: "#8a5a00", bg: "#fff4d6" },
  green: { fg: tokens.color.success, bg: tokens.color.successBg },
  red: { fg: tokens.color.error, bg: tokens.color.errorBg },
  grey: { fg: tokens.color.text, bg: tokens.color.muted },
} as const;

function Tag({ children, tone }: { children: ReactNode; tone: keyof typeof TONES }) {
  return (
    <Box
      component="span"
      sx={{
        display: "inline-block",
        px: 1,
        fontSize: 10,
        lineHeight: "20px",
        fontWeight: 700,
        letterSpacing: "0.3px",
        textTransform: "uppercase",
        borderRadius: "6px",
        color: TONES[tone].fg,
        bgcolor: TONES[tone].bg,
      }}
    >
      {children}
    </Box>
  );
}

const dash = "—",
  muted = (text: string) => <Box component="span" sx={{ color: tokens.color.textMuted }}>{text}</Box>,
  bold = (text: string) => <b>{text}</b>,
  payment = (r: InsightRow) =>
    r.payment ? <Tag tone={r.payment === "COD" ? "amber" : "blue"}>{r.payment}</Tag> : muted(dash),
  route = (r: InsightRow) =>
    r.train ? (
      <>
        {r.train}
        {r.station && <Box component="span" sx={{ color: tokens.color.textMuted }}> · {r.station}</Box>}
      </>
    ) : (
      muted(dash)
    ),
  seat = (r: InsightRow) => (r.coach || r.seat ? `${r.coach ?? dash} · ${r.seat ?? dash}` : dash),
  /** A value the API cannot give yet is shown as a dash. */
  orDash = (value: string | null) => value ?? muted(dash);

interface Column {
  label: string;
  width: string;
  render: (r: InsightRow) => ReactNode;
}
interface Filter {
  name: "Date" | "Payment" | "Status";
  options: string[];
}

const dateFilter: Filter = { name: "Date", options: [ALL_TIME, ...Object.keys(DATE_OPTIONS)] },
  paymentFilter: Filter = { name: "Payment", options: ["PREPAID", "COD"] };

// The server filters by date, payment and status, and searches order and
// train; it keeps no reason, settlement or cash records yet, so those columns
// show a dash until it does and are not offered as filters.
const SPEC: Record<DetailKind, { columns: Column[]; filters: Filter[] }> = {
  "total-orders": {
    filters: [dateFilter, paymentFilter, { name: "Status", options: ["DELIVERED", "UNDELIVERED"] }],
    columns: [
      { label: "ORDER", width: "1.2fr", render: (r) => bold(r.id) },
      { label: "DATE & TIME", width: "1.1fr", render: (r) => muted(when(r.at)) },
      { label: "TRAIN · STATION", width: "2fr", render: route },
      { label: "COACH · SEAT", width: "1fr", render: seat },
      { label: "ITEMS", width: "0.6fr", render: (r) => r.itemCount },
      { label: "AMOUNT", width: "0.8fr", render: (r) => bold(formatRupees(r.amount)) },
      { label: "PAYMENT", width: "0.9fr", render: payment },
      {
        label: "STATUS",
        width: "1fr",
        render: (r) =>
          r.status ? <Tag tone={r.status === "DELIVERED" ? "green" : "red"}>{r.status}</Tag> : muted(dash),
      },
    ],
  },
  undelivered: {
    filters: [dateFilter, paymentFilter],
    columns: [
      { label: "ORDER", width: "1.2fr", render: (r) => bold(r.id) },
      { label: "DATE & TIME", width: "1.1fr", render: (r) => muted(when(r.at)) },
      { label: "TRAIN · STATION", width: "2fr", render: route },
      { label: "COACH · SEAT", width: "1fr", render: seat },
      { label: "AMOUNT", width: "0.8fr", render: (r) => bold(formatRupees(r.amount)) },
      { label: "PAYMENT", width: "0.9fr", render: payment },
      {
        label: "REASON",
        width: "1.4fr",
        render: (r) =>
          r.reason ? (
            <Box component="span" sx={{ fontWeight: 600, color: tokens.color.error }}>{r.reason}</Box>
          ) : (
            muted(dash)
          ),
      },
      {
        label: "SETTLEMENT",
        width: "1fr",
        render: (r) => (r.settlement ? <Tag tone="grey">{r.settlement}</Tag> : muted(dash)),
      },
    ],
  },
  "total-sale": {
    filters: [dateFilter, paymentFilter],
    columns: [
      { label: "ORDER", width: "1.2fr", render: (r) => bold(r.id) },
      { label: "DATE & TIME", width: "1.1fr", render: (r) => muted(when(r.at)) },
      { label: "TRAIN · STATION", width: "2fr", render: route },
      {
        label: "ITEMS",
        width: "1.8fr",
        render: (r) =>
          r.itemList.length
            ? `${r.itemList[0].name} × ${r.itemList[0].quantity}${r.itemList.length > 1 ? ` +${r.itemList.length - 1}` : ""}`
            : dash,
      },
      { label: "PAYMENT", width: "0.9fr", render: payment },
      { label: "SALE VALUE", width: "0.9fr", render: (r) => bold(formatRupees(r.amount)) },
    ],
  },
  cod: {
    filters: [dateFilter],
    columns: [
      { label: "ORDER", width: "1.2fr", render: (r) => bold(r.id) },
      { label: "DATE & TIME", width: "1.1fr", render: (r) => muted(when(r.at)) },
      { label: "TRAIN · STATION", width: "2fr", render: route },
      { label: "AMOUNT", width: "0.8fr", render: (r) => bold(formatRupees(r.amount)) },
      { label: "COLLECTED BY", width: "1.2fr", render: (r) => orDash(r.collectedBy) },
      {
        label: "PAYMENT STATUS",
        width: "1fr",
        render: (r) => (r.cashStatus ? <Tag tone="amber">{r.cashStatus}</Tag> : muted(dash)),
      },
    ],
  },
  prepaid: {
    filters: [dateFilter],
    columns: [
      { label: "ORDER", width: "1.2fr", render: (r) => bold(r.id) },
      { label: "DATE & TIME", width: "1.1fr", render: (r) => muted(when(r.at)) },
      { label: "TRAIN · STATION", width: "2fr", render: route },
      { label: "AMOUNT", width: "0.8fr", render: (r) => bold(formatRupees(r.amount)) },
      { label: "METHOD", width: "1fr", render: (r) => orDash(r.method) },
      {
        label: "TRANSACTION ID",
        width: "1.3fr",
        render: (r) =>
          r.transactionId ? (
            <Box component="span" sx={{ fontFamily: "ui-monospace, monospace", fontSize: 11, color: tokens.color.textMuted }}>
              {r.transactionId}
            </Box>
          ) : (
            muted(dash)
          ),
      },
      {
        label: "SETTLEMENT",
        width: "1.2fr",
        render: (r) => (r.settlement ? <Tag tone="blue">{r.settlement}</Tag> : muted(dash)),
      },
    ],
  },
};

/** A pill that opens a list: "Payment: All ⌄". */
function FilterPill({
  name,
  value,
  options,
  all,
  onChange,
}: {
  name: string;
  value: string;
  options: string[];
  all: string;
  onChange: (value: string) => void;
}) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null),
    list = options.includes(all) ? options : [all, ...options];
  return (
    <>
      <ButtonBase
        onClick={(e) => setAnchor(e.currentTarget)}
        aria-haspopup="menu"
        sx={{
          gap: 0.5,
          height: 36,
          px: 1.5,
          fontSize: 13,
          borderRadius: "10px",
          color: tokens.color.textMuted,
          border: `1px solid ${tokens.color.borderInput}`,
          bgcolor: tokens.color.card,
        }}
      >
        {name}: <b style={{ color: tokens.color.text }}>{value}</b>
        <ExpandMoreRounded sx={{ fontSize: 18 }} />
      </ButtonBase>
      <Menu anchorEl={anchor} open={!!anchor} onClose={() => setAnchor(null)}>
        {list.map((option) => (
          <MenuItem
            key={option}
            selected={option === value}
            onClick={() => {
              onChange(option);
              setAnchor(null);
            }}
            sx={{ fontSize: 13 }}
          >
            {option}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}

/**
 * The orders behind one Insights card, with search, filters and paging, all
 * done by the server (ten orders a page). A row opens the order's side panel.
 * The card that was clicked passes its period in the address (?period=7d).
 */
export function InsightsDetailView({ kind }: { kind: DetailKind }) {
  const { columns, filters } = SPEC[kind],
    { authenticated } = usePortal(),
    fromCard = useSearchParams().get("period"),
    [text, setText] = useState(""),
    [search, setSearch] = useState(""),
    [chosen, setChosen] = useState<Record<string, string>>({}),
    [page, setPage] = useState(1),
    [open, setOpen] = useState<string | null>(null),
    pick = (f: Filter) =>
      chosen[f.name] ??
      (f.name === "Date" ? (PERIOD_TO_DATE[isInsightsPeriod(fromCard) ? fromCard : ""] ?? ALL_TIME) : ALL);
  // Ask the server once typing pauses, not on every key.
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(text.trim());
      setPage(1);
    }, SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [text]);
  const choice = (name: Filter["name"]) => {
      const f = filters.find((x) => x.name === name);
      return f ? pick(f) : undefined;
    },
    date = choice("Date"),
    pay = choice("Payment"),
    status = choice("Status"),
    query: InsightListQuery = {
        page,
        search: search || undefined,
        payment: pay === "COD" || pay === "PREPAID" ? pay : undefined,
        status: status === "DELIVERED" || status === "UNDELIVERED" ? status : undefined,
        ...(date && DATE_OPTIONS[date] ? periodDates(DATE_OPTIONS[date]) : {}),
      },
    { data, error, isLoading, isFetching } = useGetInsightListQuery(
      { kind, query },
      { skip: DEMO_MODE || !authenticated },
    ),
    rows = data?.rows ?? [],
    total = data?.pagination.total ?? 0,
    pages = data?.pagination.pages ?? 1,
    size = data?.pagination.pageSize ?? 10,
    summary = data?.summary,
    money = summary?.amount == null ? "" : ` · ${formatRupees(summary.amount)}`,
    subtitle = !summary
      ? ""
      : kind === "total-orders"
        ? `${summary.orders} orders`
        : kind === "undelivered"
          ? `${summary.orders} orders${money}${summary.percentOfAll == null ? "" : ` · ${summary.percentOfAll}% of all orders`}`
          : kind === "total-sale"
            ? `${summary.orders} orders${money} in total`
            : kind === "cod"
              ? `${summary.orders} orders${money} · collected by riders`
              : `${summary.orders} orders${money} · paid online`,
    grid = columns.map((c) => `minmax(0, ${c.width})`).join(" "),
    forbidden = (error as { status?: number } | undefined)?.status === 403;
  return (
    <ScreenSurface>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2, fontSize: 14 }}>
        <ButtonBase component={Link} href="/insights" sx={{ gap: 0.5, fontWeight: 600, color: tokens.color.primary }}>
          <ArrowBackRounded sx={{ fontSize: 16 }} /> Insights
        </ButtonBase>
        <Box component="span" sx={{ color: tokens.color.textMuted }}>/</Box>
        <Box component="span" sx={{ fontWeight: 600 }}>{detailCrumb[kind]}</Box>
      </Box>
      <Card
        title={detailTitle[kind]}
        subtitle={subtitle}
        flush
        action={
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                width: { xs: 180, md: 300 },
                height: 40,
                px: 1.5,
                borderRadius: "10px",
                border: `1px solid ${tokens.color.borderInput}`,
              }}
            >
              <SearchRounded sx={{ fontSize: 18, color: tokens.color.textMuted }} />
              <InputBase
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Search order ID or train"
                inputProps={{ "aria-label": "Search orders" }}
                sx={{ flex: 1, fontSize: 14 }}
              />
            </Box>
            <DownloadButton />
          </Box>
        }
      >
        <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1, px: 3, pb: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, pr: 1, fontSize: 13, color: tokens.color.textMuted }}>
            <FilterListRounded sx={{ fontSize: 18 }} /> Filter
          </Box>
          {filters.map((f) => (
            <FilterPill
              key={f.name}
              name={f.name}
              value={pick(f)}
              options={f.options}
              all={f.name === "Date" ? ALL_TIME : ALL}
              onChange={(next) => {
                setChosen((old) => ({ ...old, [f.name]: next }));
                setPage(1);
              }}
            />
          ))}
        </Box>
        <TableScroll min={760}>
          <TableRow head columns={grid} cells={columns.map((c) => c.label)} />
          {DEMO_MODE ? (
            <Notice>Insights are not available in demo mode.</Notice>
          ) : isLoading ? (
            <Notice>Loading orders…</Notice>
          ) : error && !data ? (
            <Notice error>
              {forbidden
                ? "This list is only for restaurants that deliver with their own riders."
                : errorText(error)}
            </Notice>
          ) : rows.length === 0 ? (
            <Typography sx={{ px: 3, py: 4, fontSize: 14, color: tokens.color.textMuted, borderTop: `1px solid ${tokens.color.borderSubtle}` }}>
              No orders match.
            </Typography>
          ) : (
            rows.map((r) => (
              <TableRow
                key={r.id}
                columns={grid}
                cells={columns.map((c) => c.render(r))}
                selected={open === r.id}
                onClick={() => setOpen(r.id)}
              />
            ))
          )}
        </TableScroll>
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1,
            px: 3,
            py: 2,
            borderTop: `1px solid ${tokens.color.borderSubtle}`,
            opacity: isFetching ? 0.6 : 1,
          }}
        >
          <Typography sx={{ fontSize: 13, color: tokens.color.textMuted }}>
            {rows.length
              ? `Showing ${(page - 1) * size + 1}–${(page - 1) * size + rows.length} of ${total} orders`
              : "Showing 0 orders"}
          </Typography>
          <Pagination
            count={pages}
            page={Math.min(page, pages)}
            onChange={(_, next) => setPage(next)}
            shape="rounded"
            siblingCount={0}
            boundaryCount={1}
          />
        </Box>
      </Card>
      <OrderDetailsPanel orderId={open} onClose={() => setOpen(null)} />
    </ScreenSurface>
  );
}
