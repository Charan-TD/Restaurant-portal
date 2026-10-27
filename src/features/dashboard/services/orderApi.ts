import { baseApi } from "@/core/api/baseApi";
import { API_PATHS, endpoint } from "@/core/constants/config";
import {
  lineLabel,
  type Order,
  type OrderLine,
  type OrderStatus,
} from "../models/order";
// The server's statuses: PLACED, PREPARING, READY, OUT_FOR_DELIVERY, DELIVERED,
// CANCELLED and FAILED. There is no separate accepted status: accepting an
// order starts its preparation.
const fromServer: Record<string, OrderStatus> = {
  PLACED: "New",
  PREPARING: "Preparing",
  READY: "Ready",
  OUT_FOR_DELIVERY: "HandedOver",
  DELIVERED: "Delivered",
  CANCELLED: "Rejected",
  FAILED: "Rejected",
};
const toServer: Record<OrderStatus, string> = {
  New: "PLACED",
  Preparing: "PREPARING",
  Ready: "READY",
  HandedOver: "OUT_FOR_DELIVERY",
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
  const lines = [row.order_items, row.items, row.line_items].find(
    Array.isArray,
  ) as unknown[] | undefined;
  const items = (lines ?? []).flatMap((line): OrderLine[] => {
    const item = asRow(line),
      name = first(
        item.name,
        item.item_name,
        item.menu_item_name,
        item.item_name_snapshot,
        item.title,
        asRow(item.menu_item).name,
      );
    return name ? [{ name, quantity: Number(item.quantity) || 1 }] : [];
  });
  const station = first(
    asRow(row.boarding_station).name,
    row.station_name,
    row.station,
    row.boarding_station_name,
  );
  const seat = [
    first(row.coach) && `Coach ${first(row.coach)}`,
    first(row.seat) && `Seat ${first(row.seat)}`,
  ].filter(Boolean);
  const user = asRow(row.customer_user ?? row.customer);
  return {
    // The restaurant API identifies orders by order_number (e.g. ORD-ABCD-123456).
    id: first(row.order_number, row.id) ?? "",
    items,
    food: items.map(lineLabel).join(", ") || "Order",
    pnr: first(row.pnr, row.pnr_number, row.pnr_no),
    station: [station, ...seat].filter(Boolean).join(" · ") || "Train delivery",
    amount: Number(row.total) || 0,
    state: fromServer[String(row.status).toUpperCase()] ?? "New",
    customer: first(
      user.name,
      user.full_name,
      row.customer_name,
      [first(user.first_name), first(user.last_name)].filter(Boolean).join(" "),
    ),
    customerPhone: first(user.phone, user.mobile, row.customer_phone),
    customerId: first(row.customer_user_id, user.id),
    trainName: first(row.train_name),
    trainNumber: first(row.train_number, row.train_id),
    stationId: first(row.boarding_station_id),
    stationName: station,
    coach: first(row.coach),
    seat: first(row.seat),
    journeyDate: first(row.journey_date),
    queueMinutes:
      row.queue_time_minutes == null
        ? undefined
        : Number(row.queue_time_minutes) || 0,
    bill:
      row.subtotal == null
        ? undefined
        : {
            subtotal: Number(row.subtotal) || 0,
            tax: Number(row.tax) || 0,
            packagingFee: Number(row.packaging_fee) || 0,
            deliveryFee: Number(row.delivery_fee) || 0,
            discount: Number(row.discount) || 0,
          },
    deliveryBy: first(
      row.estimated_delivery_time,
      row.estimated_delivery_at,
      row.delivery_deadline,
    ),
    placedAt: first(row.created_at, row.createdAt),
    note: first(row.customer_note, row.note),
  };
}
/** Orders still waiting for payment are not the restaurant's to act on yet. */
const isOpenToRestaurant = (row: Row) =>
  String(row.status).toUpperCase() !== "PENDING_PAYMENT";
