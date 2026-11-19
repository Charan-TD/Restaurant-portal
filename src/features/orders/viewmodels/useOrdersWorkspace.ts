"use client";
import { useEffect, useMemo, useState } from "react";
import { DEMO_MODE } from "@/core/constants/config";
import { useOrdersViewModel } from "@/features/dashboard/viewmodels/useOrdersViewModel";
import {
  useGetOrderQuery,
  useLazyGetOrderPageQuery,
} from "@/features/dashboard/services/orderApi";
import { errorMessage } from "@/shared/utils/errors";
import { inRange, type DateRange } from "../models/dateRange";
import type { Order, OrderStatus } from "@/features/dashboard/models/order";

export type OrdersTab = "new" | "preparing" | "ready" | "past";

export const tabStates: Record<OrdersTab, OrderStatus[]> = {
  new: ["New"],
  preparing: ["Preparing"],
  ready: ["Ready"],
  past: ["HandedOver", "Delivered", "Rejected"],
};

const placed = (o: Order) => Date.parse(o.placedAt ?? "") || 0;

/** A clock that ticks every second while something on screen counts down. */
export function useNow(active: boolean) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [active]);
  return now;
}

/** The most pages read for past orders, so a long history cannot load forever. */
const MAX_PAGES = 30;

/**
 * Past orders, beyond the first page the live list polls. The orders API has
 * no date filter and lists the newest first, so pages are read until one goes
 * past the start of the chosen range, or the list ends.
 */
function usePastOrders(active: boolean, from: number | undefined) {
  const [fetchPage] = useLazyGetOrderPageQuery(),
    [orders, setOrders] = useState<Order[]>([]),
    [loading, setLoading] = useState(false),
    [error, setError] = useState("");
  useEffect(() => {
    if (!active || DEMO_MODE) return;
    let live = true;
    void (async () => {
      setLoading(true);
      setError("");
      const all: Order[] = [];
      try {
        for (let page = 1; page <= MAX_PAGES; page++) {
          const got = await fetchPage({ page }, true).unwrap();
          all.push(...got.orders);
          const oldest = Math.min(...got.orders.map(placed));
          if (!got.orders.length || page >= got.totalPages || (from !== undefined && oldest < from)) break;
        }
        if (live) setOrders(all);
      } catch (e) {
        if (live) setError(errorMessage(e));
      } finally {
        if (live) setLoading(false);
      }
    })();
    return () => {
      live = false;
    };
  }, [active, from, fetchPage]);
  return { orders, loading, error };
}

/** The Orders screen: a tab for each stage, the orders in it, and the one open on the right. */
export function useOrdersWorkspace() {
  const orders = useOrdersViewModel(),
    [tab, setTab] = useState<OrdersTab>("new"),
    [search, setSearch] = useState(""),
    [chosen, setChosen] = useState<string | null>(null),
    // The date filter of the Past orders tab; null shows them all.
    [range, setRange] = useState<DateRange | null>(null),
    past = usePastOrders(tab === "past", range?.from);
  // The live list wins: it is polled, so its statuses are the newest.
  const known = useMemo(() => {
    const live = new Set(orders.orders.map((o) => o.id));
    return [...orders.orders, ...past.orders.filter((o) => !live.has(o.id))];
  }, [orders.orders, past.orders]);
  const inTab = (t: OrdersTab) =>
    (t === "past" ? known : orders.orders)
      .filter((o) => tabStates[t].includes(o.state))
      .filter((o) => t !== "past" || inRange(o.placedAt, range))
      // Oldest waiting first while there is work to do; newest first in the past.
      .sort((a, b) => (t === "past" ? placed(b) - placed(a) : placed(a) - placed(b)));
  const counts = {
    new: inTab("new").length,
    preparing: inTab("preparing").length,
    ready: inTab("ready").length,
  };
  // Today's orders and sales, counted like the dashboard: placed today and not rejected.
  const today = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const placedToday = known.filter(
      (o) => o.state !== "Rejected" && (!o.placedAt || placed(o) >= start.getTime()),
    );
    return {
      orders: placedToday.length,
      sales: placedToday.reduce((sum, o) => sum + o.amount, 0),
    };
  }, [known]);
  const query = search.trim().toLowerCase(),
    list = inTab(tab).filter(
      (o) =>
        !query ||
        [o.id, o.customer, o.trainNumber, o.trainName, o.stationName, o.coach, o.seat]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(query),
    ),
    // The first order is open until one is picked; a picked order that left this tab is dropped.
    selected = list.find((o) => o.id === chosen) ?? list[0],
    // The list has no items, so the open order's detail is fetched for them.
    { data: detail } = useGetOrderQuery(selected?.id ?? "", {
      skip: DEMO_MODE || !selected,
    });
  const open = useMemo(
    () =>
      selected
        ? {
            ...selected,
            items: detail?.items.length ? detail.items : selected.items,
            note: selected.note ?? detail?.note,
            pickupOtp: selected.pickupOtp ?? detail?.pickupOtp,
          }
        : undefined,
    [selected, detail],
  );
  return {
    ...orders,
    tab,
    setTab: (next: OrdersTab) => {
      setTab(next);
      setChosen(null);
    },
    counts,
    today,
    search,
    setSearch,
    range,
    setRange: (next: DateRange | null) => {
      setRange(next);
      setChosen(null);
    },
    pastLoading: past.loading,
    error: orders.error || past.error,
    list,
    open,
    choose: setChosen,
  };
}
export type OrdersWorkspace = ReturnType<typeof useOrdersWorkspace>;
