import type { NextRequest } from "next/server";
import { toSuggestion, type GeoapifyResult } from "./geoapify";
// Geoapify address autocomplete, proxied so the API key stays on the server.
// Docs: https://apidocs.geoapify.com/docs/geocoding/address-autocomplete/
const GEOAPIFY_URL = "https://api.geoapify.com/v1/geocode/autocomplete";
export async function GET(request: NextRequest) {
  const text = request.nextUrl.searchParams.get("text")?.trim() || "";
  if (text.length < 3) return Response.json([]);
  const apiKey = process.env.GEOAPIFY_API_KEY;
  if (!apiKey)
    return Response.json(
      { message: "Location search is not configured. Set GEOAPIFY_API_KEY." },
      { status: 503 },
    );
  const url = new URL(GEOAPIFY_URL);
  url.search = new URLSearchParams({
    text,
    filter: "countrycode:in",
    lang: "en",
    limit: "8",
    format: "json",
    apiKey,
  }).toString();
  try {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok)
      return Response.json(
        { message: "Location search failed. Please try again." },
        { status: 502 },
      );
    const data = (await response.json()) as { results?: GeoapifyResult[] };
    return Response.json((data.results || []).map(toSuggestion));
  } catch {
    return Response.json(
      { message: "Location search is unavailable. Please try again." },
      { status: 502 },
    );
  }
}
