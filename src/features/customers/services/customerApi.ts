import { baseApi, flow, type Send } from "@/core/api/baseApi";
import { API_PATHS, endpoint } from "@/core/constants/config";
export interface CustomerOrderLine {
  name: string;
  quantity: number;
  total: number;
}
export interface CustomerOrder {
  id: string;
  status?: string;
  total: number;
  note?: string;
  placedAt?: string;
  trainNumber?: string;
  trainName?: string;
  journeyDate?: string;
  station?: string;
  coach?: string;
  seat?: string;
  pnr?: string;
  items: CustomerOrderLine[];
}
export interface Customer {
  /** The API sends no customer id, so the phone (or email) identifies one. */
  id: string;
  name?: string;
  phone?: string;
  email?: string;
  orders: CustomerOrder[];
  spent: number;
  lastOrder?: CustomerOrder;
}
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
const list = (value: unknown) => (Array.isArray(value) ? value : []);

function toOrder(raw: unknown): CustomerOrder {
  const row = asRow(raw),
    journey = asRow(row.journey);
  return {
    id: first(row.order_number, row.id) ?? "",
    status: first(row.status),
    total: Number(row.total) || 0,
    note: first(row.customer_note, row.note),
    placedAt: first(row.created_at),
    trainNumber: first(journey.train_number, journey.train_id),
    trainName: first(journey.train_name),
    journeyDate: first(journey.journey_date),
    station: first(
      journey.boarding_station_name,
      journey.boarding_station_code,
    ),
    coach: first(journey.coach),
    seat: first(journey.seat),
    pnr: first(journey.pnr),
    items: list(row.items).flatMap((line): CustomerOrderLine[] => {
      const item = asRow(line),
        name = first(item.item_name, item.name);
      return name
        ? [
            {
              name,
              quantity: Number(item.quantity) || 1,
              total: Number(item.total_price) || 0,
            },
          ]
        : [];
    }),
  };
}

/** A safety stop on how many pages are fetched. */
const MAX_PAGES = 50;
/** GET /restaurant/orders/customers: each customer with their orders and items. */
function toCustomers(customers: unknown[]): Customer[] {
  return customers.map((raw, i) => {
    const row = asRow(raw),
      orders = list(row.orders)
        .map(toOrder)
        .sort((a, b) => (b.placedAt ?? "").localeCompare(a.placedAt ?? ""));
    return {
      id: first(row.phone, row.email) ?? `customer-${i}`,
      name: first(row.full_name, row.name),
      phone: first(row.phone),
      email: first(row.email),
      orders,
      spent: orders.reduce((sum, o) => sum + o.total, 0),
      lastOrder: orders[0],
    };
  });
}

/** Reads every page of a customers list, as the server pages it. */
async function fetchAllPages(
  send: Send,
  url: string,
  params: Record<string, unknown> = {},
): Promise<unknown[]> {
  const rows: unknown[] = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const body = asRow(
      asRow(await send({ url, params: { ...params, page } })).data,
    );
    rows.push(...list(body.customers));
    if (page >= (Number(asRow(body.pagination).totalPages) || 1)) break;
  }
  return rows;
}

export const customerApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    /** Every page of customers, so the totals cover all of them. */
    getCustomers: build.query<Customer[], void>({
      queryFn: flow<void, Customer[]>(async (_, send) =>
        toCustomers(
          await fetchAllPages(send, `${endpoint(API_PATHS.orders)}/customers`),
        ),
      ),
      providesTags: ["Customers"],
    }),
    /** Customers matching the text (name, phone, email, order, train or item), searched by the server. */
    searchCustomers: build.query<Customer[], string>({
      queryFn: flow<string, Customer[]>(async (q, send) =>
        toCustomers(
          await fetchAllPages(
            send,
            `${endpoint(API_PATHS.orders)}/customers/search`,
            { q },
          ),
        ),
      ),
      providesTags: ["Customers"],
    }),
  }),
});
export const { useGetCustomersQuery, useSearchCustomersQuery } = customerApi;
