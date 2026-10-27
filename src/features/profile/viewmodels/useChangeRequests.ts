"use client";
import { DEMO_MODE } from "@/core/constants/config";
import { useGetProfileChangeRequestsQuery } from "../services/restaurantApi";
/** This restaurant's change requests; sending a new one refreshes the list. */
export function useChangeRequests() {
  const { data, refetch } = useGetProfileChangeRequestsQuery(undefined, {
    skip: DEMO_MODE,
  });
  return { requests: data ?? [], reload: () => void (DEMO_MODE || refetch()) };
}
