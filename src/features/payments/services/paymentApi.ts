import { baseApi } from "@/core/api/baseApi";
import { API_PATHS, endpoint } from "@/core/constants/config";
import {
  toBreakdown,
  toPayout,
  toPayoutPage,
  toSummary,
  type PaymentBreakdown,
  type PaymentSummary,
  type Payout,
  type PayoutPage,
  type PayoutStatus,
  type PayoutType,
} from "../models/payments";

export interface PayoutQuery {
  page: number;
  type?: PayoutType;
  status?: PayoutStatus;
  fromDate?: string;
  toDate?: string;
}

const base = () => endpoint(API_PATHS.payments);
const payoutOf = (raw: unknown) =>
  toPayout((raw as { data?: unknown } | null)?.data);

export const paymentApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    /** GET /restaurant/payments/summary: wallet, what can be paid out, last payout. */
    getPaymentSummary: build.query<PaymentSummary, void>({
      query: () => ({ url: `${base()}/summary` }),
      transformResponse: toSummary,
      providesTags: ["Payments"],
    }),
    /** GET /restaurant/payments/breakdown: the unsettled money, line by line. */
    getPaymentBreakdown: build.query<PaymentBreakdown, void>({
      query: () => ({ url: `${base()}/breakdown` }),
      transformResponse: toBreakdown,
      providesTags: ["Payments"],
    }),
    /** GET /restaurant/payments/history: one page of payouts, filtered on the server. */
    getPayouts: build.query<PayoutPage, PayoutQuery>({
      query: ({ page, type, status, fromDate, toDate }) => ({
        url: `${base()}/history`,
        params: {
          page,
          ...(type && { payout_type: type }),
          ...(status && { status }),
          ...(fromDate && { from_date: fromDate }),
          ...(toDate && { to_date: toDate }),
        },
      }),
      transformResponse: toPayoutPage,
      providesTags: ["Payments"],
    }),
    /** GET /restaurant/payments/history/{id}: one payout with what it was made of. */
    getPayout: build.query<Payout, string>({
      query: (id) => ({ url: `${base()}/history/${encodeURIComponent(id)}` }),
      transformResponse: payoutOf,
      providesTags: ["Payments"],
    }),
    /** POST /regular-payout: moves the eligible balance to the wallet (409 until the interval has passed). */
    requestRegularPayout: build.mutation<Payout, void>({
      query: () => ({ url: `${base()}/regular-payout`, method: "post" }),
      transformResponse: payoutOf,
      invalidatesTags: ["Payments"],
    }),
    /** POST /emergency-payout: asks the admins to pay out early; it stays PENDING until they decide. */
    requestEmergencyPayout: build.mutation<Payout, void>({
      query: () => ({ url: `${base()}/emergency-payout`, method: "post" }),
      transformResponse: payoutOf,
      invalidatesTags: ["Payments"],
    }),
  }),
});

export const {
  useGetPaymentSummaryQuery,
  useGetPaymentBreakdownQuery,
  useGetPayoutsQuery,
  useGetPayoutQuery,
  useRequestRegularPayoutMutation,
  useRequestEmergencyPayoutMutation,
} = paymentApi;
