import type { LocationSuggestion } from "@/features/onboarding/models/location";
// Shared by the search and reverse-lookup routes; the key stays on the server.
export interface GeoapifyResult {
  formatted?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  town?: string;
  village?: string;
  county?: string;
  state_district?: string;
  state?: string;
  postcode?: string;
  lat: number;
  lon: number;
}
// Geoapify omits `state` for some union territories (e.g. Connaught Place).
const unionTerritoryCities: Record<string, string> = {
  delhi: "Delhi",
  "new delhi": "Delhi",
  chandigarh: "Chandigarh",
  puducherry: "Puducherry",
  pondicherry: "Puducherry",
};
export function toSuggestion(result: GeoapifyResult): LocationSuggestion {
  const city =
    result.city ||
    result.town ||
    result.village ||
    result.county ||
    result.state_district ||
    "";
  return {
    label: result.formatted || result.address_line1 || "",
    address: result.formatted || result.address_line1 || "",
    city,
    state: result.state || unionTerritoryCities[city.toLowerCase()] || "",
    // Geoapify sometimes returns "560 001"; keep digits only.
    pincode: (result.postcode || "").replace(/\D/g, "").slice(0, 6),
    latitude: result.lat,
    longitude: result.lon,
  };
}
