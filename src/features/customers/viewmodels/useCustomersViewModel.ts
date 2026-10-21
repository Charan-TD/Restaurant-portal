"use client";
import { useEffect, useMemo, useState } from "react";
import { DEMO_MODE } from "@/core/constants/config";
import { errorMessage } from "@/shared/utils/errors";
import { PAGE_SIZE } from "../components/ListFooter";
import type { DateRange } from "../components/CustomerToolbar";
import { getCustomers, type Customer } from "../services/customerService";
export type CustomerFilter = "items" | "orders" | "paid";
const sorters: Record<CustomerFilter, (a: Customer, b: Customer) => number> = {
  items: (a, b) => b.items.length - a.items.length,
  orders: (a, b) => b.orders - a.orders,
  paid: (a, b) => b.spent - a.spent,
};
/** "9876543210" → "98****3210"; anything shorter is shown as it is. */
export const maskPhone = (phone: string | undefined) => {
  const digits = (phone ?? "").replace(/\D/g, "").slice(-10);
  return digits.length === 10
    ? `${digits.slice(0, 2)}****${digits.slice(-4)}`
    : (phone ?? "");
};
/** Customers who ordered from the restaurant, built from its orders. */
export function useCustomersViewModel() {
  const [customers, setCustomers] = useState<Customer[]>([]),
    [loading, setLoading] = useState(!DEMO_MODE),
    [error, setError] = useState(""),
    [search, setSearch] = useState(""),
    [range, setRange] = useState<DateRange>("Last 30 days"),
    [filter, setFilter] = useState<CustomerFilter | null>(null),
    [page, setPage] = useState(1);
  useEffect(() => {
    if (DEMO_MODE) return;
    let cancelled = false;
    getCustomers()
      .then((list) => !cancelled && setCustomers(list))
      .catch((e) => !cancelled && setError(errorMessage(e)))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);
  const shown = useMemo(() => {
    const term = search.trim().toLowerCase(),
      list = customers.filter(
        (c) =>
          !term ||
          (c.name ?? "").toLowerCase().includes(term) ||
          (c.phone ?? "").includes(term),
      );
    return filter ? [...list].sort(sorters[filter]) : list;
  }, [customers, search, filter]);
  const lastPage = Math.max(1, Math.ceil(shown.length / PAGE_SIZE)),
    current = Math.min(page, lastPage);
  return {
    loading,
    error,
    total: customers.length,
    active: customers.filter((c) => c.orders >= 5).length,
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
