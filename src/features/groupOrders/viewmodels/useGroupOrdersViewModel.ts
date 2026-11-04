"use client";
import { useMemo, useState } from "react";
import { DEMO_MODE } from "@/core/constants/config";
import { useToast } from "@/core/providers/ToastProvider";
import { errorMessage } from "@/shared/utils/errors";
import {
  usePickedRiders,
  type PickedRider,
} from "@/features/riders/viewmodels/usePickedRiders";
import { useRidersOwner } from "@/features/riders/viewmodels/useRidersOwner";
import {
  useGetGroupOrdersQuery,
  useUpdateGroupOrderMutation,
} from "../services/groupOrderApi";
/** How often the list checks for new group orders and the rider's updates. */
const REFRESH_MS = 30_000;
/** Where a group order's chosen rider is remembered. */
const riderKey = (id: string) => `group:${id}`;
const done: Record<string, string> = {
  REJECTED: "Group order rejected.",
  DELIVERED: "Group order marked as delivered.",
};
/** Group orders the admin has assigned to this restaurant, and their status changes. */
export function useGroupOrdersViewModel() {
  const toast = useToast(),
    [actionError, setActionError] = useState(""),
    [busyKey, setBusyKey] = useState<string | null>(null),
    { data, isLoading, error } = useGetGroupOrdersQuery(undefined, {
      skip: DEMO_MODE,
      pollingInterval: REFRESH_MS,
    }),
    [updateGroupOrder] = useUpdateGroupOrderMutation(),
    riders = usePickedRiders(),
    { trainDhabaRiders } = useRidersOwner();
  /**
   * Assigns a rider while the group order is being prepared. The API only
   * takes the rider on handover, so it is remembered here and sent then.
   */
  function assignRider(id: string | undefined, rider: PickedRider) {
    if (!id) {
      setActionError(
        "This group order has no id, so a rider can't be assigned.",
      );
      return;
    }
    riders.pick(riderKey(id), rider);
    toast.success(`${rider.name} assigned to this group order.`);
  }
  /**
   * Moves a group order on. With the restaurant's own riders, the rider
   * assigned while preparing is remembered here; the API takes it (and
   * requires it) on handover. With TrainDhaba riders, accepting starts the
   * rider search on the server, and the rider updates the order after it is
   * marked ready.
   */
  async function changeOrder(
    key: string,
    id: string | undefined,
    status: string,
    rider?: PickedRider,
  ) {
    setActionError("");
    if (!id) {
      setActionError(
        "This group order has no id, so its status can't be changed.",
      );
      return;
    }
    setBusyKey(key);
    try {
      await updateGroupOrder({
        id,
        status,
        // The server refuses a rider from restaurants on TrainDhaba riders.
        riderId:
          status === "OUT_FOR_DELIVERY" && !trainDhabaRiders
            ? rider?.id
            : undefined,
      }).unwrap();
      if (rider) riders.pick(riderKey(id), rider);
      if (["DELIVERED", "REJECTED", "FAILED"].includes(status))
        riders.forget(riderKey(id));
      toast.success(
        status === "PREPARING"
          ? trainDhabaRiders
            ? "Group order accepted. Searching for a TrainDhaba rider."
            : "Group order accepted. Assign a rider while it is prepared."
          : status === "READY"
            ? rider
              ? `Group order ready. ${rider.name} will pick it up.`
              : "Group order ready for the rider to pick up."
            : status === "OUT_FOR_DELIVERY" && rider
              ? `Group order picked up by ${rider.name}.`
              : (done[status] ?? "Group order updated."),
      );
    } catch (e) {
      setActionError(errorMessage(e));
    } finally {
      setBusyKey(null);
    }
  }
  return {
    // The rider the server reports wins over the one chosen here.
    orders: useMemo(
      () =>
        (data ?? []).map((o) => {
          const picked = o.id && riders.picks[riderKey(o.id)];
          return o.rider || !picked ? o : { ...o, rider: picked };
        }),
      [data, riders.picks],
    ),
    loading: isLoading,
    error: actionError || (error ? errorMessage(error) : ""),
    busyKey,
    changeOrder,
    assignRider,
    trainDhabaRiders,
  };
}
