import { baseApi } from "@/core/api/baseApi";
import { API_PATHS, endpoint } from "@/core/constants/config";
import {
  offerToForm,
  toOfferPayload,
  type Offer,
  type OfferForm,
  type OfferMetrics,
  type OfferPage,
  type OfferStatus,
} from "../models/offer";

type Row = Record<string, unknown>;
const asRow = (value: unknown): Row =>
  value && typeof value === "object" ? (value as Row) : {};
const num = (value: unknown) => Number(value) || 0;
const base = () => endpoint(API_PATHS.offers);
const url = (id: string) => `${base()}/${encodeURIComponent(id)}`;
const STATUSES: OfferStatus[] = ["live", "paused", "scheduled", "ended"];

function toOffer(raw: unknown): Offer {
  const row = asRow(raw),
    status = String(row.status ?? "").toLowerCase();
  return {
    id: String(row.id ?? ""),
    form: offerToForm(row),
    status: STATUSES.includes(status as OfferStatus) ? (status as OfferStatus) : "ended",
    active: row.is_active !== false,
  };
}

export const offerApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    /** GET /restaurant/offers: ten per page, with the count of every tab. */
    getOffers: build.query<OfferPage, { status: OfferStatus; page: number }>({
      query: ({ status, page }) => ({
        url: base(),
        params: { status: status.toUpperCase(), page },
      }),
      transformResponse: (data: unknown): OfferPage => {
        const root = asRow(data),
          pagination = asRow(root.pagination),
          counts = asRow(root.status_counts);
        return {
          rows: Array.isArray(root.data) ? root.data.map(toOffer) : [],
          page: num(pagination.page) || 1,
          pages: Math.max(1, num(pagination.total_pages)),
          counts: {
            live: num(counts.LIVE),
            paused: num(counts.PAUSED),
            scheduled: num(counts.SCHEDULED),
            ended: num(counts.ENDED),
          },
        };
      },
      providesTags: ["Offers"],
    }),
    /** GET /restaurant/offers/{id}: how one offer did over the last seven days. */
    getOfferMetrics: build.query<OfferMetrics, string>({
      query: (id) => ({ url: url(id) }),
      transformResponse: (data: unknown): OfferMetrics => {
        const d = asRow(asRow(data).data);
        return {
          orders: num(d.orders_with_offers),
          discount: num(d.discount_you_gave),
          sales: num(d.sales_from_offers),
        };
      },
      providesTags: ["Offers"],
    }),
    createOffer: build.mutation<void, OfferForm>({
      query: (form) => ({ url: base(), method: "post", data: toOfferPayload(form) }),
      invalidatesTags: ["Offers"],
    }),
    /** PATCH: the money terms cannot change once the offer has been used (409). */
    updateOffer: build.mutation<void, { id: string; form: OfferForm }>({
      query: ({ id, form }) => ({ url: url(id), method: "patch", data: toOfferPayload(form) }),
      invalidatesTags: ["Offers"],
    }),
    /** PATCH /restaurant/offers/{id}/status { is_active }: pause or resume; an ended offer cannot restart (409). */
    setOfferActive: build.mutation<void, { id: string; active: boolean }>({
      query: ({ id, active }) => ({
        url: `${url(id)}/status`,
        method: "patch",
        data: { is_active: active },
      }),
      invalidatesTags: ["Offers"],
    }),
    deleteOffer: build.mutation<void, string>({
      query: (id) => ({ url: url(id), method: "delete" }),
      invalidatesTags: ["Offers"],
    }),
  }),
});
export const {
  useGetOffersQuery,
  useGetOfferMetricsQuery,
  useCreateOfferMutation,
  useUpdateOfferMutation,
  useSetOfferActiveMutation,
  useDeleteOfferMutation,
} = offerApi;
