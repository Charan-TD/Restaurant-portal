"use client";
import { useEffect, useState } from "react";
import { DEMO_MODE } from "@/core/constants/config";
import { claimsOf, getAccessToken } from "@/core/api/session";
import { usePortal } from "@/core/providers/PortalProvider";
import {
  useGetRidersOwnerQuery,
  type RidersOwner,
} from "@/features/profile/services/restaurantApi";
// The last answer is kept in the browser with the restaurant it belongs to,
// so the menu is right straight away on the next visit while the server is
// asked again. Another restaurant signing in on this browser never sees it.
export const RIDERS_OWNER_KEY = "td.ridersOwner";
/** The signed-in restaurant, from its login token. */
function restaurantId(): string | null {
  const token = getAccessToken(),
    id = token ? claimsOf(token)?.restaurant_id : undefined;
  return typeof id === "string" ? id : null;
}
function readSaved(): RidersOwner | null {
  try {
    const saved = JSON.parse(localStorage.getItem(RIDERS_OWNER_KEY) ?? "{}"),
      id = restaurantId();
    return id &&
      saved?.id === id &&
      (saved.owner === "Traindhaba" || saved.owner === "restaurant")
      ? saved.owner
      : null;
  } catch {
    return null;
  }
}
function save(owner: RidersOwner) {
  const id = restaurantId();
  if (!id) return;
  try {
    localStorage.setItem(RIDERS_OWNER_KEY, JSON.stringify({ id, owner }));
  } catch {}
}
/**
 * Who delivers this restaurant's orders, chosen at registration. Restaurants
 * on TrainDhaba's riders have no riders of their own: the server refuses
 * their riders list, rider assignment and DELIVERED.
 */
export function useRidersOwner() {
  // Asked only once signed in: asked earlier (the shell mounts before login
  // finishes), it fails without a token and that answer would stick.
  const { authenticated } = usePortal(),
    { data, isSuccess } = useGetRidersOwnerQuery(undefined, {
      skip: DEMO_MODE || !authenticated,
    }),
    [saved, setSaved] = useState<RidersOwner | null>(null);
  // Read again on every sign-in: the shell stays mounted across a sign-out,
  // and the next login may be another restaurant.
  useEffect(() => {
    queueMicrotask(() => setSaved(authenticated ? readSaved() : null));
  }, [authenticated]);
  useEffect(() => {
    if (data) save(data);
  }, [data]);
  // The server's answer wins; the saved one only fills the wait for it.
  const owner = isSuccess ? data : saved;
  return {
    trainDhabaRiders: owner === "Traindhaba",
    /** Only once known: the Riders section waits for this. */
    ownRiders: DEMO_MODE || owner === "restaurant",
  };
}
