import { baseApi, flow, type Send } from "@/core/api/baseApi";
import { API_PATHS, endpoint } from "@/core/constants/config";
import type { ReviewRow } from "../models/review";
type Row = Record<string, unknown>;
const asRow = (value: unknown): Row =>
  value && typeof value === "object" ? (value as Row) : {};
const text = (value: unknown) =>
  typeof value === "string" && value.trim()
    ? value.trim()
    : typeof value === "number"
      ? String(value)
      : undefined;
const list = (value: unknown) => (Array.isArray(value) ? value : []);
/** A safety stop on how many pages are fetched. */
const MAX_PAGES = 50;
/** The most reviews the server returns per page. */
const LIMIT = 100;
const formatDate = (iso: string | undefined) =>
  iso && !Number.isNaN(Date.parse(iso))
    ? new Date(iso).toLocaleString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : "";
function toReview(raw: unknown, i: number): ReviewRow {
  const row = asRow(raw),
    orderId = text(row.order_id) ?? "",
    at = text(row.reviewed_at) ?? "";
  return {
    id: orderId || `review-${i}`,
    name: text(row.customer_name) ?? "Customer",
    photo: text(row.customer_profile_img),
    orderId,
    items: list(row.menu_items).flatMap((line) => {
      const item = asRow(line),
        name = text(item.item_name);
      return name ? [{ name, quantity: Number(item.quantity) || 1 }] : [];
    }),
    rating: Number(row.ord_rating) || 0,
    date: formatDate(at),
    at,
    comment: text(row.comment) ?? "",
  };
}
/** Reads every page of reviews, as the server pages it. */
async function fetchAllPages(send: Send, url: string): Promise<unknown[]> {
  const rows: unknown[] = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const body = asRow(
      asRow(await send({ url, params: { page, limit: LIMIT } })).data,
    );
    rows.push(...list(body.reviews));
    if (page >= (Number(asRow(body.pagination).totalPages) || 1)) break;
  }
  return rows;
}
export const reviewApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    /** GET /restaurant/reviews: every page, so the totals cover all of them. */
    getReviews: build.query<ReviewRow[], void>({
      queryFn: flow<void, ReviewRow[]>(async (_, send) =>
        (await fetchAllPages(send, endpoint(API_PATHS.reviews))).map(toReview),
      ),
      providesTags: ["Reviews"],
    }),
  }),
});
export const { useGetReviewsQuery } = reviewApi;
