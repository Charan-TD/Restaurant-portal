"use client";
import { useEffect, useState } from "react";
import { usePortal } from "@/core/providers/PortalProvider";
import { DEMO_MODE } from "@/core/constants/config";
import { getOrders, updateOrder } from "../services/orderService";
import type { OrderStatus } from "../models/order";
import { errorMessage } from "@/shared/utils/errors";
export function useOrdersViewModel() {
  const { orders, setOrders } = usePortal(),
    [error, setError] = useState(""),
    [busyId, setBusyId] = useState<string | null>(null);
  useEffect(() => {
    if (DEMO_MODE) return;
    let active = true;
    getOrders()
      .then((data) => {
        if (active) setOrders(data);
      })
      .catch((e) => {
        if (active) setError(errorMessage(e));
      });
    return () => {
      active = false;
    };
  }, [setOrders]);
  async function changeOrder(id: string, state: OrderStatus) {
    setError("");
    setBusyId(id);
    try {
      if (DEMO_MODE)
        setOrders((old) => old.map((o) => (o.id === id ? { ...o, state } : o)));
      else {
        const result = await updateOrder(id, state);
        setOrders((old) => old.map((o) => (o.id === id ? result : o)));
      }
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusyId(null);
    }
  }
  return { orders, error, busyId, changeOrder };
}
