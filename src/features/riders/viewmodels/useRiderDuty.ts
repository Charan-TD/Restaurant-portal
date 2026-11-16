"use client";
import { useCallback, useEffect, useState } from "react";
import type { Rider } from "../models/rider";

const KEY = "td.riderDuty";

/**
 * Which riders are on duty today. The server's value wins when it sends one;
 * otherwise the restaurant's own switch is kept in this browser (default on).
 */
export function useRiderDuty() {
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  useEffect(() => {
    try {
      const parsed = JSON.parse(localStorage.getItem(KEY) ?? "{}");
      if (parsed && typeof parsed === "object")
        queueMicrotask(() => setSaved(parsed));
    } catch {}
  }, []);
  const isOnDuty = useCallback(
    (r: Rider) => r.onDuty ?? saved[r.id] ?? true,
    [saved],
  );
  const setOnDuty = useCallback((id: string, on: boolean) => {
    setSaved((prev) => {
      const next = { ...prev, [id]: on };
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);
  return { isOnDuty, setOnDuty };
}
