"use client";
import { useEffect, useState } from "react";
import type { Cuisine } from "../models/registration";
import { getCuisines } from "../services/cuisineService";
import { errorMessage } from "@/shared/utils/errors";
export function useCuisinesViewModel() {
  const [cuisines, setCuisines] = useState<Cuisine[]>([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    getCuisines()
      .then((list) => {
        if (active) setCuisines(list);
      })
      .catch((e) => {
        if (active) setError(errorMessage(e));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);
  return { cuisines, loading, error };
}
