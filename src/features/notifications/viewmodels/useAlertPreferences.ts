"use client";
import { useCallback, useSyncExternalStore } from "react";

export const ALERT_PREFERENCES = [
  { id: "ring", label: "Ring for new orders", hint: "Plays until you open the order", on: true },
  { id: "popups", label: "Desktop pop-ups", hint: "Shows even when this tab is hidden", on: true },
  { id: "late", label: "Late order reminders", hint: "When an order passes its ready time", on: true },
  { id: "payouts", label: "Payout updates", hint: "When money is sent to your bank", on: true },
  { id: "ratings", label: "Ratings and reviews", hint: "When a passenger rates an order", on: false },
] as const;

/** The two order-alert switches on Profile → Settings. */
export type SettingsAlertId = "sound" | "keepRinging";

export type AlertPreferenceId =
  | (typeof ALERT_PREFERENCES)[number]["id"]
  | SettingsAlertId;

const KEY = "td.alertPreferences",
  listeners = new Set<() => void>(),
  defaults = {
    ...Object.fromEntries(ALERT_PREFERENCES.map((p) => [p.id, p.on])),
    sound: true,
    keepRinging: true,
  } as Record<AlertPreferenceId, boolean>;

let cache: { raw: string | null; value: Record<AlertPreferenceId, boolean> } = {
  raw: null,
  value: defaults,
};

/** Reads the saved switches; the same object is returned until they change. */
function read() {
  const raw = localStorage.getItem(KEY);
  if (raw === cache.raw) return cache.value;
  let saved: Partial<Record<AlertPreferenceId, boolean>> = {};
  try {
    saved = JSON.parse(raw ?? "{}");
  } catch {
    // A damaged value is the same as none saved.
  }
  cache = { raw, value: { ...defaults, ...saved } };
  return cache.value;
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
};

/** How this browser alerts the vendor. Saved on this browser only. */
export function useAlertPreferences() {
  const preferences = useSyncExternalStore(subscribe, read, () => defaults),
    set = useCallback((id: AlertPreferenceId, on: boolean) => {
      localStorage.setItem(KEY, JSON.stringify({ ...read(), [id]: on }));
      listeners.forEach((listener) => listener());
    }, []);
  return { preferences, set };
}
