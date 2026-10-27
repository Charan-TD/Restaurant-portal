"use client";
import { useState } from "react";
import { DEMO_MODE } from "@/core/constants/config";
import { usePortal } from "@/core/providers/PortalProvider";
import { errorMessage } from "@/shared/utils/errors";
import { useDebouncedValue } from "@/shared/hooks/useDebouncedValue";
import {
  useGetOrderPageQuery,
  useSearchOrdersQuery,
} from "../services/orderApi";
import type { OrderStatus } from "../models/order";

export type OrderFilter = OrderStatus | "FAILED" | undefined;

/** Every order the restaurant has received, a page at a time, newest first. */
export function useAllOrdersViewModel() {
  const { orders: demoOrders } = usePortal(),
    [page, setPage] = useState(1),
    [status, setStatus] = useState<OrderFilter>(undefined),
    [search, setSearch] = useState(""),
    term = useDebouncedValue(search.trim()),
    // The server matches order number, customer, train and items.
    searching = Boolean(term && search.trim()) && !DEMO_MODE,
    listed = useGetOrderPageQuery(
      { page, status },
      { skip: DEMO_MODE || searching, pollingInterval: 60_000 },
    ),
    found = useSearchOrdersQuery({ q: term, page }, { skip: !searching }),
    { data, isFetching, error } = searching ? found : listed;
  const orders = DEMO_MODE
      ? demoOrders.filter(
          (o) =>
            (!status || o.state === status) &&
            (!search.trim() ||
              `${o.id} ${o.food} ${o.customer ?? ""}`
                .toLowerCase()
                .includes(search.trim().toLowerCase())),
        )
      : (data?.orders ?? []).filter(
          // A status chosen while searching narrows the matches.
          (o) =>
            !searching || !status || status === "FAILED" || o.state === status,
        ),
    total = DEMO_MODE ? orders.length : (data?.total ?? 0);
  return {
    orders,
    total,
    page,
    pageSize: data?.limit || orders.length || 1,
    totalPages: data?.totalPages ?? 1,
    status,
    search,
    searching,
    loading: isFetching && !data,
    error: error ? errorMessage(error) : "",
    setPage,
    setStatus: (value: OrderFilter) => {
      setStatus(value);
      setPage(1);
    },
    setSearch: (value: string) => {
      setSearch(value);
      setPage(1);
    },
  };
}
