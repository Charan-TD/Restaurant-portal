import axios from "axios";
import { api } from "@/core/api/axios";
import { API_PATHS, endpoint } from "@/core/constants/config";
import type { Order, OrderStatus } from "../models/order";
// The server's statuses: PLACED, CONFIRMED, PREPARING, READY, OUT_FOR_DELIVERY,
// DELIVERED and CANCELLED.
const fromServer: Record<string, OrderStatus> = {
  PLACED: "New",
  CONFIRMED: "Accepted",
  PREPARING: "Preparing",
  READY: "Ready",
  OUT_FOR_DELIVERY: "Delivered",
  DELIVERED: "Delivered",
  CANCELLED: "Rejected",
};
const toServer: Record<OrderStatus, string> = {
  New: "PLACED",
  Accepted: "CONFIRMED",
  Preparing: "PREPARING",
  Ready: "READY",
  Delivered: "DELIVERED",
  Rejected: "CANCELLED",
};
type Row = Record<string, unknown>;
const asRow = (value: unknown): Row =>
  value && typeof value === "object" ? (value as Row) : {};
const text = (value: unknown) =>
  typeof value === "string" && value.trim()
    ? value.trim()
    : typeof value === "number"
      ? String(value)
      : undefined;
const first = (...values: unknown[]) => values.map(text).find(Boolean);
/** The GET /orders response is not documented, so likely names are all read. */
function toOrder(row: Row): Order {
  const lines = [row.order_items, row.items, row.line_items].find(Array.isArray) as
    | unknown[]
    | undefined;
  const food = (lines ?? [])
    .map((line) => {
      const item = asRow(line),
        name = first(
          item.name,
          item.item_name,
          item.menu_item_name,
          asRow(item.menu_item).name,
        );
      return name ? `${Number(item.quantity) || 1} × ${name}` : "";
    })
    .filter(Boolean)
    .join(", ");
  const station = first(
    asRow(row.boarding_station).name,
    row.station_name,
    row.station,
  );
  const seat = [
    first(row.coach) && `Coach ${first(row.coach)}`,
    first(row.seat) && `Seat ${first(row.seat)}`,
  ].filter(Boolean);
  const user = asRow(row.customer_user ?? row.customer);
  return {
    id: String(row.id),
    food: food || "Order",
    station: [station, ...seat].filter(Boolean).join(" · ") || "Train delivery",
    amount: Number(row.total) || 0,
    state: fromServer[String(row.status).toUpperCase()] ?? "New",
    customer: first(user.name, user.full_name, row.customer_name),
    placedAt: first(row.created_at, row.createdAt),
  };
}
/** GET /orders: the restaurant's most recent orders. */
export async function getOrders(): Promise<Order[]> {
  const { data } = await api.get(endpoint(API_PATHS.orders), {
    params: { page: 1, limit: 100 },
  });
  const body = asRow(data).data ?? data;
  const rows = Array.isArray(body)
    ? body
    : (asRow(body).orders ?? asRow(body).items ?? []);
  return (Array.isArray(rows) ? rows : []).map((row) => toOrder(asRow(row)));
}
/** PATCH /orders/{id}/status: accept, reject, prepare or pack an order. */
export async function updateOrder(id: string, state: OrderStatus) {
  const path = endpoint(API_PATHS.updateOrder);
  if (!path.includes("{id}"))
    throw new Error("Order update endpoint must include the {id} placeholder.");
  await api.patch(path.replace("{id}", encodeURIComponent(id)), {
    status: toServer[state],
  });
}
/**
 * Works out why the orders API refused a request. The profile endpoint takes
 * the same restaurant login: if it refuses too, the session has expired;
 * if it works, the orders API simply does not accept this account.
 */
export async function ordersAuthProblem(
  error: unknown,
): Promise<"expired" | "not-allowed" | null> {
  const status = axios.isAxiosError(error) ? error.response?.status : undefined;
  if (status !== 401 && status !== 403) return null;
  try {
    await api.get(endpoint(API_PATHS.restaurantMe));
    return "not-allowed";
  } catch (e) {
    return axios.isAxiosError(e) && e.response?.status === 401
      ? "expired"
      : "not-allowed";
  }
}
