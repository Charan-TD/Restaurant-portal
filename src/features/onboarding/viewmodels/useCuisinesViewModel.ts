"use client";
import { errorMessage } from "@/shared/utils/errors";
import { useGetCuisinesQuery } from "../services/cuisineApi";
import type { Cuisine } from "../models/registration";
const NONE: Cuisine[] = [];
export function useCuisinesViewModel() {
  const { data, isLoading, error } = useGetCuisinesQuery();
  return {
    cuisines: data ?? NONE,
    loading: isLoading,
    error: error ? errorMessage(error) : "",
  };
}
