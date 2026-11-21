"use client";
import { useEffect, useRef, useState } from "react";
import { DEMO_MODE } from "@/core/constants/config";
import { usePortal } from "@/core/providers/PortalProvider";
import { formatRupees } from "@/shared/utils/format";
import { useGetOrdersQuery } from "@/features/dashboard/services/orderApi";
import { orderNumber } from "@/features/orders/models/orderNumber";
import {
  askNotificationPermission,
  onSoundReady,
  playBuzz,
  showOrderNotification,
  soundReady,
  unlockSound,
  vibrate,
} from "../services/orderAlerts";
import { useAlertPreferences } from "./useAlertPreferences";

/** How often the order list is checked, on every page of the portal. */
const POLL_MS = 20_000;
/**
 * A new order rings for 5 seconds and then stops by itself: a ring lasts
 * about 1.5 s, so three of them, 1.7 s apart (the last ends at about 4.9 s).
 */
const RING_EVERY_MS = 1_700;
const RINGS = 3;

const RUNG_KEY = "td.rungOrders";
/** The orders that have already rung in this browser. */
function readRung() {
  try {
    const saved = JSON.parse(localStorage.getItem(RUNG_KEY) ?? "[]");
    return new Set<string>(Array.isArray(saved) ? saved : []);
  } catch {
    return new Set<string>();
  }
}
/** Saves them, keeping only orders still waiting so the list stays small. */
function saveRung(rung: Set<string>, waiting: string[]) {
  try {
    localStorage.setItem(RUNG_KEY, JSON.stringify(waiting.filter((id) => rung.has(id))));
  } catch {
    // Storage full or blocked: a reload may ring once more, nothing worse.
  }
}

/**
 * Rings for new orders on every page of the portal, not only the Orders
 * screen. A new order buzzes for 5 seconds (then stops by itself), vibrates
 * the phone and, while the tab is hidden, shows a system notification.
 * Orders are assigned to the restaurant automatically and arrive already
 * preparing, so there is nothing to accept to stop it.
 * The switches on Notifications and Profile → Settings are respected.
 */
export function useNewOrderAlerts() {
  const portal = usePortal(),
    { preferences } = useAlertPreferences(),
    { data } = useGetOrdersQuery(undefined, {
      skip: DEMO_MODE || !portal.authenticated,
      pollingInterval: POLL_MS,
    }),
    seen = useRef<Set<string> | null>(null),
    // The pending rings of the current alert, so a newer order can restart it.
    rings = useRef<ReturnType<typeof setTimeout>[]>([]),
    [ready, setReady] = useState(false);
  const { setOrders } = portal,
    sound = preferences.sound && preferences.ring;

  // The sidebar count and the Orders screen read the shared list; keep it fresh everywhere.
  useEffect(() => {
    if (data) setOrders(data);
  }, [data, setOrders]);

  // The first tap or key press anywhere lets the page make sound, and asks once for pop-ups.
  useEffect(() => {
    const stop = onSoundReady(() => setReady(soundReady()));
    queueMicrotask(() => setReady(soundReady()));
    const unlock = () => {
      void unlockSound();
      if (preferences.popups) void askNotificationPermission();
    };
    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);
    return () => {
      stop();
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, [preferences.popups]);

  const waiting = portal.orders.filter((o) => o.state === "Preparing"),
    waitingKey = waiting.map((o) => o.id).join(",");

  // Each order the first time it is seen as new: ring, vibrate, pop up.
  // Orders that have rung are remembered in this browser, so a reload or a
  // second tab does not ring for them again.
  useEffect(() => {
    if (!waitingKey && seen.current) return;
    const ids = waitingKey ? waitingKey.split(",") : [];
    seen.current ??= readRung();
    const fresh = ids.filter((id) => !seen.current!.has(id));
    fresh.forEach((id) => seen.current!.add(id));
    if (!fresh.length) return;
    saveRung(seen.current, ids);
    // Start (or restart) the 5 seconds of ringing.
    rings.current.forEach(clearTimeout);
    rings.current = [];
    if (sound) {
      playBuzz();
      for (let i = 1; i < RINGS; i++)
        rings.current.push(setTimeout(playBuzz, i * RING_EVERY_MS));
    }
    vibrate();
    if (preferences.popups && document.visibilityState !== "visible") {
      const first = portal.orders.find((o) => o.id === fresh[0]);
      showOrderNotification(
        fresh.length === 1 ? "New order" : `${fresh.length} new orders`,
        first
          ? [orderNumber(first.id), formatRupees(first.amount), first.trainName].filter(Boolean).join(" · ")
          : "Open the portal to see it.",
      );
    }
    // Only a change in the waiting orders matters here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [waitingKey]);

  // Stop a ring that is still going when the page is left.
  useEffect(() => () => rings.current.forEach(clearTimeout), []);

  return {
    /** True when orders are waiting and the browser still blocks sound: show the "turn on sound" prompt. */
    needsTap: sound && !ready,
    waiting: waiting.length,
    enableSound: async () => {
      await unlockSound();
      if (preferences.popups) await askNotificationPermission();
      setReady(soundReady());
    },
  };
}
