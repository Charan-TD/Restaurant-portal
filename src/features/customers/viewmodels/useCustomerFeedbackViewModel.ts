"use client";
import { useMemo, useState } from "react";
import { DEMO_MODE } from "@/core/constants/config";
import { errorMessage } from "@/shared/utils/errors";
import { PAGE_SIZE } from "../components/ListFooter";
import type { DateRange } from "../components/CustomerToolbar";
import type { ReviewRow } from "../models/review";
import { useGetReviewsQuery } from "../services/reviewApi";
export type ReviewFilter = "rating" | "latest" | "low";
const sorters: Record<ReviewFilter, (a: ReviewRow, b: ReviewRow) => number> = {
  rating: (a, b) => b.rating - a.rating,
  latest: (a, b) => b.at.localeCompare(a.at),
  low: (a, b) => a.rating - b.rating,
};
/** Ratings and reviews left by customers. */
export function useCustomerFeedbackViewModel() {
  const {
      data,
      isLoading: loading,
      error: queryError,
    } = useGetReviewsQuery(undefined, { skip: DEMO_MODE }),
    error = queryError ? errorMessage(queryError) : "",
    reviews = useMemo(() => data ?? [], [data]),
    [search, setSearch] = useState(""),
    [range, setRange] = useState<DateRange>("Last 30 days"),
    [filter, setFilter] = useState<ReviewFilter | null>(null),
    [page, setPage] = useState(1);
  const shown = useMemo(() => {
    const term = search.trim().toLowerCase(),
      list = reviews.filter(
        (r) =>
          !term ||
          r.name.toLowerCase().includes(term) ||
          r.orderId.toLowerCase().includes(term),
      );
    return filter ? [...list].sort(sorters[filter]) : list;
  }, [reviews, search, filter]);
  const lastPage = Math.max(1, Math.ceil(shown.length / PAGE_SIZE)),
    current = Math.min(page, lastPage);
  return {
    loading,
    error,
    total: reviews.length,
    average: reviews.length
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : null,
    shown,
    rows: shown.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE),
    page: current,
    setPage,
    search,
    setSearch: (value: string) => {
      setSearch(value);
      setPage(1);
    },
    range,
    setRange,
    filter,
    setFilter: (value: ReviewFilter | null) => {
      setFilter(value);
      setPage(1);
    },
  };
}
