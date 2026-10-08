import type { NextRequest } from "next/server";
import { toSuggestion, type GeoapifyResult } from "../geoapify";
// Address for the point where the vendor dropped the map pin.
// Docs: https://apidocs.geoapify.com/docs/geocoding/reverse-geocoding/
const GEOAPIFY_URL = "https://api.geoapify.com/v1/geocode/reverse";
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams,
    lat = Number(params.get("lat")),
    lon = Number(params.get("lon"));
  if (
    !params.get("lat") ||
    !params.get("lon") ||
    !(Math.abs(lat) <= 90) ||
    !(Math.abs(lon) <= 180)
  )
    return Response.json(
      { message: "A valid latitude and longitude are required." },
      { status: 400 },
    );
  const apiKey = process.env.GEOAPIFY_API_KEY;
  if (!apiKey)
    return Response.json(
      { message: "Location search is not configured. Set GEOAPIFY_API_KEY." },
      { status: 503 },
    );
  const url = new URL(GEOAPIFY_URL);
  url.search = new URLSearchParams({
    lat: String(lat),
    lon: String(lon),
    lang: "en",
    format: "json",
    apiKey,
  }).toString();
  try {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok)
      return Response.json(
        { message: "Could not look up this address. Please try again." },
        { status: 502 },
      );
    const data = (await response.json()) as { results?: GeoapifyResult[] };
    const first = data.results?.[0];
    return Response.json(first ? toSuggestion(first) : null);
  } catch {
    return Response.json(
      { message: "Address lookup is unavailable. Please try again." },
      { status: 502 },
    );
  }
}