function toOrders(data: unknown): Order[] {
  const body = asRow(data).data ?? data;
  const rows = Array.isArray(body)
    ? body
    : (asRow(body).orders ?? asRow(body).items ?? []);
  return (Array.isArray(rows) ? rows : [])
    .map(asRow)
    .filter(isOpenToRestaurant)
    .map(toOrder);
}
export interface OrderPage {
  orders: Order[];
  total: number;
  totalPages: number;
  /** Orders per page, as the server sets it. */
  limit: number;
}
function toOrderPage(
  data: unknown,
  status?: OrderStatus | "FAILED",
): OrderPage {
  const body = asRow(asRow(data).data ?? data),
    pagination = asRow(body.pagination),
    // The orders list documents no filters, so a filter is applied here too.
    orders = toOrders(data).filter(
      (o) => !status || status === "FAILED" || o.state === status,
    );
  return {
    orders,
    total: Number(pagination.total) || orders.length,
    totalPages: Number(pagination.totalPages) || 1,
    limit: Number(pagination.limit) || orders.length,
  };
}
/** GET /restaurant/orders/{orderNumber}: one order, with its items. */
function toOrderDetail(data: unknown): Order {
  const body = asRow(asRow(data).data ?? data);
  return toOrder(asRow(body.order ?? body));
}
/** PATCH /orders/{id}/status: the path for accepting, rejecting, preparing or packing an order. */
function updatePath(id: string) {
  const path = endpoint(API_PATHS.updateOrder);
  if (!path.includes("{id}"))
    throw new Error("Order update endpoint must include the {id} placeholder.");
  return path.replace("{id}", encodeURIComponent(id));
}
export const orderApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    /** GET /orders: the restaurant's most recent orders. */
    getOrders: build.query<Order[], void>({
      query: () => ({
        url: endpoint(API_PATHS.orders),
        params: { page: 1 },
      }),
      transformResponse: toOrders,
      providesTags: ["Orders"],
    }),
    /** GET /orders: one page of every order the restaurant has received, optionally by status. */
    getOrderPage: build.query<
      OrderPage,
      { page: number; status?: OrderStatus | "FAILED" }
    >({
      query: ({ page, status }) => ({
        url: endpoint(API_PATHS.orders),
        params: {
          page,
          ...(status && {
            status: status === "FAILED" ? status : toServer[status],
          }),
        },
      }),
      transformResponse: (data: unknown, _meta, arg) =>
        toOrderPage(data, arg.status),
      providesTags: ["Orders"],
    }),
    /** GET /orders/search: orders matching the text (order number, customer, train or item). */
    searchOrders: build.query<OrderPage, { q: string; page: number }>({
      query: ({ q, page }) => ({
        url: `${endpoint(API_PATHS.orders)}/search`,
        params: { q, page },
      }),
      transformResponse: (data: unknown) => toOrderPage(data),
      providesTags: ["Orders"],
    }),
    /** How many orders have a status (or all of them): the first page, read for its total. */
    getOrderCount: build.query<number, OrderStatus | "FAILED" | undefined>({
      query: (status) => ({
        url: endpoint(API_PATHS.orders),
        params: {
          page: 1,
          ...(status && {
            status: status === "FAILED" ? status : toServer[status],
          }),
        },
      }),
      transformResponse: (data: unknown) => toOrderPage(data).total,
      providesTags: ["Orders"],
    }),
    /** The list has no items, so each order's detail is fetched for them. */
    getOrder: build.query<Order, string>({
      query: (orderNumber) => ({
        url: `${endpoint(API_PATHS.orders)}/${encodeURIComponent(orderNumber)}`,
      }),
      transformResponse: toOrderDetail,
      providesTags: ["Orders"],
    }),
    updateOrder: build.mutation<void, { id: string; state: OrderStatus }>({
      query: ({ id, state }) => ({
        url: updatePath(id),
        method: "patch",
        data: { status: toServer[state] },
      }),
      invalidatesTags: ["Orders"],
    }),
  }),
});
export const {
  useGetOrdersQuery,
  useGetOrderPageQuery,
  useGetOrderCountQuery,
  useSearchOrdersQuery,
  useGetOrderQuery,
  useUpdateOrderMutation,
} = orderApi;
