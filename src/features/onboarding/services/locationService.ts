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
let devicePosition: Promise<{ latitude: number; longitude: number } | null> | null =
  null;
/**
 * Where this device is. The browser asks the vendor for permission the first
 * time (the registration's first step calls this); the answer is kept, so the
 * location step reuses it without asking again. Null when refused or unknown.
 */
export function requestDevicePosition() {
  if (typeof navigator === "undefined" || !navigator.geolocation)
    return Promise.resolve(null);
  devicePosition ??= new Promise((resolve) =>
    navigator.geolocation.getCurrentPosition(
      ({ coords }) =>
        resolve({ latitude: coords.latitude, longitude: coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 60_000 },
    ),
  );
  return devicePosition;
}
