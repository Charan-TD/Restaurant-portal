"use client";
import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { Box, ButtonBase, InputBase, Menu, MenuItem, Pagination, Typography } from "@mui/material";
import ArrowBackRounded from "@mui/icons-material/ArrowBackRounded";
import ExpandMoreRounded from "@mui/icons-material/ExpandMoreRounded";
import FilterListRounded from "@mui/icons-material/FilterListRounded";
import SearchRounded from "@mui/icons-material/SearchRounded";
import { tokens } from "@/core/theme/tokens";
import { formatRupees } from "@/shared/utils/format";
import { ScreenSurface } from "@/shared/components/layout/ScreenSurface";
import { Card, DownloadButton, TableRow, TableScroll } from "../components/SettlementParts";
import { OrderDetailsPanel } from "../components/OrderDetailsPanel";
import { settlementSample, settlementTotals } from "../models/settlement";
import {
  detailCrumb,
  detailTitle,
  RIDERS,
  rowsFor,
  trainOptions,
  UNDELIVERED_REASONS,
  type DetailKind,
  type DetailRow,
} from "../models/orderDetails";

const PAGE = 10,
  ALL = "All";

const when = (ms: number) => {
  const d = new Date(ms);
  return `${d.getDate()} ${d.toLocaleString("en-IN", { month: "short" })}, ${d.toLocaleString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })}`.replace(/\b(am|pm)\b/, (m) => m.toUpperCase());
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

const payment = (r: DetailRow) => <Tag tone={r.payment === "COD" ? "amber" : "blue"}>{r.payment}</Tag>,
  route = (r: DetailRow) => (
    <>
      {r.train} <Box component="span" sx={{ color: tokens.color.textMuted }}>· {r.station}</Box>
    </>
  ),
  seat = (r: DetailRow) => `${r.coach} · ${r.seat}`,
  muted = (text: string) => <Box component="span" sx={{ color: tokens.color.textMuted }}>{text}</Box>,
  bold = (text: string) => <b>{text}</b>;

interface Column {
  label: string;
  width: string;
  render: (r: DetailRow) => ReactNode;
}
interface Filter {
  name: string;
  options: string[];
  /** Whether a row passes when this option is chosen. */
  test: (r: DetailRow, option: string) => boolean;
}

const dateFilter: Filter = {
  name: "Date",
  options: ["All time", "Today", "Last 7 days", "Last 30 days"],
  // Design only: the sample has no real dates to filter by.
  test: () => true,
};
const paymentFilter: Filter = { name: "Payment", options: ["PREPAID", "COD"], test: (r, o) => r.payment === o };
const trainFilter: Filter = { name: "Train", options: trainOptions, test: (r, o) => r.train === o };

const SPEC: Record<DetailKind, { columns: Column[]; filters: Filter[] }> = {
  "total-orders": {
    filters: [
      dateFilter,
      paymentFilter,
      { name: "Status", options: ["DELIVERED", "UNDELIVERED"], test: (r, o) => r.status === o },
      trainFilter,
    ],
    columns: [
      { label: "ORDER", width: "0.8fr", render: (r) => bold(r.id) },
      { label: "DATE & TIME", width: "1.1fr", render: (r) => muted(when(r.at)) },
      { label: "TRAIN · STATION", width: "2fr", render: route },
      { label: "COACH · SEAT", width: "1fr", render: seat },
      { label: "ITEMS", width: "0.6fr", render: (r) => r.items },
      { label: "AMOUNT", width: "0.8fr", render: (r) => bold(formatRupees(r.amount)) },
      { label: "PAYMENT", width: "0.9fr", render: payment },
      {
        label: "STATUS",
        width: "1fr",
        render: (r) => <Tag tone={r.status === "DELIVERED" ? "green" : "red"}>{r.status}</Tag>,
      },
    ],
  },
  undelivered: {
    filters: [
      dateFilter,
      { name: "Reason", options: UNDELIVERED_REASONS, test: (r, o) => r.reason === o },
      paymentFilter,
    ],
    columns: [
      { label: "ORDER", width: "0.8fr", render: (r) => bold(r.id) },
      { label: "DATE & TIME", width: "1.1fr", render: (r) => muted(when(r.at)) },
      { label: "TRAIN · STATION", width: "2fr", render: route },
      { label: "COACH · SEAT", width: "1fr", render: seat },
      { label: "AMOUNT", width: "0.8fr", render: (r) => bold(formatRupees(r.amount)) },
      { label: "PAYMENT", width: "0.9fr", render: payment },
      {
        label: "REASON",
        width: "1.6fr",
        render: (r) => (
          <Box component="span" sx={{ fontWeight: 600, color: tokens.color.error }}>
            {r.reason}
          </Box>
        ),
      },
      { label: "SETTLEMENT", width: "1fr", render: (r) => <Tag tone="grey">{r.settlement}</Tag> },
    ],
  },
  "total-sale": {
    filters: [dateFilter, paymentFilter, trainFilter],
    columns: [
      { label: "ORDER", width: "0.8fr", render: (r) => bold(r.id) },
      { label: "DATE & TIME", width: "1.1fr", render: (r) => muted(when(r.at)) },
      { label: "TRAIN · STATION", width: "2fr", render: route },
      { label: "ITEMS", width: "1.8fr", render: (r) => r.itemsLabel },
      { label: "PAYMENT", width: "0.9fr", render: payment },
      { label: "SALE VALUE", width: "0.9fr", render: (r) => bold(formatRupees(r.amount)) },
    ],
  },
  cod: {
    filters: [
      dateFilter,
      { name: "Rider", options: RIDERS, test: (r, o) => r.rider === o },
      { name: "Cash status", options: ["WITH RIDER", "DEPOSITED"], test: (r, o) => r.cashStatus === o },
    ],
    columns: [
      { label: "ORDER", width: "0.8fr", render: (r) => bold(r.id) },
      { label: "DATE & TIME", width: "1.1fr", render: (r) => muted(when(r.at)) },
      { label: "TRAIN · STATION", width: "2fr", render: route },
      { label: "AMOUNT", width: "0.8fr", render: (r) => bold(formatRupees(r.amount)) },
      { label: "COLLECTED BY", width: "1.2fr", render: (r) => r.rider },
      {
        label: "CASH STATUS",
        width: "1fr",
        render: (r) => <Tag tone={r.cashStatus === "DEPOSITED" ? "green" : "amber"}>{r.cashStatus}</Tag>,
      },
    ],
  },
  prepaid: {
    filters: [
      dateFilter,
      { name: "Method", options: ["UPI", "Card", "Wallet", "Net banking"], test: (r, o) => r.method === o },
      { name: "Settlement", options: ["SETTLED", "IN NEXT PAYOUT"], test: (r, o) => r.payoutStatus === o },
    ],
    columns: [
      { label: "ORDER", width: "0.8fr", render: (r) => bold(r.id) },
      { label: "DATE & TIME", width: "1.1fr", render: (r) => muted(when(r.at)) },
      { label: "TRAIN · STATION", width: "2fr", render: route },
      { label: "AMOUNT", width: "0.8fr", render: (r) => bold(formatRupees(r.amount)) },
      { label: "METHOD", width: "1fr", render: (r) => r.method },
      {
        label: "TRANSACTION ID",
        width: "1.3fr",
        render: (r) => (
          <Box component="span" sx={{ fontFamily: "ui-monospace, monospace", fontSize: 11, color: tokens.color.textMuted }}>
            {r.transactionId}
          </Box>
        ),
      },
      {
        label: "SETTLEMENT",
        width: "1.2fr",
        render: (r) => <Tag tone={r.payoutStatus === "SETTLED" ? "green" : "blue"}>{r.payoutStatus}</Tag>,
      },
    ],
  },
};

/** A pill that opens a list: "Payment: All ⌄". */
function FilterPill({
  name,
  value,
  options,
  onChange,
}: {
  name: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
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
        {[ALL, ...options].map((option) => (
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
 * The orders behind one Insights card, with search, filters and paging.
 * DESIGN ONLY: sample rows (see models/orderDetails.ts); the Date filter
 * and Download do nothing yet. A row opens the order's side panel.
 */
export function InsightsDetailView({ kind }: { kind: DetailKind }) {
  const { columns, filters } = SPEC[kind],
    all = useMemo(() => rowsFor(kind), [kind]),
    [query, setQuery] = useState(""),
    [chosen, setChosen] = useState<Record<string, string>>({}),
    [page, setPage] = useState(1),
    [open, setOpen] = useState<DetailRow | null>(null),
    pick = (name: string) => chosen[name] ?? (name === "Date" ? "All time" : ALL),
    rows = all.filter(
      (r) =>
        filters.every((f) => {
          const value = pick(f.name);
          return value === ALL || value === "All time" || f.test(r, value);
        }) &&
        (!query.trim() ||
          `${r.id} ${r.train} ${r.station}`.toLowerCase().includes(query.trim().toLowerCase())),
    ),
    pages = Math.max(1, Math.ceil(rows.length / PAGE)),
    current = Math.min(page, pages),
    shown = rows.slice((current - 1) * PAGE, current * PAGE),
    t = settlementTotals(settlementSample.items),
    subtitle =
      kind === "total-orders"
        ? `All ${all.length} orders`
        : kind === "undelivered"
          ? `${all.length} orders · ${t.undeliveredPercent}% of all orders · not paid`
          : kind === "total-sale"
            ? `${all.length} orders · ${formatRupees(t.sale)} in total`
            : kind === "cod"
              ? `${all.length} orders · ${formatRupees(t.cod)} · collected by riders`
              : `${all.length} orders · ${formatRupees(t.prepaid)} · paid online`,
    grid = columns.map((c) => `minmax(0, ${c.width})`).join(" ");
  return (
    <ScreenSurface>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2, fontSize: 14 }}>
        <ButtonBase
          component={Link}
          href="/insights"
          sx={{ gap: 0.5, fontWeight: 600, color: tokens.color.primary }}
        >
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
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
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
              value={pick(f.name)}
              options={f.options}
              onChange={(value) => {
                setChosen((old) => ({ ...old, [f.name]: value }));
                setPage(1);
              }}
            />
          ))}
        </Box>
        <TableScroll min={760}>
          <TableRow head columns={grid} cells={columns.map((c) => c.label)} />
          {shown.length === 0 ? (
            <Typography sx={{ px: 3, py: 4, fontSize: 14, color: tokens.color.textMuted, borderTop: `1px solid ${tokens.color.borderSubtle}` }}>
              No orders match.
            </Typography>
          ) : (
            shown.map((r) => (
              <TableRow
                key={r.id}
                columns={grid}
                cells={columns.map((c) => c.render(r))}
                selected={open?.id === r.id}
                onClick={() => setOpen(r)}
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
          }}
        >
          <Typography sx={{ fontSize: 13, color: tokens.color.textMuted }}>
            {rows.length
              ? `Showing ${(current - 1) * PAGE + 1}–${(current - 1) * PAGE + shown.length} of ${rows.length} orders`
              : "Showing 0 orders"}
          </Typography>
          <Pagination
            count={pages}
            page={current}
            onChange={(_, value) => setPage(value)}
            shape="rounded"
            siblingCount={0}
            boundaryCount={1}
          />
        </Box>
      </Card>
      <OrderDetailsPanel row={open} onClose={() => setOpen(null)} />
    </ScreenSurface>
  );
}
