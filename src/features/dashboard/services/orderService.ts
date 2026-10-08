import { api } from "@/core/api/axios";
import { API_PATHS, endpoint } from "@/core/constants/config";
import type { Order, OrderStatus } from "../models/order";
export async function getOrders(): Promise<Order[]> {
  const { data } = await api.get<Order[]>(endpoint(API_PATHS.orders));
  return data;
}
export async function updateOrder(
  id: string,
  state: OrderStatus,
): Promise<Order> {
  const path = endpoint(API_PATHS.updateOrder);
  if (!path.includes("{id}"))
    throw new Error("Order update endpoint must include the {id} placeholder.");
  const { data } = await api.patch<Order>(
    path.replace("{id}", encodeURIComponent(id)),
    { state },
  );
  return data;
}
