import { api } from "@/core/api/axios";
import { API_PATHS, endpoint } from "@/core/constants/config";
export interface Customer {
  id: string;
  name?: string;
  phone?: string;
  pnrs: string[];
  orders: number;
  spent: number;
  lastOrderAt?: string;
}
const text = (value: unknown) =>
  typeof value === "string" && value.trim()
    ? value.trim()
    : typeof value === "number"
      ? String(value)
      : undefined;
const first = (...values: unknown[]) => values.map(text).find(Boolean);
/**
 * The server has no customer list for restaurants, so customers are built
 * from the restaurant's orders (GET /orders), grouped by customer. Name and
 * phone appear only when the order response includes them.
 */
export async function getCustomers(): Promise<Customer[]> {
  const { data } = await api.get(endpoint(API_PATHS.customerOrders), {
    params: { page: 1, limit: 100 },
  });
  const body = data?.data ?? data;
  const rows: Record<string, unknown>[] = Array.isArray(body)
    ? body
    : Array.isArray(body?.orders)
      ? body.orders
      : Array.isArray(body?.items)
        ? body.items
        : [];
  const byCustomer = new Map<string, Customer>();
  for (const row of rows) {
    const user = (row.customer_user ?? row.customer ?? {}) as Record<
      string,
      unknown
    >;
    const id = first(row.customer_user_id, user.id) ?? "unknown";
    const customer = byCustomer.get(id) ?? {
      id,
      pnrs: [],
      orders: 0,
      spent: 0,
    };
    customer.name ??= first(user.name, user.full_name, row.customer_name);
    customer.phone ??= first(
      user.phone,
      user.mobile,
      user.phone_number,
      row.customer_phone,
    );
    const pnr = first(row.pnr);
    if (pnr && !customer.pnrs.includes(pnr)) customer.pnrs.push(pnr);
    customer.orders += 1;
    customer.spent += Number(row.total) || 0;
    const when = first(row.created_at, row.createdAt);
    if (when && (!customer.lastOrderAt || when > customer.lastOrderAt))
      customer.lastOrderAt = when;
    byCustomer.set(id, customer);
  }
  return [...byCustomer.values()].sort((a, b) =>
    (b.lastOrderAt ?? "").localeCompare(a.lastOrderAt ?? ""),
  );
}
