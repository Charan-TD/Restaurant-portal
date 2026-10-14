"use client";
import { useState } from "react";
import { useWatch } from "react-hook-form";
import { usePortal } from "@/core/providers/PortalProvider";
import type { Order } from "../models/order";
export const RANGES = [7, 14, 30] as const;
export type RangeDays = (typeof RANGES)[number];
function greeting(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}
const dayKey = (date: Date) =>
  `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
/** Orders that count towards sales: anything the restaurant did not reject. */
const counted = (orders: Order[]) => orders.filter((o) => o.state !== "Rejected");
/** Sales for each of `days` days ending `offset` days before today, oldest first. */
function dailySales(orders: Order[], now: Date, days: number, offset = 0) {
  const valid = counted(orders).filter((o) => o.placedAt);
  return Array.from({ length: days }, (_, i) => {
    const date = new Date(now);
    date.setDate(now.getDate() - offset - (days - 1 - i));
    const total = valid
      .filter((o) => dayKey(new Date(o.placedAt!)) === dayKey(date))
      .reduce((sum, o) => sum + o.amount, 0);
    return {
      label: date.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
      total,
    };
  });
}
const sum = (days: { total: number }[]) => days.reduce((s, d) => s + d.total, 0);
export function useDashboardViewModel() {
  const portal = usePortal(),
    { orders } = portal,
    [range, setRange] = useState<RangeDays>(7);
  const ownerName = useWatch({
    control: portal.form.control,
    name: "ownerName",
  });
  const now = new Date();
  // Orders without a time are treated as today's.
  const today = orders.filter(
    (o) => !o.placedAt || dayKey(new Date(o.placedAt)) === dayKey(now),
  );
  const count = (...states: Order["state"][]) =>
    today.filter((o) => states.includes(o.state)).length;
  const series = dailySales(orders, now, range),
    total = sum(series),
    previous = sum(dailySales(orders, now, range, range));
  const best = series.reduce((a, b) => (b.total > a.total ? b : a), series[0]);
  return {
    greeting: `${greeting(now.getHours())}${ownerName?.trim() ? `, ${ownerName.trim().split(/\s+/)[0]}` : ""}`,
    today: now.toLocaleDateString("en-IN", {
      weekday: "long",
      day: "numeric",
      month: "long",
    }),
    overview: {
      orders: counted(today).length,
      revenue: counted(today).reduce((s, o) => s + o.amount, 0),
      preparing: count("Accepted", "Preparing"),
    },
    range,
    setRange,
    series,
    total,
    best: best.total ? best : null,
    /** Percent change against the period before; null when there is nothing to compare. */
    change: previous ? Math.round(((total - previous) / previous) * 100) : null,
  };
}
export type DashboardViewModel = ReturnType<typeof useDashboardViewModel>;
