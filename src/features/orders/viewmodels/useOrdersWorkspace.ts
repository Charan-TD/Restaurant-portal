"use client";
import { useEffect, useMemo, useState } from "react";
import { DEMO_MODE } from "@/core/constants/config";
import { useOrdersViewModel } from "@/features/dashboard/viewmodels/useOrdersViewModel";
import {
  PAGE_LIMIT,
  useGetOrderQuery,
  useLazyGetOrderPageQuery,
} from "@/features/dashboard/services/orderApi";
import { useRidersOwner } from "@/features/riders/viewmodels/useRidersOwner";
import { errorMessage } from "@/shared/utils/errors";
import { inRange, type DateRange } from "../models/dateRange";
import type { Order, OrderStatus } from "@/features/dashboard/models/order";

// Orders are assigned to the restaurant automatically and arrive already
// preparing, so there is no tab for accepting them.
export type OrdersTab = "preparing" | "ready" | "delivery" | "past";

export const tabStates: Record<OrdersTab, OrderStatus[]> = {
  preparing: ["Preparing"],
  ready: ["Ready"],
  // Only restaurants with their own riders confirm deliveries; for them the
  // order waits here after handover. TrainDhaba's riders do it for the rest.
  delivery: ["HandedOver"],
  past: ["HandedOver", "Delivered", "NotDelivered", "Rejected"],
};

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};
const placed = (o: Order) => Date.parse(o.placedAt ?? "") || 0;

/** A clock for the "5 min ago" and minutes-to-arrival texts; it only needs to tick every so often. */
export function useNow(active: boolean) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, [active]);
  return now;
}

/** The most pages read for past orders, so a long history cannot load forever. */
const MAX_PAGES = 30;

const DAY = 24 * 60 * 60 * 1000;

/**
 * Past orders, beyond the live ones. The orders API has no date filter and
 * lists orders by the train's arrival, oldest first, so the newest are on the
 * last page: the first page says how many pages there are, then pages are read
 * from the last backwards until one is older than the start of the chosen
 * range (a day of slack, as arrival and order time differ), or MAX_PAGES.
 */
function usePastOrders(from: number | undefined) {
  const [fetchPage] = useLazyGetOrderPageQuery(),
    [orders, setOrders] = useState<Order[]>([]),
    [loading, setLoading] = useState(false),
    [error, setError] = useState("");
  useEffect(() => {
    if (DEMO_MODE) return;
    let live = true;
    void (async () => {
      setLoading(true);
      setError("");
      const all: Order[] = [];
      try {
        const first = await fetchPage({ page: 1, limit: PAGE_LIMIT }, true).unwrap();
        for (let page = first.totalPages, n = 0; page >= 1 && n < MAX_PAGES; page--, n++) {
          const got = page === 1 ? first : await fetchPage({ page, limit: PAGE_LIMIT }, true).unwrap();
          all.push(...got.orders);
          const newest = Math.max(...got.orders.map(placed));
          if (from !== undefined && got.orders.length && newest < from - DAY) break;
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
  }, [from, fetchPage]);
  return { orders, loading, error };
}

/** The Orders screen: a tab for each stage, the orders in it, and the one open on the right. */
export function useOrdersWorkspace() {
  const orders = useOrdersViewModel(),
    [tab, setTab] = useState<OrdersTab>("preparing"),
    [search, setSearch] = useState(""),
    { ownRiders } = useRidersOwner(),
    [chosen, setChosen] = useState<string | null>(null),
    // The date filter of the Past orders tab; null shows them all.
    [range, setRange] = useState<DateRange | null>(null),
    // Today's figures need the finished orders too, so they are read on every tab.
    past = usePastOrders(tab === "past" ? range?.from : startOfToday()),
    // Restaurants with their own riders see the delivery tab and never see
    // a stale one (a TrainDhaba restaurant has no delivery to confirm).
    activeTab: OrdersTab = tab === "delivery" && !ownRiders ? "preparing" : tab;
  // The live list wins: it is polled, so its statuses are the newest.
  const known = useMemo(() => {
    const live = new Set(orders.orders.map((o) => o.id));
    return [...orders.orders, ...past.orders.filter((o) => !live.has(o.id))];
  }, [orders.orders, past.orders]);
  const inTab = (t: OrdersTab) =>
    (t === "past" ? known : orders.orders)
      .filter((o) =>
        // With own riders an order out for delivery waits in its own tab, not in Past.
        t === "past" && ownRiders && o.state === "HandedOver"
          ? false
          : tabStates[t].includes(o.state),
      )
      .filter((o) => t !== "past" || inRange(o.placedAt, range))
      // Oldest waiting first while there is work to do; newest first in the past.
      .sort((a, b) => (t === "past" ? placed(b) - placed(a) : placed(a) - placed(b)));
  const counts = {
    preparing: inTab("preparing").length,
    ready: inTab("ready").length,
    delivery: inTab("delivery").length,
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
    list = inTab(activeTab).filter(
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
    tab: activeTab,
    ownRiders,
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
