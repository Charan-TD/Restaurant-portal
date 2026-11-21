"use client";
import { Box, Typography } from "@mui/material";
import { tokens } from "@/core/theme/tokens";
import { formatRupees } from "@/shared/utils/format";
import { FoodTypeMark } from "@/shared/components/feedback/FoodTypeMark";
import {
  settlementSample,
  settlementTotals,
  TRAINDHABA_FEE,
} from "../models/settlement";
import {
  Card,
  DownloadButton,
  StatCard,
  SumRow,
  TableRow,
  TableScroll,
} from "../components/SettlementParts";

const COLUMNS = "minmax(180px, 2.2fr) repeat(6, minmax(80px, 1fr))",
  feePercent = `${Math.round(TRAINDHABA_FEE * 100)}%`,
  up = (percent: number) => `▲ ${percent}% vs last week`;

/** One payment method: amount, share of sales and a bar. */
function MethodCard({
  title,
  note,
  amount,
  orders,
  share,
  avg,
  color,
  tint,
}: {
  title: string;
  note: string;
  amount: number;
  orders: number;
  share: number;
  avg: number;
  color: string;
  tint: string;
}) {
  return (
    <Box sx={{ p: 2, borderRadius: "12px", border: `1px solid ${tokens.color.border}` }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        <Box sx={{ width: 40, height: 40, borderRadius: "10px", bgcolor: tint }} />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontSize: 14, fontWeight: 700 }}>{title}</Typography>
          <Typography sx={{ fontSize: 12, color: tokens.color.textMuted }}>{note}</Typography>
        </Box>
        <Typography sx={{ fontSize: 22, fontWeight: 700 }}>{formatRupees(amount)}</Typography>
      </Box>
      <Box sx={{ mt: 1.5, height: 6, borderRadius: 3, bgcolor: tokens.color.muted }}>
        <Box sx={{ width: `${share}%`, height: "100%", borderRadius: 3, bgcolor: color }} />
      </Box>
      <Box sx={{ mt: 1, display: "flex", justifyContent: "space-between", fontSize: 12, color: tokens.color.textMuted }}>
        <span>
          <b style={{ color: tokens.color.text }}>{orders}</b> orders · {share}% of sales
        </span>
        <span>Avg {formatRupees(avg)} per order</span>
      </Box>
    </Box>
  );
}

/**
 * Insights for a restaurant with its own riders: what was sold, how it was
 * paid (cash collected by the rider or paid online), and the earnings after
 * TrainDhaba's fee. DESIGN ONLY: sample data (see models/settlement.ts).
 */
export function OwnRidersInsights({ period }: { period: string }) {
  const { items, ordersChange, salesChange, codOrders, prepaidOrders } = settlementSample,
    t = settlementTotals(items),
    codShare = Math.round((t.cod / t.sale) * 100),
    prepaidShare = 100 - codShare;
  return (
    <Box sx={{ display: "grid", gap: 3 }}>
      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", lg: "repeat(6, minmax(0, 1fr))" },
        }}
      >
        <StatCard label="Total orders" value={t.orders} note={up(ordersChange)} noteColor={tokens.color.success} href="/insights/total-orders" />
        <StatCard
          label="Undelivered"
          value={t.undelivered}
          note={`${t.undeliveredPercent}% of orders`}
          noteColor={tokens.color.error}
          href="/insights/undelivered"
        />
        <StatCard label="Total sale value" value={formatRupees(t.sale)} note={up(salesChange)} noteColor={tokens.color.success} href="/insights/total-sale" />
        <StatCard label="COD" value={formatRupees(t.cod)} note={`${codOrders} orders · ${codShare}%`} href="/insights/cod" />
        <StatCard label="Prepaid" value={formatRupees(t.prepaid)} note={`${prepaidOrders} orders · ${prepaidShare}%`} href="/insights/prepaid" />
        <StatCard
          label="Your earnings"
          value={formatRupees(t.earnings)}
          note={`After ${feePercent} TrainDhaba fee`}
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
          <Box sx={{ display: "grid", gap: 1.5 }}>
            <MethodCard
              title="Cash on delivery"
              note="Collected by rider at the coach"
              amount={t.cod}
              orders={codOrders}
              share={codShare}
              avg={Math.round(t.cod / codOrders)}
              color="#8a5a00"
              tint="#fff4d6"
            />
            <MethodCard
              title="Prepaid"
              note="Paid online by passenger"
              amount={t.prepaid}
              orders={prepaidOrders}
              share={prepaidShare}
              avg={Math.round(t.prepaid / prepaidOrders)}
              color="#1a56b0"
              tint="#e3ecfb"
            />
          </Box>
        </Card>
        <Card title="How settlement is worked out">
          <SumRow label={`Total sale value · ${t.orders} orders`} value={formatRupees(t.sale)} />
          <SumRow label={`COD · ${codOrders} orders`} value={formatRupees(t.cod)} tone="muted" />
          <SumRow label={`Prepaid · ${prepaidOrders} orders`} value={formatRupees(t.prepaid)} tone="muted" />
          <SumRow label={`TrainDhaba fee (${feePercent})`} value={`− ${formatRupees(t.fee)}`} tone="error" line />
          <SumRow label="Your earnings" value={formatRupees(t.earnings)} tone="success" strong line />
          <Typography sx={{ mt: 1, fontSize: 11, color: tokens.color.textMuted }}>
            COD cash collected by riders is adjusted in your payout. Settlements reach your bank every Friday.
          </Typography>
        </Card>
      </Box>
      <Card title="Earnings details" subtitle={`${period} · final earnings after ${feePercent} TrainDhaba fee`} action={<DownloadButton />} flush>
        <TableScroll>
          <TableRow
            head
            columns={COLUMNS}
            cells={["ITEM", "TOTAL ORDERS", "UNIT PRICE", "COD", "PREPAID", "SALE VALUE", "FINAL EARNINGS"]}
          />
          {items.map((item) => {
            const sale = item.cod + item.prepaid;
            return (
              <TableRow
                key={item.name}
                columns={COLUMNS}
                cells={[
                  <Box key="n" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <FoodTypeMark type={item.type} />
                    {item.name}
                  </Box>,
                  item.orders,
                  formatRupees(item.unitPrice),
                  formatRupees(item.cod),
                  formatRupees(item.prepaid),
                  <Box key="s" component="span" sx={{ color: tokens.color.textMuted }}>
                    {formatRupees(sale)}
                  </Box>,
                  <Box key="f" component="b" sx={{ color: tokens.color.success }}>
                    {formatRupees(Math.round(sale * (1 - TRAINDHABA_FEE)))}
                  </Box>,
                ]}
              />
            );
          })}
          <TableRow
            foot
            columns={COLUMNS}
            cells={[
              "Total",
              t.orders,
              "—",
              formatRupees(t.cod),
              formatRupees(t.prepaid),
              formatRupees(t.sale),
              <Box key="f" component="span" sx={{ color: tokens.color.success }}>
                {formatRupees(t.earnings)}
              </Box>,
            ]}
          />
        </TableScroll>
      </Card>
    </Box>
  );
}
