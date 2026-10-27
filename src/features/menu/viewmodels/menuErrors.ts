import axios from "axios";
import { errorMessage } from "@/shared/utils/errors";
/** Turns an expired or rejected login into a clear next step. */
export function menuErrorMessage(error: unknown): string {
  const status = axios.isAxiosError(error)
    ? error.response?.status
    : (error as { status?: number } | undefined)?.status;
  if (status === 401)
    return `Your session has ended (${errorMessage(error)}). Please sign in again.`;
  return errorMessage(error);
}
