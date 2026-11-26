"use client";
import { Box, Typography } from "@mui/material";
import { tokens } from "@/core/theme/tokens";
import { formatRupees } from "@/shared/utils/format";
import { FoodTypeMark } from "@/shared/components/feedback/FoodTypeMark";
import { PERIOD_LABEL, type InsightsMetrics, type InsightsPeriod } from "../models/insights";
import {
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

const COLUMNS = "minmax(180px, 2.2fr) repeat(5, minmax(90px, 1fr))",
  REFRESH_MS = 60_000,
  round = (n: number) => Math.round(n * 10) / 10;

/**
 * Insights for a restaurant whose orders TrainDhaba's riders deliver: the
 * riders confirm deliveries, so the settlement is item-wise and undelivered
 * orders are not paid. There is no COD or prepaid split here: TrainDhaba
 * collects the money.
 */
export function TrainDhabaRidersInsights({
  period,
  metrics,
}: {
  period: InsightsPeriod;
  metrics: InsightsMetrics;
}) {
  const label = PERIOD_LABEL[period],
    options = { pollingInterval: REFRESH_MS },
    settlement = useGetInsightsSettlementQuery(period, options),
    earnings = useGetInsightsEarningsQuery(period, options),
    orders = changeNote(metrics.totalOrders.change, period),
    sale = changeNote(metrics.totalSale.change, period),
    { undelivered } = metrics,
    link = (kind: string) => `/insights/${kind}?period=${period}`,
    s = settlement.data,
    e = earnings.data;
  return (
    <Box sx={{ display: "grid", gap: 3 }}>
      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", lg: "repeat(4, minmax(0, 1fr))" },
        }}
      >
        <StatCard label="Total orders" value={metrics.totalOrders.value} note={orders.note} noteColor={orders.color} href={link("total-orders")} />
        <StatCard label="Total sale value" value={formatRupees(metrics.totalSale.amount)} note={sale.note} noteColor={sale.color} href={link("total-sale")} />
        <StatCard
          label="Undelivered"
          value={undelivered.count}
          note={`${round(undelivered.percentage)}% of orders · ${formatRupees(undelivered.amount)} · not paid`}
          noteColor={undelivered.count ? tokens.color.error : undefined}
          href={link("undelivered")}
        />
        <StatCard label="Final settled" value={formatRupees(metrics.payout)} note="After TrainDhaba fee" noteColor={tokens.color.success} highlight />
      </Box>
      <Box
        sx={{
          display: "grid",
          gap: 3,
          alignItems: "start",
          gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 1fr) 360px" },
        }}
      >
        <Card title="Item-wise settlement" subtitle={label} action={<DownloadButton />} flush>
          {e ? (
            <TableScroll min={640}>
              <TableRow
                head
                columns={COLUMNS}
                cells={["ITEM", "TOTAL ORDERS", "UNIT PRICE", "UNDELIVERED", "DELIVERED VALUE", "FINAL SETTLED"]}
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
                      <Box key="u" component="span" sx={{ fontWeight: 700, color: item.undelivered ? tokens.color.error : tokens.color.textMuted }}>
                        {item.undelivered}
                      </Box>,
                      <Box key="d" component="span" sx={{ color: tokens.color.textMuted }}>
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
                  <Box key="u" component="span" sx={{ color: tokens.color.error }}>
                    {e.total.undelivered}
                  </Box>,
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
        <Card title="How settlement is worked out" subtitle={label}>
          {s ? (
            <>
              <SumRow label={`Total sale value · ${s.totalOrders} orders`} value={formatRupees(s.totalSale)} />
              <SumRow label={`Undelivered · ${s.undelivered.orders} orders`} value={`− ${formatRupees(s.undelivered.amount)}`} tone="error" />
              <SumRow label="Delivered sale value" value={formatRupees(s.deliveredValue)} line />
              <SumRow label="TrainDhaba fee" value={`− ${formatRupees(s.fee)}`} tone="error" />
              <SumRow label="Final settled" value={formatRupees(s.earnings)} tone="success" strong line />
              <Typography sx={{ mt: 1, fontSize: 11, color: tokens.color.textMuted }}>
                Undelivered orders are not paid. This is calculated from delivered orders; it is not a record of a bank transfer.
              </Typography>
            </>
          ) : settlement.isLoading ? (
            <Notice>Loading…</Notice>
          ) : (
            <Notice error>{errorText(settlement.error)}</Notice>
          )}
        </Card>
      </Box>
    </Box>
  );
}
