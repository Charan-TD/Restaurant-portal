/** "6:35 PM". */
export const clock = (t: number) =>
  new Date(t).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

/** "Thu". */
export const weekday = (t: number) =>
  new Date(t).toLocaleDateString("en-US", { weekday: "short" });

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

/** "Today", "Tomorrow" or "Thu, 12 Nov". */
export function day(t: number, now: number) {
  const date = new Date(t),
    today = new Date(now),
    tomorrow = new Date(now + 86_400_000);
  if (sameDay(date, today)) return "Today";
  if (sameDay(date, tomorrow)) return "Tomorrow";
  return `${weekday(t)}, ${date.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`;
}

/** "Tue, 10 Nov · 3:20 PM". */
export const stamp = (t: number) =>
  `${weekday(t)}, ${new Date(t).toLocaleDateString("en-GB", { day: "numeric", month: "short" })} · ${clock(t)}`;

/** A time from the server as a number, or undefined. */
export const parse = (iso?: string) => {
  const t = Date.parse(iso ?? "");
  return Number.isFinite(t) ? t : undefined;
};

/** TrainDhaba partner support, as the Help menu lists it. */
export const SUPPORT_PHONE = "18001234567";
