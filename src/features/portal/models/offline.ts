export const OFFLINE_REASONS = [
  "Kitchen is too busy",
  "Staff shortage",
  "Power or equipment issue",
  "Closing early today",
  "Other reason",
] as const;
/** The reason that asks the vendor to type what is going on. */
export const OTHER_REASON = "Other reason";
export type ReopenChoice = "30m" | "1h" | "2h" | "4h" | "tomorrow" | "pick";
export const REOPEN_CHOICES: { value: ReopenChoice; label: string }[] = [
  { value: "30m", label: "30 min" },
  { value: "1h", label: "1 hour" },
  { value: "2h", label: "2 hours" },
  { value: "4h", label: "4 hours" },
  { value: "tomorrow", label: "Tomorrow" },
  { value: "pick", label: "Pick time" },
];
const MINUTES: Partial<Record<ReopenChoice, number>> = {
  "30m": 30,
  "1h": 60,
  "2h": 120,
  "4h": 240,
};
/** What the vendor tells us when they stop taking orders. */
export interface GoOffline {
  reason: string;
  reopenAt: Date;
}
/** "14:30" on the given day. */
function at(day: Date, hhmm: string) {
  const [hours, minutes] = hhmm.split(":").map(Number),
    date = new Date(day);
  date.setHours(hours || 0, minutes || 0, 0, 0);
  return date;
}
/**
 * When the restaurant reopens. "Tomorrow" opens at tomorrow's opening time;
 * a picked time that has already passed today means tomorrow.
 */
export function reopenTime(
  choice: ReopenChoice,
  {
    now,
    tomorrowOpens,
    picked,
  }: { now: Date; tomorrowOpens: string; picked: string },
): Date | null {
  const minutes = MINUTES[choice];
  if (minutes) return new Date(now.getTime() + minutes * 60_000);
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  if (choice === "tomorrow") return at(tomorrow, tomorrowOpens);
  if (!/^\d{2}:\d{2}$/.test(picked)) return null;
  const today = at(now, picked);
  return today > now ? today : at(tomorrow, picked);
}
/** "13:31", or "tomorrow, 09:00" when it is not today. */
export function reopenLabel(date: Date, now = new Date()) {
  const time = date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return date.toDateString() === now.toDateString()
    ? time
    : `tomorrow, ${time}`;
}
// Kept in the browser so a reload still knows when to come back online.
const REOPEN_KEY = "restaurant-reopen-at";
export function savedReopenAt(): Date | null {
  const value = Number(localStorage.getItem(REOPEN_KEY));
  return value ? new Date(value) : null;
}
export function saveReopenAt(date: Date | null) {
  if (date) localStorage.setItem(REOPEN_KEY, String(date.getTime()));
  else localStorage.removeItem(REOPEN_KEY);
}
