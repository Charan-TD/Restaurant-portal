"use client";
import { useMemo, useState } from "react";
import { DEMO_MODE } from "@/core/constants/config";
import { errorMessage } from "@/shared/utils/errors";
import { PAGE_SIZE } from "../components/ListFooter";
import type { DateRange } from "../components/CustomerToolbar";
import { useDebouncedValue } from "@/shared/hooks/useDebouncedValue";
import {
  useGetCustomersQuery,
  useSearchCustomersQuery,
  type Customer,
} from "../services/customerApi";
export type CustomerFilter = "items" | "orders" | "paid";
const sorters: Record<CustomerFilter, (a: Customer, b: Customer) => number> = {
  items: (a, b) =>
    (b.lastOrder?.items.length ?? 0) - (a.lastOrder?.items.length ?? 0),
  orders: (a, b) => b.orders.length - a.orders.length,
  paid: (a, b) => b.spent - a.spent,
};
/** "9876543210" → "98****3210"; anything shorter is shown as it is. */
export const maskPhone = (phone: string | undefined) => {
  const digits = (phone ?? "").replace(/\D/g, "").slice(-10);
  return digits.length === 10
    ? `${digits.slice(0, 2)}****${digits.slice(-4)}`
    : (phone ?? "");
};
/** Customers who ordered from the restaurant; searching asks the server. */
export function useCustomersViewModel() {
  const {
      data,
      isLoading,
      error: queryError,
    } = useGetCustomersQuery(undefined, { skip: DEMO_MODE }),
    [search, setSearch] = useState(""),
    term = useDebouncedValue(search.trim()),
    // The server searches name, phone, email, order, train and items.
    found = useSearchCustomersQuery(term, { skip: DEMO_MODE || !term }),
    searching = Boolean(term && search.trim()) && !DEMO_MODE,
    customers = useMemo(() => data ?? [], [data]),
    loading = searching ? found.isFetching : isLoading,
    error = (searching ? found.error : queryError)
      ? errorMessage(searching ? found.error : queryError)
      : "",
    [range, setRange] = useState<DateRange>("Last 30 days"),
    [filter, setFilter] = useState<CustomerFilter | null>(null),
    [page, setPage] = useState(1);
  const shown = useMemo(() => {
    const text = search.trim().toLowerCase(),
      list = searching
        ? (found.data ?? [])
        : customers.filter(
            (c) =>
              !text ||
              (c.name ?? "").toLowerCase().includes(text) ||
              (c.phone ?? "").includes(text),
          );
    return filter ? [...list].sort(sorters[filter]) : list;
  }, [customers, found.data, searching, search, filter]);
  const lastPage = Math.max(1, Math.ceil(shown.length / PAGE_SIZE)),
    current = Math.min(page, lastPage);
  return {
    loading,
    error,
    total: customers.length,
    active: customers.filter((c) => c.orders.length >= 5).length,
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
    setFilter: (value: CustomerFilter | null) => {
      setFilter(value);
      setPage(1);
    },
  };
}
