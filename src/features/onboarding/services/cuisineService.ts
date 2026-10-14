import { api } from "@/core/api/axios";
import { API_PATHS, endpoint, DEMO_MODE } from "@/core/constants/config";
import type { Cuisine } from "../models/registration";
const demoCuisines: Cuisine[] = ["Chinese", "Indian", "South Indian"].map(
  (name) => ({ id: name, name }),
);
// Loaded once per visit; the list rarely changes.
let cached: Promise<Cuisine[]> | undefined;
export function getCuisines(): Promise<Cuisine[]> {
  if (DEMO_MODE) return Promise.resolve(demoCuisines);
  cached ??= api
    .get<{ data: { cuisine_id: string; name: string }[] }>(
      endpoint(API_PATHS.cuisines),
    )
    .then(({ data }) =>
      data.data.map(({ cuisine_id, name }) => ({ id: cuisine_id, name })),
    )
    .catch((error) => {
      cached = undefined;
      throw error;
    });
  return cached;
}
