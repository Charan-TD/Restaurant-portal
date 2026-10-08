import axios from "axios";
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || undefined,
  timeout: 15000,
  withCredentials: true,
});
// Cookie-based sessions assumed for API mode. Adapt to the confirmed backend contract.
