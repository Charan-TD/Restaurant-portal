"use client";
import { useEffect, useState } from "react";
import { usePortal } from "@/core/providers/PortalProvider";
import { useToast } from "@/core/providers/ToastProvider";
import { DEMO_MODE } from "@/core/constants/config";
import { clearTokens } from "@/core/api/axios";
import { useLazyGetMyRestaurantQuery } from "@/features/profile/services/restaurantApi";
import {
  useGetOrdersQuery,
  useUpdateOrderMutation,
} from "../services/orderApi";
import type { OrderStatus } from "../models/order";
import { errorMessage } from "@/shared/utils/errors";
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
    [checkProfile] = useLazyGetMyRestaurantQuery();
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
  async function changeOrder(id: string, state: OrderStatus) {
    setActionError("");
    setBusyId(id);
    try {
      if (!DEMO_MODE) await updateOrder({ id, state }).unwrap();
      setOrders((old) => old.map((o) => (o.id === id ? { ...o, state } : o)));
      toast.success(
        state === "Rejected"
          ? "Order rejected."
          : state === "Preparing"
            ? "Order accepted."
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
  return { orders, error, busyId, changeOrder };
}
