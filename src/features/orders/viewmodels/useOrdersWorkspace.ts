"use client";
import { useEffect, useMemo, useState } from "react";
import { DEMO_MODE } from "@/core/constants/config";
import { useOrdersViewModel } from "@/features/dashboard/viewmodels/useOrdersViewModel";
import { useGetOrderQuery } from "@/features/dashboard/services/orderApi";
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

/** The Orders screen: a tab for each stage, the orders in it, and the one open on the right. */
export function useOrdersWorkspace() {
  const orders = useOrdersViewModel(),
    [tab, setTab] = useState<OrdersTab>("new"),
    [search, setSearch] = useState(""),
    [chosen, setChosen] = useState<string | null>(null);
  const inTab = (t: OrdersTab) =>
    orders.orders
      .filter((o) => tabStates[t].includes(o.state))
      // Oldest waiting first while there is work to do; newest first in the past.
      .sort((a, b) => (t === "past" ? placed(b) - placed(a) : placed(a) - placed(b)));
  const counts = {
    new: inTab("new").length,
    preparing: inTab("preparing").length,
    ready: inTab("ready").length,
  };
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
  const today = new Date().toDateString(),
    todays = orders.orders.filter(
      (o) => o.placedAt && new Date(o.placedAt).toDateString() === today,
    );
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
    search,
    setSearch,
    list,
    open,
    choose: setChosen,
    todayOrders: todays.length,
    todaySales: todays
      .filter((o) => o.state !== "Rejected")
      .reduce((sum, o) => sum + o.amount, 0),
  };
}
export type OrdersWorkspace = ReturnType<typeof useOrdersWorkspace>;
