import axios from "axios";
import type { ApiErrorResponse } from "@/shared/types/api";
export function errorMessage(error: unknown): string {
  if (axios.isAxiosError<ApiErrorResponse>(error))
    return error.response?.data?.message || error.message;
  return error instanceof Error
    ? error.message
    : "Something went wrong. Please try again.";
}
