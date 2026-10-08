import type { LocationSuggestion } from "../models/location";
export async function searchLocations(
  text: string,
  signal?: AbortSignal,
): Promise<LocationSuggestion[]> {
  const response = await fetch(
    `/api/locations?text=${encodeURIComponent(text)}`,
    { signal },
  );
  const data = await response.json();
  if (!response.ok) throw new Error(data?.message || "Location search failed.");
  return data as LocationSuggestion[];
}
/** Address at a map point, or null when nothing is found there. */
export async function reverseGeocode(
  latitude: number,
  longitude: number,
  signal?: AbortSignal,
): Promise<LocationSuggestion | null> {
  const response = await fetch(
    `/api/locations/reverse?lat=${latitude}&lon=${longitude}`,
    { signal },
  );
  const data = await response.json();
  if (!response.ok) throw new Error(data?.message || "Address lookup failed.");
  return data as LocationSuggestion | null;
}
