/** The past-orders date filter: a preset or a custom range, from the start of one day to the end of another. */
export type RangePreset = "today" | "yesterday" | "last7" | "last30" | "month" | "custom";
export interface DateRange {
  preset: RangePreset;
  /** Start of the first day (ms). */
  from: number;
  /** End of the last day (ms). */
  to: number;
}

const DAY = 86_400_000;
export const startOfDay = (t: number) => {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};
export const endOfDay = (t: number) => startOfDay(t) + DAY - 1;
/** The same day `days` earlier, safe across daylight-saving changes. */
const daysBefore = (t: number, days: number) => {
  const d = new Date(t);
  d.setDate(d.getDate() - days);
  return d.getTime();
};

/** "10 Nov". */
export const dayMonth = (t: number) =>
  new Date(t).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

export const presetLabels: Record<Exclude<RangePreset, "custom">, string> = {
  today: "Today",
  yesterday: "Yesterday",
  last7: "Last 7 days",
  last30: "Last 30 days",
  month: "This month",
};

/** The range a preset covers on the day `now` falls in. */
export function presetRange(preset: Exclude<RangePreset, "custom">, now: number): DateRange {
  const today = startOfDay(now);
  switch (preset) {
    case "today":
      return { preset, from: today, to: endOfDay(now) };
    case "yesterday": {
      const day = daysBefore(today, 1);
      return { preset, from: day, to: endOfDay(day) };
    }
    case "last7":
      return { preset, from: daysBefore(today, 6), to: endOfDay(now) };
    case "last30":
      return { preset, from: daysBefore(today, 29), to: endOfDay(now) };
    case "month": {
      const d = new Date(now);
      return { preset, from: new Date(d.getFullYear(), d.getMonth(), 1).getTime(), to: endOfDay(now) };
    }
  }
}

/** "10 Nov", "28 Oct – 3 Nov" or "Nov 2026": the dates beside a preset. */
export function rangeDates(range: DateRange) {
  if (range.preset === "month")
    return new Date(range.from).toLocaleDateString("en-GB", { month: "short", year: "numeric" });
  return startOfDay(range.from) === startOfDay(range.to)
    ? dayMonth(range.from)
    : `${dayMonth(range.from)} – ${dayMonth(range.to)}`;
}

/** What the filter shows when chosen: "Last 7 days" or "2 Nov – 8 Nov". */
export const rangeLabel = (range: DateRange) =>
  range.preset === "custom" ? rangeDates(range) : presetLabels[range.preset];

export const inRange = (iso: string | undefined, range: DateRange | null) => {
  if (!range) return true;
  const t = Date.parse(iso ?? "");
  return Number.isFinite(t) && t >= range.from && t <= range.to;
};
