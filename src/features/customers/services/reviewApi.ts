import { baseApi } from "@/core/api/baseApi";
import { API_PATHS, endpoint } from "@/core/constants/config";
import type {
  ReplyFilter,
  ReplyStatus,
  ReviewPage,
  ReviewReply,
  ReviewRow,
  ReviewSort,
} from "../models/review";

export interface RatingSummary {
  total: number;
  /** Null when nobody has rated yet. */
  average: number | null;
  /** How many ratings each star (1 to 5) has. */
  counts: Record<1 | 2 | 3 | 4 | 5, number>;
  /** How many reviews are at each stage of replying. */
  replies: { notReplied: number; pending: number; approved: number; rejected: number };
}

type Row = Record<string, unknown>;
const asRow = (value: unknown): Row =>
  value && typeof value === "object" ? (value as Row) : {};
const text = (value: unknown) =>
  typeof value === "string" && value.trim() ? value.trim() : undefined;
const num = (value: unknown) => Number(value) || 0;

function toReply(raw: unknown): ReviewReply | undefined {
  const row = asRow(raw),
    status = text(row.status) as ReplyStatus | undefined;
  if (!status) return undefined;
  return {
    id: text(row.id) ?? "",
    text: text(row.reply_text) ?? "",
    status,
    attempt: num(row.attempt_number) || 1,
    rejectionReason: text(row.rejection_reason),
    canEdit: typeof row.can_edit === "boolean" ? row.can_edit : status === "REJECTED",
    submittedAt: text(row.submitted_at),
  };
}

export function toReview(raw: unknown): ReviewRow {
  const row = asRow(raw);
  return {
    id: text(row.id) ?? "",
    name: text(row.customer_name) ?? "Customer",
    orderId: text(row.order_number) ?? "",
    rating: num(row.rating),
    comment: text(row.review) ?? "",
    at: text(row.created_at) ?? "",
    reply: toReply(row.reply),
  };
}

export interface ReviewQuery {
  page: number;
  rating?: number;
  replyStatus?: ReplyFilter;
  sort?: ReviewSort;
  search?: string;
}

const base = () => endpoint(API_PATHS.reviews);

export const reviewApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    /** GET /restaurant/reviews: ten per page; every filter is applied before paging. */
    getReviews: build.query<ReviewPage, ReviewQuery>({
      query: ({ page, rating, replyStatus, sort, search }) => ({
        url: base(),
        params: {
          page,
          ...(rating && { rating }),
          ...(replyStatus && { reply_status: replyStatus }),
          ...(sort && { sort }),
          ...(search?.trim() && { search: search.trim() }),
        },
      }),
      transformResponse: (data: unknown): ReviewPage => {
        const root = asRow(data),
          pagination = asRow(root.pagination);
        return {
          rows: Array.isArray(root.data) ? root.data.map(toReview) : [],
          page: num(pagination.page) || 1,
          pages: Math.max(1, num(pagination.total_pages)),
          total: num(pagination.total_records),
        };
      },
      providesTags: ["Reviews"],
    }),
    /** GET /restaurant/reviews/metrics: average, how the stars spread, and where replies stand. */
    getRatingSummary: build.query<RatingSummary, void>({
      query: () => ({ url: endpoint(API_PATHS.ratingSummary) }),
      transformResponse: (data: unknown): RatingSummary => {
        const d = asRow(asRow(data).data),
          spread = asRow(d.rating_distribution),
          total = num(d.total_reviews),
          count = (star: number) => num(spread[star]);
        return {
          total,
          average: total ? num(d.average_rating) : null,
          counts: { 1: count(1), 2: count(2), 3: count(3), 4: count(4), 5: count(5) },
          replies: {
            notReplied: num(d.not_replied),
            pending: num(d.pending_replies),
            approved: num(d.approved_replies),
            rejected: num(d.rejected_replies),
          },
        };
      },
      providesTags: ["Reviews"],
    }),
    /** POST /restaurant/reviews/{id}/reply: the first reply; it waits for admin approval. */
    replyToReview: build.mutation<void, { id: string; text: string }>({
      query: ({ id, text }) => ({
        url: `${base()}/${encodeURIComponent(id)}/reply`,
        method: "post",
        data: { reply_text: text },
      }),
      invalidatesTags: ["Reviews"],
    }),
    /** PATCH /restaurant/reviews/{id}/reply: a rejected reply, reworded; the text must differ. */
    resubmitReviewReply: build.mutation<void, { id: string; text: string }>({
      query: ({ id, text }) => ({
        url: `${base()}/${encodeURIComponent(id)}/reply`,
        method: "patch",
        data: { reply_text: text },
      }),
      invalidatesTags: ["Reviews"],
    }),
  }),
});
export const {
  useGetReviewsQuery,
  useGetRatingSummaryQuery,
  useReplyToReviewMutation,
  useResubmitReviewReplyMutation,
} = reviewApi;
