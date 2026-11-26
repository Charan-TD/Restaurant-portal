/** The portal's Insights run on Indian time, as the server's do. */
const ZONE = "Asia/Kolkata";

/** YYYY-MM-DD of a moment in Indian time. */
function istDate(date: Date): string {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: ZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
      .formatToParts(date)
      .map((part) => [part.type, part.value]),
  );
  return `${p.year}-${p.month}-${p.day}`;
}

/**
 * The first and last day of "today", "7d" or "30d" counted back from now,
 * which is how the server reads those periods.
 */
export function periodDates(days: number, now = new Date()) {
  const today = istDate(now),
    [y, m, d] = today.split("-").map(Number),
    start = new Date(Date.UTC(y, m - 1, d - days + 1));
  return { dateFrom: start.toISOString().slice(0, 10), dateTo: today };
}
