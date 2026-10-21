"use client";
import { useEffect, useMemo, useState } from "react";
import { DEMO_MODE } from "@/core/constants/config";
import { errorMessage } from "@/shared/utils/errors";
import { PAGE_SIZE } from "../components/ListFooter";
import type { DateRange } from "../components/CustomerToolbar";
import { sentimentOf, type ReviewRow } from "../models/review";
import { getReviews } from "../services/reviewService";
export type ReviewFilter = "rating" | "latest" | "low" | "item";
const sorters: Record<ReviewFilter, (a: ReviewRow, b: ReviewRow) => number> = {
  rating: (a, b) => b.rating - a.rating,
  latest: (a, b) => b.at.localeCompare(a.at),
  low: (a, b) => a.rating - b.rating,
  item: (a, b) => a.item.localeCompare(b.item),
};
/** Ratings and reviews left by customers. */
export function useCustomerFeedbackViewModel() {
  const [reviews, setReviews] = useState<ReviewRow[]>([]),
    [loading, setLoading] = useState(!DEMO_MODE),
    [error, setError] = useState(""),
    [search, setSearch] = useState(""),
    [range, setRange] = useState<DateRange>("Last 30 days"),
    [filter, setFilter] = useState<ReviewFilter | null>(null),
    [page, setPage] = useState(1);
  useEffect(() => {
    if (DEMO_MODE) return;
    let cancelled = false;
    getReviews()
      .then((list) => !cancelled && setReviews(list))
      .catch((e) => !cancelled && setError(errorMessage(e)))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);
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
    positive: reviews.filter((r) => sentimentOf(r.rating) === "Positive")
      .length,
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
