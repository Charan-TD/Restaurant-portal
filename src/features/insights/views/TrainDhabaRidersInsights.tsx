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

const COLUMNS = "minmax(180px, 2.2fr) repeat(5, minmax(90px, 1fr))",
  feePercent = `${Math.round(TRAINDHABA_FEE * 100)}%`;

/**
 * Insights for a restaurant whose orders TrainDhaba's riders deliver: the
 * riders confirm deliveries, so the settlement is item-wise and undelivered
 * orders are not paid. DESIGN ONLY: sample data (see models/settlement.ts).
 */
export function TrainDhabaRidersInsights({ period }: { period: string }) {
  const { items, ordersChange, payout } = settlementSample,
    t = settlementTotals(items);
  return (
    <Box sx={{ display: "grid", gap: 3 }}>
      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", lg: "repeat(4, minmax(0, 1fr))" },
        }}
      >
        <StatCard label="Total orders" value={t.orders} note={`▲ ${ordersChange}% vs last week`} noteColor={tokens.color.success} />
        <StatCard label="Avg unit price" value={formatRupees(t.avgUnitPrice)} note="Per order" />
        <StatCard
          label="Undelivered"
          value={t.undelivered}
          note={`${t.undeliveredPercent}% of orders · not paid`}
          noteColor={tokens.color.error}
        />
        <StatCard label="Final settled" value={formatRupees(t.settled)} note={payout} noteColor={tokens.color.success} highlight />
      </Box>
      <Box
        sx={{
          display: "grid",
          gap: 3,
          alignItems: "start",
          gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 1fr) 360px" },
        }}
      >
        <Card title="Item-wise settlement" subtitle={period} action={<DownloadButton />} flush>
          <TableScroll min={640}>
            <TableRow
              head
              columns={COLUMNS}
              cells={["ITEM", "TOTAL ORDERS", "UNIT PRICE", "UNDELIVERED", "DELIVERED VALUE", "FINAL SETTLED"]}
            />
            {items.map((item) => {
              const delivered = item.cod + item.prepaid - item.undelivered * item.unitPrice;
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
                    <Box
                      key="u"
                      component="span"
                      sx={{ fontWeight: 700, color: item.undelivered ? tokens.color.error : tokens.color.textMuted }}
                    >
                      {item.undelivered || 0}
                    </Box>,
                    <Box key="d" component="span" sx={{ color: tokens.color.textMuted }}>
                      {formatRupees(delivered)}
                    </Box>,
                    <Box key="f" component="b" sx={{ color: tokens.color.success }}>
                      {formatRupees(Math.round(delivered * (1 - TRAINDHABA_FEE)))}
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
                <Box key="u" component="span" sx={{ color: tokens.color.error }}>
                  {t.undelivered}
                </Box>,
                formatRupees(t.deliveredValue),
                <Box key="f" component="span" sx={{ color: tokens.color.success }}>
                  {formatRupees(t.settled)}
                </Box>,
              ]}
            />
          </TableScroll>
        </Card>
        <Card title="How settlement is worked out">
          <SumRow label={`Total sale value · ${t.orders} orders`} value={formatRupees(t.sale)} />
          <SumRow label={`Undelivered · ${t.undelivered} orders`} value={`− ${formatRupees(t.undeliveredValue)}`} tone="error" />
          <SumRow label="Delivered sale value" value={formatRupees(t.deliveredValue)} line />
          <SumRow label={`TrainDhaba fee (${feePercent})`} value={`− ${formatRupees(t.settledFee)}`} tone="error" />
          <SumRow label="Final settled" value={formatRupees(t.settled)} tone="success" strong line />
          <Typography sx={{ mt: 1, fontSize: 11, color: tokens.color.textMuted }}>
            Undelivered orders are not paid. Settlements reach your bank every Friday.
          </Typography>
        </Card>
      </Box>
    </Box>
  );
}
