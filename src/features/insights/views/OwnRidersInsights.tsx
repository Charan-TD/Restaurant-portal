"use client";
import { Box, Typography } from "@mui/material";
import CreditCardOutlined from "@mui/icons-material/CreditCardOutlined";
import PaymentsOutlined from "@mui/icons-material/PaymentsOutlined";
import type { ReactNode } from "react";
import { tokens } from "@/core/theme/tokens";
import { formatRupees } from "@/shared/utils/format";
import { FoodTypeMark } from "@/shared/components/feedback/FoodTypeMark";
import { PERIOD_LABEL, type InsightsMetrics, type InsightsPeriod } from "../models/insights";
import {
  useGetInsightsDistributionQuery,
  useGetInsightsEarningsQuery,
  useGetInsightsSettlementQuery,
} from "../services/insightsApi";
import {
  Card,
  DownloadButton,
  Notice,
  StatCard,
  SumRow,
  TableRow,
  TableScroll,
  changeNote,
  errorText,
} from "../components/SettlementParts";

// The design has no Undelivered column; it appears only when something was undelivered.
const columns = (undelivered: boolean) =>
    `minmax(180px, 2.2fr) repeat(${undelivered ? 7 : 6}, minmax(80px, 1fr))`,
  REFRESH_MS = 60_000,
  round = (n: number) => Math.round(n * 10) / 10;

/** One payment method: amount, share of sales and a bar. */
function MethodCard({
  title,
  note,
  amount,
  orders,
  salesShare,
  avg,
  color,
  tint,
  icon,
}: {
  title: string;
  note: string;
  amount: number;
  orders: number;
  salesShare: number;
  avg: number;
  color: string;
  tint: string;
  icon: ReactNode;
}) {
  return (
    <Box sx={{ p: 2, borderRadius: "12px", border: `1px solid ${tokens.color.border}` }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        <Box sx={{ width: 40, height: 40, borderRadius: "10px", bgcolor: tint, color, display: "grid", placeItems: "center" }}>
          {icon}
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontSize: 14, fontWeight: 700 }}>{title}</Typography>
          <Typography sx={{ fontSize: 12, color: tokens.color.textMuted }}>{note}</Typography>
        </Box>
        <Typography sx={{ fontSize: 22, fontWeight: 700 }}>{formatRupees(amount)}</Typography>
      </Box>
      <Box sx={{ mt: 1.5, height: 6, borderRadius: 3, bgcolor: tokens.color.muted }}>
        <Box sx={{ width: `${Math.min(100, salesShare)}%`, height: "100%", borderRadius: 3, bgcolor: color }} />
      </Box>
      <Box sx={{ mt: 1, display: "flex", justifyContent: "space-between", gap: 1, fontSize: 12, color: tokens.color.textMuted }}>
        <span>
          <b style={{ color: tokens.color.text }}>{orders}</b> orders · {round(salesShare)}% of sales
        </span>
        <span>Avg {formatRupees(avg)} per order</span>
      </Box>
    </Box>
  );
}

/**
 * Insights for a restaurant with its own riders: what was sold, how it was
 * paid (cash collected by the rider or paid online), and the earnings after
 * TrainDhaba's fee. The cards come from the metrics answer; the rest load
 * separately and fail separately.
 */
