"use client";
import { useEffect, useMemo, useState } from "react";
import { usePortal } from "@/core/providers/PortalProvider";
import { useToast } from "@/core/providers/ToastProvider";
import { DEMO_MODE } from "@/core/constants/config";
import { clearTokens } from "@/core/api/session";
import { useLazyGetMyRestaurantQuery } from "@/features/profile/services/restaurantApi";
import {
  useGetOrdersQuery,
  useUpdateOrderMutation,
} from "../services/orderApi";
import type { OrderRider, OrderStatus } from "../models/order";
import { errorMessage } from "@/shared/utils/errors";
import { usePickedRiders } from "@/features/riders/viewmodels/usePickedRiders";
import { useRidersOwner } from "@/features/riders/viewmodels/useRidersOwner";
/** Where an order's chosen rider is remembered. */
const riderKey = (id: string) => `order:${id}`;
/**
 * Works out why the orders API refused a request. The profile endpoint takes
 * the same restaurant login: if it refuses too, the session has expired;
 * if it works, the orders API simply does not accept this account.
 */
async function ordersAuthProblem(
  error: unknown,
  checkProfile: ReturnType<typeof useLazyGetMyRestaurantQuery>[0],
): Promise<"expired" | "not-allowed" | null> {
  const status = (error as { status?: number } | undefined)?.status;
  if (status !== 401 && status !== 403) return null;
  try {
    await checkProfile().unwrap();
    return "not-allowed";
  } catch (e) {
    return (e as { status?: number })?.status === 401
      ? "expired"
      : "not-allowed";
  }
}
export function useOrdersViewModel() {
  const { orders, setOrders, setAuthenticated } = usePortal(),
    toast = useToast(),
    [problem, setProblem] = useState<"expired" | "not-allowed" | null>(null),
    [actionError, setActionError] = useState(""),
    [busyId, setBusyId] = useState<string | null>(null),
    // New orders arrive while the vendor is on the page, so poll every 30s.
    { data, error: queryError } = useGetOrdersQuery(undefined, {
      skip: DEMO_MODE,
      pollingInterval: 30_000,
    }),
    [updateOrder] = useUpdateOrderMutation(),
    [checkProfile] = useLazyGetMyRestaurantQuery(),
    riders = usePickedRiders(),
    { trainDhabaRiders } = useRidersOwner();
  // The dashboard and the navbar read the shared order list.
  useEffect(() => {
    if (data) setOrders(data);
  }, [data, setOrders]);
  useEffect(() => {
    if (!queryError) return;
    let active = true;
    void ordersAuthProblem(queryError, checkProfile).then((result) => {
      if (!active) return;
      if (result === "expired") {
        // The login ran out; sign in again instead of showing a raw token error.
        clearTokens();
        setAuthenticated(false);
      } else if (result === "not-allowed") {
        setProblem(result);
      }
    });
    return () => {
      active = false;
    };
  }, [queryError, checkProfile, setAuthenticated]);
  const error =
    actionError ||
    (problem === "not-allowed"
      ? "The orders API does not accept this restaurant account."
      : queryError
        ? errorMessage(queryError)
        : "");
  /**
   * Assigns a rider while the order is being prepared. The API only takes the
   * rider on handover, so it is remembered here and sent then.
   */
  function assignRider(id: string, rider: OrderRider) {
    if (!rider.id) return;
    riders.pick(riderKey(id), { ...rider, id: rider.id });
    toast.success(`${rider.name} assigned to this order.`);
  }
  /**
   * Moves an order on. With the restaurant's own riders, the rider assigned
   * while preparing is remembered here; the API takes it (and requires it)
   * on handover. With TrainDhaba riders, accepting starts the rider search on
   * the server, and the rider updates the order after it is marked ready.
   */
  async function changeOrder(
    id: string,
    state: OrderStatus,
    rider?: OrderRider,
    prepMinutes?: number,
  ) {
    setActionError("");
    setBusyId(id);
    try {
      if (!DEMO_MODE)
        await updateOrder({
          id,
          state,
          // The server refuses a rider from restaurants on TrainDhaba riders.
          riderId:
            state === "HandedOver" && !trainDhabaRiders ? rider?.id : undefined,
          prepMinutes,
        }).unwrap();
      setOrders((old) =>
        old.map((o) =>
          o.id === id
            ? {
                ...o,
                state,
                ...(state === "Preparing"
                  ? { acceptedAt: new Date().toISOString(), prepMinutes: prepMinutes ?? o.prepMinutes }
                  : {}),
              }
            : o,
        ),
      );
      if (rider?.id) riders.pick(riderKey(id), { ...rider, id: rider.id });
      if (state === "Delivered" || state === "Rejected")
        riders.forget(riderKey(id));
      toast.success(
        state === "Preparing"
          ? trainDhabaRiders
            ? "Order accepted. Searching for a TrainDhaba rider."
            : "Order accepted. Assign a rider while it is prepared."
          : state === "Ready"
            ? rider
              ? `Order ready. ${rider.name} will pick it up.`
              : "Order ready for the rider to pick up."
            : state === "HandedOver" && rider
              ? `Order picked up by ${rider.name}.`
              : state === "Rejected"
                ? "Order rejected."
                : state === "Delivered"
                  ? "Order marked as delivered."
                  : "Order updated.",
      );
    } catch (e) {
      setActionError(errorMessage(e));
    } finally {
      setBusyId(null);
    }
  }
  return {
    // The rider the server reports wins over the one chosen here.
    orders: useMemo(
      () =>
        orders.map((o) => {
          const picked = riders.picks[riderKey(o.id)];
          return o.rider || !picked ? o : { ...o, rider: picked };
        }),
      [orders, riders.picks],
    ),
    error,
    busyId,
    changeOrder,
    assignRider,
    trainDhabaRiders,
  };
}
