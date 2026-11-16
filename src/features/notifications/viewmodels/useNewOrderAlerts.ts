"use client";
import { useEffect, useRef, useState } from "react";
import { DEMO_MODE } from "@/core/constants/config";
import { usePortal } from "@/core/providers/PortalProvider";
import { formatRupees } from "@/shared/utils/format";
import { useGetOrdersQuery } from "@/features/dashboard/services/orderApi";
import { orderNumber } from "@/features/dashboard/components/OrderCard";
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
/** A ring (about 1.5 s) and a second of quiet before the next. */
const RING_EVERY_MS = 2_500;
/** How long a new order rings, about 8 rings, then it stops. */
const RING_FOR_MS = 20_000;

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
 * screen. A new order buzzes, vibrates the phone and, while the tab is
 * hidden, shows a system notification. With "Keep ringing" on, it rings
 * again every few seconds until every new order is accepted or rejected.
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
    // When the current 20 seconds of ringing started; 0 when none has.
    ringingSince = useRef(0),
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

  const waiting = portal.orders.filter((o) => o.state === "New"),
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
    // Start (or restart) 20 seconds of ringing.
    ringingSince.current = Date.now();
    if (sound) playBuzz();
    vibrate();
    if (preferences.popups && document.visibilityState !== "visible") {
      const first = portal.orders.find((o) => o.id === fresh[0]);
      showOrderNotification(
        fresh.length === 1 ? "New order" : `${fresh.length} new orders`,
        first
          ? [orderNumber(first.id), formatRupees(first.amount), first.trainName].filter(Boolean).join(" · ")
          : "Open the portal to accept it.",
      );
    }
    // Only a change in the waiting orders matters here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [waitingKey]);

  // With "Keep ringing", a new order rings every 2.5 s for 20 s and then
  // stops; without it, it rings once. Accepting or rejecting every new order
  // stops it at once.
  useEffect(() => {
    if (!sound || !preferences.keepRinging || !waitingKey) return;
    const timer = setInterval(() => {
      if (Date.now() - ringingSince.current < RING_FOR_MS) playBuzz();
      else clearInterval(timer);
    }, RING_EVERY_MS);
    return () => clearInterval(timer);
  }, [sound, preferences.keepRinging, waitingKey]);

  return {
    /** True when orders are waiting and the browser still blocks sound: show the "turn on sound" prompt. */
    needsTap: sound && !ready,
    waiting: waiting.length,
    enableSound: async () => {
      await unlockSound();
      if (preferences.popups) await askNotificationPermission();
      setReady(soundReady());
      if (waitingKey) playBuzz();
    },
  };
}
