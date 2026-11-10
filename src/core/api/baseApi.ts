import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchBaseQueryError,
  type QueryReturnValue,
} from "@reduxjs/toolkit/query/react";
import { API_BASE_URL } from "@/core/constants/config";
import { errorMessage } from "@/shared/utils/errors";
import { getAccessToken } from "./session";
/** What a failed request looks like to RTK Query consumers. */
export interface ApiError {
  status?: number;
  message: string;
  data?: unknown;
}
export interface ApiQueryArgs {
  url: string;
  method?: string;
  // Request and response bodies are undocumented, so callers pass them loosely.
  data?: unknown;
  params?: Record<string, unknown>;
  headers?: Record<string, string>;
}
const TIMEOUT_MS = 15000;
/**
 * Reads a body like the old HTTP client did: JSON when it parses, otherwise the
 * raw text (an empty body stays an empty string).
 */
const readBody = async (response: Response): Promise<unknown> => {
  const text = await response.text();
  if (!text) return text;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};
/** Same wording the app has always shown for each kind of failure. */
function toApiError(error: FetchBaseQueryError): ApiError {
  if (typeof error.status === "number") {
    const message = (error.data as { message?: string } | null | undefined)
      ?.message;
    return {
      status: error.status,
      message: message || `Request failed with status code ${error.status}`,
      data: error.data,
    };
  }
  if (error.status === "TIMEOUT_ERROR")
    return { message: `timeout of ${TIMEOUT_MS}ms exceeded` };
  if (error.status === "FETCH_ERROR") return { message: "Network Error" };
  return { message: error.error };
}
/** Adds the bearer token when one is saved (never on the server render). */
const authorize = (headers: Headers) => {
  const token = typeof window === "undefined" ? null : getAccessToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return headers;
};
const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  timeout: TIMEOUT_MS,
  responseHandler: readBody,
  prepareHeaders: (headers) => {
    headers.set("Accept", "application/json, text/plain, */*");
    return authorize(headers);
  },
});
/**
 * Sends RTK Query requests with fetch, so the bearer token, base URL and
 * timeout stay configured in one place.
 */
export const apiBaseQuery: BaseQueryFn<ApiQueryArgs, unknown, ApiError> =
  async ({ url, method = "get", data, params, headers }, api, extra) => {
    const result = await rawBaseQuery(
      // fetch only normalises some verbs, so "patch" must be upper-cased.
      { url, method: method.toUpperCase(), body: data, params, headers },
      // RTK's own signal is dropped on purpose: signing out resets the API
      // cache, which would cancel the logout request itself. Requests always
      // finish (or time out), as they did before.
      { ...api, signal: new AbortController().signal },
      extra,
    );
    return result.error
      ? { error: toApiError(result.error) }
      : { data: result.data };
  };
/**
 * GET a file with the same base URL, token and timeout; rejects with an
 * ApiError (status and message) on failure.
 */
export async function downloadBlob(path: string): Promise<Blob> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: authorize(new Headers()),
    });
  } catch (error) {
    const timedOut = error instanceof DOMException && error.name === "TimeoutError";
    throw toApiError({
      status: timedOut ? "TIMEOUT_ERROR" : "FETCH_ERROR",
      error: String(error),
    });
  }
  // An error body is a file here, so only the status is reported.
  if (!response.ok)
    throw toApiError({ status: response.status, data: undefined });
  return response.blob();
}
/** Sends one request through the base query; throws the ApiError on failure. */
// Response bodies are undocumented, so callers read them loosely.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Send = <T = any>(args: ApiQueryArgs) => Promise<T>;
const asApiError = (error: unknown): ApiError =>
  error && typeof error === "object" && "message" in error
    ? (error as ApiError)
    : { message: errorMessage(error) };
/**
 * For endpoints that need several requests, local demo data or reshaping:
 * write the flow as plain async code that calls `send`, and any thrown
 * error becomes the endpoint's error.
 */
export function flow<Arg, Result>(
  run: (arg: Arg, send: Send) => Promise<Result>,
) {
  return async (
    arg: Arg,
    _api: unknown,
    _extra: unknown,
    baseQuery: (
      args: ApiQueryArgs,
    ) => PromiseLike<QueryReturnValue<unknown, ApiError, NonNullable<unknown>>>,
  ): Promise<QueryReturnValue<Result, ApiError, NonNullable<unknown>>> => {
    const send: Send = async <T>(args: ApiQueryArgs) => {
      const result = await baseQuery(args);
      if (result.error) throw result.error;
      return result.data as T;
    };
    try {
      // RTK Query rejects `{ data: undefined }`, which void flows return.
      return { data: ((await run(arg, send)) ?? null) as Result };
    } catch (error) {
      return { error: asApiError(error) };
    }
  };
}
/** The single RTK Query API; each feature adds its endpoints with injectEndpoints. */
export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: apiBaseQuery,
  tagTypes: [
    "Orders",
    "Customers",
    "Reviews",
    "GroupOrders",
    "Riders",
    "MenuItems",
    "AddOns",
    "Categories",
    "QtyTypes",
    "Profile",
    "Hours",
    "ChangeRequests",
  ],
  endpoints: () => ({}),
});
