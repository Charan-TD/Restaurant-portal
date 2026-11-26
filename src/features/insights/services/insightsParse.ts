import type {
  EarningsDetails,
  EarningsItem,
  InsightList,
  InsightOrderDetail,
  InsightRow,
  InsightsMetrics,
  InsightsModel,
  OrderOutcome,
  Payment,
  PaymentDistribution,
  PaymentMetric,
  PaymentSplit,
  SettlementBreakdown,
} from "../models/insights";

/** Reads what the Insights API sends; no network here, so it can be tested alone. */
type Row = Record<string, unknown>;
const asRow = (value: unknown): Row =>
  value && typeof value === "object" ? (value as Row) : {};
const text = (value: unknown) =>
  typeof value === "string" && value.trim() ? value.trim() : null;
/** Money comes as "71860.00"; a missing or odd value counts as 0. */
const num = (value: unknown) => {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
};
const maybeNum = (value: unknown) =>
  value === null || value === undefined || value === "" ? null : num(value);
const payment = (value: unknown): Payment | null =>
  value === "COD" || value === "PREPAID" ? value : null;
const outcome = (value: unknown): OrderOutcome | null =>
  value === "DELIVERED" || value === "UNDELIVERED" ? value : null;
const foodType = (value: unknown) => {
  const type = text(value)?.toLowerCase();
  return type === "veg"
    ? "Veg"
    : type === "non_veg" || type === "non-veg"
      ? "Non-veg"
      : type === "egg"
        ? "Egg"
        : "";
};
const dataOf = (body: unknown) => asRow(asRow(body).data);

const paymentMetric = (value: unknown): PaymentMetric | undefined => {
  const row = asRow(value);
  return Object.keys(row).length
    ? {
        amount: num(row.amount),
        orders: num(row.order_count),
        share: num(row.order_percentage),
      }
    : undefined;
};

export function parseMetrics(body: unknown): InsightsMetrics {
  const m = asRow(dataOf(body).metrics),
    orders = asRow(m.total_orders),
    sale = asRow(m.total_sale_value),
    undelivered = asRow(m.undelivered),
    // The server decides who delivers: only own-rider restaurants get
    // COD, prepaid and earnings; the others get "final settled".
    model: InsightsModel = m.final_settled ? "traindhaba" : "own";
  return {
    model,
    totalOrders: { value: num(orders.value), change: maybeNum(orders.change_percentage) },
    totalSale: { amount: num(sale.amount), change: maybeNum(sale.change_percentage) },
    undelivered: {
      count: num(undelivered.count),
      amount: num(undelivered.amount),
      percentage: num(undelivered.percentage),
    },
    cod: paymentMetric(m.cod),
    prepaid: paymentMetric(m.prepaid),
    payout: num(
      asRow(model === "own" ? m.your_earnings : m.final_settled).amount,
    ),
  };
}

function toEarningsItem(raw: unknown): EarningsItem {
  const r = asRow(raw);
  return {
    id: text(r.item_id) ?? String(r.item_name),
    name: text(r.item_name) ?? "Item",
    type: foodType(r.food_type),
    orders: num(r.total_orders),
    unitPrice: num(r.unit_price),
    undelivered: num(r.undelivered),
    cod: num(r.cod),
    prepaid: num(r.prepaid),
    deliveredValue: num(r.delivered_sale_value),
    final: num(r.final_earnings ?? r.final_settled),
  };
}

export function parseEarnings(body: unknown): EarningsDetails {
  const data = dataOf(body),
    s = asRow(data.summary),
    items = Array.isArray(data.items) ? data.items : [];
  return {
    model: "final_settled" in s ? "traindhaba" : "own",
    items: items.map(toEarningsItem),
    total: {
      orders: num(s.total_orders),
      undelivered: num(s.undelivered),
      cod: num(s.cod),
      prepaid: num(s.prepaid),
      deliveredValue: num(s.delivered_sale_value),
      final: num(s.final_earnings ?? s.final_settled),
    },
  };
}

const settlementPayment = (value: unknown) => {
  const row = asRow(value);
  return Object.keys(row).length
    ? { orders: num(row.order_count), amount: num(row.amount) }
    : undefined;
};