export function OwnRidersInsights({
  period,
  metrics,
}: {
  period: InsightsPeriod;
  metrics: InsightsMetrics;
}) {
  const label = PERIOD_LABEL[period],
    options = { pollingInterval: REFRESH_MS },
    distribution = useGetInsightsDistributionQuery(period, options),
    settlement = useGetInsightsSettlementQuery(period, options),
    earnings = useGetInsightsEarningsQuery(period, options),
    orders = changeNote(metrics.totalOrders.change, period),
    sale = changeNote(metrics.totalSale.change, period),
    { cod, prepaid, undelivered } = metrics,
    link = (kind: string) => `/insights/${kind}?period=${period}`,
    s = settlement.data,
    d = distribution.data,
    e = earnings.data,
    // The fee is worked out on delivered sales; say what share it is.
    feePct = s && s.deliveredValue > 0 ? round((s.fee / s.deliveredValue) * 100) : null,
    feeText = feePct === null ? "TrainDhaba fee" : `${feePct}% TrainDhaba fee`,
    hasUndelivered = !!e && e.total.undelivered > 0,
    COLUMNS = columns(hasUndelivered);
  return (
    <Box sx={{ display: "grid", gap: 3 }}>
      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", lg: "repeat(6, minmax(0, 1fr))" },
        }}
      >
        <StatCard label="Total orders" value={metrics.totalOrders.value} note={orders.note} noteColor={orders.color} href={link("total-orders")} />
        <StatCard label="Total sale value" value={formatRupees(metrics.totalSale.amount)} note={sale.note} noteColor={sale.color} href={link("total-sale")} />
        <StatCard
          label="COD"
          value={formatRupees(cod?.amount ?? 0)}
          note={`${cod?.orders ?? 0} orders · ${round(cod?.share ?? 0)}%`}
          href={link("cod")}
        />
        <StatCard
          label="Prepaid"
          value={formatRupees(prepaid?.amount ?? 0)}
          note={`${prepaid?.orders ?? 0} orders · ${round(prepaid?.share ?? 0)}%`}
          href={link("prepaid")}
        />
        <StatCard
          label="Undelivered"
          value={undelivered.count}
          note={`${round(undelivered.percentage)}% of orders`}
          noteColor={undelivered.count ? tokens.color.error : undefined}
          href={link("undelivered")}
        />
        <StatCard
          label="Your earnings"
          value={formatRupees(metrics.payout)}
          note={`After ${feeText}`}
          noteColor={tokens.color.success}
          highlight
        />
      </Box>
      <Box
        sx={{
          display: "grid",
          gap: 3,
          alignItems: "start",
          gridTemplateColumns: { xs: "1fr", lg: "repeat(2, minmax(0, 1fr))" },
        }}
      >
        <Card title="COD vs Prepaid">
          {d ? (
            <Box sx={{ display: "grid", gap: 1.5 }}>
              <MethodCard
                title="Cash on delivery"
                note="Collected by rider at the coach"
                amount={d.cod.saleValue}
                orders={d.cod.orders}
                salesShare={d.cod.salesShare}
                avg={d.cod.avgPerOrder}
                color="#8a5a00"
                tint="#fff4d6"
                icon={<PaymentsOutlined fontSize="small" />}
              />
              <MethodCard
                title="Prepaid"
                note="Paid online by passenger"
                amount={d.prepaid.saleValue}
                orders={d.prepaid.orders}
                salesShare={d.prepaid.salesShare}
                avg={d.prepaid.avgPerOrder}
                color="#1a56b0"
                tint="#e3ecfb"
                icon={<CreditCardOutlined fontSize="small" />}
              />
            </Box>
          ) : distribution.isLoading ? (
            <Notice>Loading…</Notice>
          ) : (
            <Notice error>{errorText(distribution.error)}</Notice>
          )}
        </Card>
        <Card title="How settlement is worked out">
          {s ? (
            <>
              <SumRow label={`Total sale value · ${s.totalOrders} orders`} value={formatRupees(s.totalSale)} />
              {s.cod && <SumRow label={`COD · ${s.cod.orders} orders`} value={formatRupees(s.cod.amount)} tone="muted" />}
              {s.prepaid && <SumRow label={`Prepaid · ${s.prepaid.orders} orders`} value={formatRupees(s.prepaid.amount)} tone="muted" />}
              {s.undelivered.orders > 0 && (
                <>
                  <SumRow label={`Undelivered · ${s.undelivered.orders} orders`} value={`− ${formatRupees(s.undelivered.amount)}`} tone="error" line />
                  <SumRow label="Delivered sale value" value={formatRupees(s.deliveredValue)} />
                </>
              )}
              <SumRow label={feePct === null ? "TrainDhaba fee" : `TrainDhaba fee (${feePct}%)`} value={`− ${formatRupees(s.fee)}`} tone="error" line={!s.undelivered.orders} />
              <SumRow label="Your earnings" value={formatRupees(s.earnings)} tone="success" strong line />
              <Typography sx={{ mt: 1, fontSize: 11, color: tokens.color.textMuted }}>
                COD cash collected by riders is adjusted in your payout. Settlements reach your bank every Friday.
              </Typography>
            </>
          ) : settlement.isLoading ? (
            <Notice>Loading…</Notice>
          ) : (
            <Notice error>{errorText(settlement.error)}</Notice>
          )}
        </Card>
      </Box>
      <Card title="Earnings details" subtitle={`${label} · final earnings after ${feeText}`} action={<DownloadButton />} flush>
        {e ? (
          <TableScroll min={hasUndelivered ? 860 : 760}>
            <TableRow
              head
              columns={COLUMNS}
              cells={[
                "ITEM", "TOTAL ORDERS", "UNIT PRICE",
                ...(hasUndelivered ? ["UNDELIVERED"] : []),
                "COD", "PREPAID", hasUndelivered ? "DELIVERED VALUE" : "SALE VALUE", "FINAL EARNINGS",
              ]}
            />
            {e.items.length === 0 ? (
              <Notice>No orders in this period.</Notice>
            ) : (
              e.items.map((item, i) => (
                <TableRow
                  key={`${item.id}-${i}`}
                  columns={COLUMNS}
                  cells={[
                    <Box key="n" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      {item.type && <FoodTypeMark type={item.type} />}
                      {item.name}
                    </Box>,
                    item.orders,
                    formatRupees(item.unitPrice),
                    ...(hasUndelivered
                      ? [
                          <Box key="u" component="span" sx={{ fontWeight: 700, color: item.undelivered ? tokens.color.error : tokens.color.textMuted }}>
                            {item.undelivered}
                          </Box>,
                        ]
                      : []),
                    formatRupees(item.cod),
                    formatRupees(item.prepaid),
                    <Box key="s" component="span" sx={{ color: tokens.color.textMuted }}>
                      {formatRupees(item.deliveredValue)}
                    </Box>,
                    <Box key="f" component="b" sx={{ color: tokens.color.success }}>
                      {formatRupees(item.final)}
                    </Box>,
                  ]}
                />
              ))
            )}
            <TableRow
              foot
              columns={COLUMNS}
              cells={[
                "Total",
                e.total.orders,
                "—",
                ...(hasUndelivered
                  ? [
                      <Box key="u" component="span" sx={{ color: tokens.color.error }}>
                        {e.total.undelivered}
                      </Box>,
                    ]
                  : []),
                formatRupees(e.total.cod),
                formatRupees(e.total.prepaid),
                formatRupees(e.total.deliveredValue),
                <Box key="f" component="span" sx={{ color: tokens.color.success }}>
                  {formatRupees(e.total.final)}
                </Box>,
              ]}
            />
          </TableScroll>
        ) : earnings.isLoading ? (
          <Notice>Loading…</Notice>
        ) : (
          <Notice error>{errorText(earnings.error)}</Notice>
        )}
      </Card>
    </Box>
  );
}
