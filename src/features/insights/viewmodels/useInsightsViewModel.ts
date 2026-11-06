"use client";
import { useMemo, useState } from "react";
import { usePortal } from "@/core/providers/PortalProvider";
import { DEMO_MODE } from "@/core/constants/config";
import { useGetRatingSummaryQuery } from "@/features/customers/services/reviewApi";
import { useGetOrdersQuery } from "@/features/dashboard/services/orderApi";
import type { Order } from "@/features/dashboard/models/order";

export type InsightsRange = "today" | "7" | "30";

export const RANGE_TABS: { id: InsightsRange; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "7", label: "Last 7 days" },
  { id: "30", label: "Last 30 days" },
];

export interface Bar {
  label: string;
  /** Sales in rupees. */
  value: number;
  orders: number;
}

/** Hour bands of the "Busiest hours" card: [from, to) on a 24-hour clock. */
export const HOUR_BANDS = [
  { label: "08:00 – 10:00", from: 8, to: 10 },
  { label: "10:00 – 12:00", from: 10, to: 12 },
  { label: "12:00 – 14:00", from: 12, to: 14 },
  { label: "14:00 – 16:00", from: 14, to: 16 },
  { label: "16:00 – 18:00", from: 16, to: 18 },
  { label: "18:00 – 20:00", from: 18, to: 20 },
  { label: "20:00 – 22:00", from: 20, to: 22 },
] as const;

const NO_ORDERS: Order[] = [];
const DAY = 24 * 60 * 60 * 1000;
const startOfDay = (date: Date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};
const sum = (orders: Order[]) => orders.reduce((s, o) => s + o.amount, 0);
const hourLabel = (hour: number) =>
  String(hour).padStart(2, "0");

/** Percent change from `before` to `now`; null when there is nothing to compare. */
const change = (now: number, before: number) =>
  before ? Math.round(((now - before) / before) * 1000) / 10 : null;

/**
 * Figures worked out from the orders the API returns (its latest page), so
 * they only cover as far back as those orders reach.
 */
export function useInsightsViewModel() {
  const portal = usePortal(),
    [range, setRange] = useState<InsightsRange>("7"),
    { data, isLoading } = useGetOrdersQuery(undefined, {
      skip: DEMO_MODE,
      pollingInterval: 60_000,
    }),
    { data: summary } = useGetRatingSummaryQuery(undefined, {
      skip: DEMO_MODE,
    }),
    all = DEMO_MODE ? portal.orders : (data ?? NO_ORDERS);
  const figures = useMemo(() => {
    const days = range === "today" ? 1 : Number(range),
      start = startOfDay(new Date()),
      from = new Date(start.getTime() - (days - 1) * DAY),
      before = new Date(from.getTime() - days * DAY),
      placed = all.filter((o) => o.placedAt && !Number.isNaN(Date.parse(o.placedAt))),
      at = (o: Order) => new Date(o.placedAt!),
      inPeriod = placed.filter((o) => at(o) >= from),
      previous = placed.filter((o) => at(o) >= before && at(o) < from),
      kept = inPeriod.filter((o) => o.state !== "Rejected"),
      keptBefore = previous.filter((o) => o.state !== "Rejected"),
      rejected = inPeriod.length - kept.length;

    // Sales by hour for today, by day otherwise.
    const bars: Bar[] =
      range === "today"
        ? Array.from({ length: 18 }, (_, i) => {
            const hour = i + 6,
              hit = kept.filter((o) => at(o).getHours() === hour);
            return { label: hourLabel(hour), value: sum(hit), orders: hit.length };
          })
        : Array.from({ length: days }, (_, i) => {
            const day = new Date(from.getTime() + i * DAY),
              hit = kept.filter(
                (o) => startOfDay(at(o)).getTime() === day.getTime(),
              );
            return {
              label:
                days <= 7
                  ? day.toLocaleDateString("en-IN", { weekday: "short" })
                  : String(day.getDate()),
              value: sum(hit),
              orders: hit.length,
            };
          });
    const best = bars.reduce((a, b) => (b.value > a.value ? b : a), bars[0]);

    const bands = HOUR_BANDS.map((band) => ({
      label: band.label,
      count: kept.filter((o) => {
        const hour = at(o).getHours();
        return hour >= band.from && hour < band.to;
      }).length,
    }));

    const dishes = new Map<string, number>();
    for (const order of kept)
      for (const line of order.items)
        dishes.set(line.name, (dishes.get(line.name) ?? 0) + line.quantity);
    const topDishes = [...dishes.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, quantity]) => ({ name, quantity }));

    const stations = new Map<string, number>();
    for (const order of kept) {
      const name = order.stationName?.trim();
      if (name) stations.set(name, (stations.get(name) ?? 0) + 1);
    }
    const stationTotal = [...stations.values()].reduce((s, n) => s + n, 0),
      topStations = [...stations.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([name, count]) => ({
          name,
          count,
          percent: stationTotal ? Math.round((count / stationTotal) * 100) : 0,
        }));

    return {
      sales: sum(kept),
      salesBefore: sum(keptBefore),
      salesChange: change(sum(kept), sum(keptBefore)),
      orders: kept.length,
      ordersBefore: keptBefore.length,
      ordersChange: change(kept.length, keptBefore.length),
      rejected,
      rejectedPercent: inPeriod.length
        ? Math.round((rejected / inPeriod.length) * 100)
        : 0,
      bars,
      best: best?.value ? best : null,
      bands,
      topDishes,
      topStations,
      loaded: all.length,
    };
  }, [all, range]);
  return {
    range,
    setRange,
    loading: isLoading,
    ...figures,
    rating: { count: summary?.total ?? 0, average: summary?.average ?? null },
  };
}
export type InsightsViewModel = ReturnType<typeof useInsightsViewModel>;
