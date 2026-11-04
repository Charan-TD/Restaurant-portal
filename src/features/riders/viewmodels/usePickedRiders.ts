"use client";
import { useEffect, useState } from "react";
/** The rider chosen for an order, as much as the order screens show. */
export type PickedRider = { id: string; name: string; phone?: string };
type Picks = Record<string, PickedRider>;
// The rider is chosen while the order is prepared but only sent to the API
// when it is handed over, so the choice is kept in the browser in between.
const STORAGE_KEY = "picked-riders";
function read(): Picks {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
    return value && typeof value === "object" ? value : {};
  } catch {
    return {};
  }
}
/**
 * Riders chosen for orders that are not handed over yet, by order key (e.g.
 * "order:ORD-ABCD-123456" or "group:GRP-A1B2C3").
 */
export function usePickedRiders() {
  const [picks, setPicks] = useState<Picks>({});
  // Browser storage only exists in the browser, so it is read after mounting.
  useEffect(() => {
    queueMicrotask(() => setPicks(read()));
  }, []);
  const save = (key: string, rider: PickedRider | null) => {
    const next = { ...read() };
    if (rider)
      next[key] = { id: rider.id, name: rider.name, phone: rider.phone };
    else delete next[key];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setPicks(next);
  };
  return {
    picks,
    /** Remembers the rider for an order. */
    pick: (key: string, rider: PickedRider) => save(key, rider),
    /** Forgets the rider once the order is closed. */
    forget: (key: string) => save(key, null),
  };
}
