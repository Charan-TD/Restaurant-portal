import { baseApi, flow } from "@/core/api/baseApi";
import { API_PATHS, endpoint } from "@/core/constants/config";
import type { DetailKind } from "../models/orderDetails";
import type {
  EarningsDetails,
  InsightList,
  InsightListQuery,
  InsightOrderDetail,
  InsightsMetrics,
  InsightsPeriod,
  PaymentDistribution,
  SettlementBreakdown,
} from "../models/insights";
import {
  parseDistribution,
  parseEarnings,
  parseList,
  parseMetrics,
  parseOrder,
  parseSettlement,
} from "./insightsParse";

const base = () => endpoint(API_PATHS.insights);
const LIST_PATH: Record<DetailKind, string> = {
  "total-orders": "/orders",
  undelivered: "/undelivered",
  "total-sale": "/total-sale-value",
  cod: "/cod",
  prepaid: "/prepaid",
};

/** GET <insights>/<path>?period=… read by `parse`. */
const byPeriod = <T,>(path: string, parse: (body: unknown) => T) =>
  flow<InsightsPeriod, T>(async (period, send) =>
    parse(await send({ url: `${base()}${path}`, params: { period } })),
  );

type ListArg = { kind: DetailKind; query: InsightListQuery };

export const insightsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getInsightsMetrics: build.query<InsightsMetrics, InsightsPeriod>({
      queryFn: byPeriod("/metrics", parseMetrics),
    }),
    getInsightsEarnings: build.query<EarningsDetails, InsightsPeriod>({
      queryFn: byPeriod("/earnings-details", parseEarnings),
    }),
    getInsightsSettlement: build.query<SettlementBreakdown, InsightsPeriod>({
      queryFn: byPeriod("/settlement-breakdown", parseSettlement),
    }),
    /** Own riders only: the server answers 403 to the others. */
    getInsightsDistribution: build.query<PaymentDistribution, InsightsPeriod>({
      queryFn: byPeriod("/payment-distribution", parseDistribution),
    }),
    getInsightList: build.query<InsightList, ListArg>({
      queryFn: flow<ListArg, InsightList>(async ({ kind, query }, send) =>
        parseList(
          await send({
            url: `${base()}${LIST_PATH[kind]}`,
            params: {
              page: query.page,
              search: query.search || undefined,
              payment: query.payment,
              status: query.status,
              date_from: query.dateFrom,
              date_to: query.dateTo,
            },
          }),
          query.page,
        ),
      ),
    }),
    getInsightOrder: build.query<InsightOrderDetail, string>({
      queryFn: flow<string, InsightOrderDetail>(async (id, send) =>
        parseOrder(
          await send({ url: `${base()}/orders/${encodeURIComponent(id)}` }),
          id,
        ),
      ),
    }),
  }),
});

export const {
  useGetInsightsMetricsQuery,
  useGetInsightsEarningsQuery,
  useGetInsightsSettlementQuery,
  useGetInsightsDistributionQuery,
  useGetInsightListQuery,
  useGetInsightOrderQuery,
} = insightsApi;
