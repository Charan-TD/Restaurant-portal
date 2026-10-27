import {
  createApi,
  type BaseQueryFn,
  type QueryReturnValue,
} from "@reduxjs/toolkit/query/react";
import type { AxiosRequestConfig } from "axios";
import axios from "axios";
import { api } from "./axios";
import { errorMessage } from "@/shared/utils/errors";
/** What a failed request looks like to RTK Query consumers. */
export interface ApiError {
  status?: number;
  message: string;
  data?: unknown;
}
export interface AxiosQueryArgs {
  url: string;
  method?: AxiosRequestConfig["method"];
  data?: AxiosRequestConfig["data"];
  params?: AxiosRequestConfig["params"];
  headers?: AxiosRequestConfig["headers"];
}
/**
 * Sends RTK Query requests through the shared Axios instance, so the bearer
 * token, base URL and timeout stay configured in one place.
 */
export const axiosBaseQuery =
  (): BaseQueryFn<AxiosQueryArgs, unknown, ApiError> =>
  async ({ url, method = "get", data, params, headers }) => {
    try {
      const result = await api.request({ url, method, data, params, headers });
      return { data: result.data };
    } catch (error) {
      return {
        error: {
          status: axios.isAxiosError(error)
            ? error.response?.status
            : undefined,
          message: errorMessage(error),
          data: axios.isAxiosError(error) ? error.response?.data : undefined,
        },
      };
    }
  };
/** Sends one request through the base query; throws the ApiError on failure. */
// Response bodies are undocumented, so callers read them loosely.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Send = <T = any>(args: AxiosQueryArgs) => Promise<T>;
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
      args: AxiosQueryArgs,
    ) => PromiseLike<QueryReturnValue<unknown, ApiError, NonNullable<unknown>>>,
  ): Promise<QueryReturnValue<Result, ApiError, NonNullable<unknown>>> => {
    const send: Send = async <T>(args: AxiosQueryArgs) => {
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
  baseQuery: axiosBaseQuery(),
  tagTypes: [
    "Orders",
    "Customers",
    "Reviews",
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