export function parseSettlement(body: unknown): SettlementBreakdown {
  const d = dataOf(body),
    breakdown = asRow(d.payment_breakdown),
    undelivered = asRow(d.undelivered);
  return {
    model: Object.keys(breakdown).length ? "own" : "traindhaba",
    totalOrders: num(d.total_orders),
    totalSale: num(d.total_sale_value),
    cod: settlementPayment(breakdown.cod),
    prepaid: settlementPayment(breakdown.prepaid),
    undelivered: { orders: num(undelivered.order_count), amount: num(undelivered.amount) },
    deliveredValue: num(d.delivered_sale_value),
    fee: num(d.traindhaba_fee),
    earnings: num(d.your_earnings),
  };
}

const split = (value: unknown): PaymentSplit => {
  const r = asRow(value);
  return {
    orders: num(r.order_count),
    saleValue: num(r.sale_value),
    orderShare: num(r.order_percentage),
    salesShare: num(r.sales_percentage),
    avgPerOrder: num(r.avg_per_order),
  };
};

export function parseDistribution(body: unknown): PaymentDistribution {
  const d = dataOf(body),
    methods = asRow(d.payment_methods);
  return {
    totalOrders: num(d.total_orders),
    totalSale: num(d.total_sale_value),
    cod: split(methods.cod),
    prepaid: split(methods.prepaid),
  };
}

function toRow(raw: unknown): InsightRow {
  const r = asRow(raw),
    items = Array.isArray(r.items) ? r.items : [],
    collected = r.collected_by;
  return {
    id: text(r.ord_id) ?? "",
    at: text(r.date_time) ?? "",
    train: text(r.train),
    station: text(r.station),
    coach: text(r.coach),
    seat: text(r.seat),
    // The orders list sends a count; the sale list sends the items.
    itemCount: typeof r.items === "number" ? r.items : items.length,
    itemList: items.map((i) => ({
      name: text(asRow(i).item_name) ?? "Item",
      quantity: num(asRow(i).quantity),
    })),
    amount: num(r.amount ?? r.sale_value),
    payment: payment(r.payment),
    status: outcome(r.status),
    reason: text(r.reason),
    settlement: text(r.settlement),
    collectedBy:
      typeof collected === "string"
        ? text(collected)
        : text(asRow(collected).name ?? asRow(collected).rider_name),
    cashStatus: text(r.cash_status),
    method: text(r.method),
    transactionId: text(r.transaction_id),
  };
}

export function parseList(body: unknown, page: number): InsightList {
  const d = dataOf(body),
    p = asRow(d.pagination),
    s = asRow(d.summary),
    rows = Array.isArray(d.orders) ? d.orders.map(toRow) : [],
    total = num(p.total_records ?? s.total_orders);
  return {
    rows,
    pagination: {
      page: num(p.current_page) || page,
      pageSize: num(p.page_size) || 10,
      total,
      pages: Math.max(1, num(p.total_pages)),
    },
    summary: {
      orders: total,
      amount: maybeNum(s.total_amount ?? s.total_sale_value),
      percentOfAll: maybeNum(s.percentage_of_all_orders),
    },
  };
}

export function parseOrder(body: unknown, id: string): InsightOrderDetail {
  const d = dataOf(body),
    who = asRow(d.passenger_details),
    train = asRow(who.train),
    station = asRow(who.delivery_station),
    pay = asRow(d.payment_and_earnings),
    items = Array.isArray(d.items) ? d.items : [],
    timeline = Array.isArray(d.order_timeline) ? d.order_timeline : [],
    number = text(train.number),
    name = text(train.name),
    stationName = text(station.name),
    code = text(station.code);
  return {
    id: text(d.ord_id) ?? id,
    status: outcome(d.status) ?? "UNDELIVERED",
    at: text(d.date_time) ?? "",
    passenger: { name: text(who.name), phone: text(who.phone) },
    train: [number, name].filter(Boolean).join(" ") || null,
    coach: text(who.coach),
    seat: text(who.seat),
    deliveryStation: stationName
      ? code
        ? `${stationName} (${code})`
        : stationName
      : code,
    items: items.map((i) => {
      const r = asRow(i);
      return {
        name: text(r.item_name) ?? "Item",
        quantity: num(r.quantity),
        price: num(r.customer_price),
        fee: num(r.traindhaba_commission_amount),
        earning: num(r.restaurant_earning),
      };
    }),
    orderValue: num(pay.order_value),
    payment: payment(pay.payment),
    rider: text(asRow(pay.rider).name),
    fee: num(pay.traindhaba_fee),
    earning: num(pay.your_earnings),
    timeline: timeline.map((t) => ({
      event: text(asRow(t).event) ?? "",
      label: text(asRow(t).label) ?? "",
      at: text(asRow(t).timestamp) ?? "",
    })),
  };
}

