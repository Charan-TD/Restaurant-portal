"use client";
import { useEffect, useState } from "react";
import { usePortal } from "@/core/providers/PortalProvider";
import { DEMO_MODE } from "@/core/constants/config";
import { clearTokens } from "@/core/api/axios";
import {
  getOrders,
  ordersAuthProblem,
  updateOrder,
} from "../services/orderService";
import type { OrderStatus } from "../models/order";
import { sampleOrders } from "../models/sampleOrders";
import { errorMessage } from "@/shared/utils/errors";
export function useOrdersViewModel() {
  const { orders, setOrders, setAuthenticated } = usePortal(),
    [error, setError] = useState(""),
    [busyId, setBusyId] = useState<string | null>(null),
    [sample, setSample] = useState(false);
  useEffect(() => {
    if (DEMO_MODE) return;
    let active = true;
    const load = () =>
      getOrders()
        .then((data) => {
          if (!active) return;
          setError("");
          setOrders(data);
        })
        .catch(async (e) => {
          const problem = await ordersAuthProblem(e);
          if (!active) return;
          if (problem === "expired") {
            // The login ran out; sign in again instead of showing a raw token error.
            clearTokens();
            setAuthenticated(false);
          } else if (problem === "not-allowed") {
            clearInterval(timer);
            // Show sample orders so the screen can be reviewed.
            setSample(true);
            setOrders((old) => (old.length ? old : sampleOrders()));
          } else setError(errorMessage(e));
        });
    // New orders arrive while the vendor is on the page.
    const timer = setInterval(load, 30_000);
    void load();
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [setOrders, setAuthenticated]);
  async function changeOrder(id: string, state: OrderStatus) {
    setError("");
    setBusyId(id);
    try {
      if (DEMO_MODE || sample)
        setOrders((old) => old.map((o) => (o.id === id ? { ...o, state } : o)));
      else {
        await updateOrder(id, state);
        setOrders((old) => old.map((o) => (o.id === id ? { ...o, state } : o)));
      }
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusyId(null);
    }
  }
  return { orders, error, sample, busyId, changeOrder };
}
