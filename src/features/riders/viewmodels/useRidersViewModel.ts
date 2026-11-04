"use client";
import { useMemo } from "react";
import { DEMO_MODE } from "@/core/constants/config";
import { errorMessage } from "@/shared/utils/errors";
import type { RiderForm } from "../models/rider";
import { useAddRiderMutation, useGetRidersQuery } from "../services/riderApi";
/** The restaurant's riders, and adding one. */
export function useRidersViewModel({ skip = DEMO_MODE } = {}) {
  const { data, isLoading, error } = useGetRidersQuery(undefined, { skip }),
    [add, { isLoading: adding }] = useAddRiderMutation();
  return {
    riders: useMemo(() => data ?? [], [data]),
    loading: isLoading,
    error: error ? errorMessage(error) : "",
    adding,
    /** Resolves to an error message, or "" once the rider is saved. */
    addRider: async (form: RiderForm) => {
      try {
        await add(form).unwrap();
        return "";
      } catch (e) {
        return errorMessage(e);
      }
    },
  };
}
