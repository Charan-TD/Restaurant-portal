"use client";
import { useCallback, useEffect, useState } from "react";
import { DEMO_MODE } from "@/core/constants/config";
import {
  getProfileChangeRequests,
  type ProfileChangeRequest,
} from "../services/restaurantService";
/** This restaurant's change requests, reloaded after a new one is sent. */
export function useChangeRequests() {
  const [requests, setRequests] = useState<ProfileChangeRequest[]>([]);
  const reload = useCallback(
    () =>
      getProfileChangeRequests()
        .then(setRequests)
        .catch(() => undefined),
    [],
  );
  useEffect(() => {
    if (!DEMO_MODE) void reload();
  }, [reload]);
  return { requests, reload };
}
