import { baseApi, flow, type Send } from "@/core/api/baseApi";
import { API_PATHS, endpoint, DEMO_MODE } from "@/core/constants/config";
import type { Cuisine } from "../models/registration";
const demoCuisines: Cuisine[] = ["Chinese", "Indian", "South Indian"].map(
  (name) => ({ id: name, name }),
);
/** The cuisine list; RTK Query keeps it cached because it rarely changes. */
export async function fetchCuisines(send: Send): Promise<Cuisine[]> {
  if (DEMO_MODE) return demoCuisines;
  const body = await send<{ data: { cuisine_id: string; name: string }[] }>({
    url: endpoint(API_PATHS.cuisines),
  });
  return body.data.map(({ cuisine_id, name }) => ({ id: cuisine_id, name }));
}
export const cuisineApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getCuisines: build.query<Cuisine[], void>({
      queryFn: flow((_: void, send: Send) => fetchCuisines(send)),
      keepUnusedDataFor: 3600,
    }),
  }),
});
export const { useGetCuisinesQuery } = cuisineApi;
