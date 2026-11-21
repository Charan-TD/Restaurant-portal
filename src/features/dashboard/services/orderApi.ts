import { baseApi, flow } from "@/core/api/baseApi";
import { API_PATHS, endpoint } from "@/core/constants/config";
import {
  lineLabel,
  type Order,
  type OrderLine,
  type OrderStatus,
} from "../models/order";
// The server's statuses: PLACED, PREPARING, READY, OUT_FOR_DELIVERY, DELIVERED,
// CANCELLED and FAILED. Orders are assigned to the restaurant automatically:
// fetching the orders list moves every PLACED order to PREPARING, so a PLACED
// one is shown as preparing too. FAILED is an order that was not delivered.
const fromServer: Record<string, OrderStatus> = {
  PLACED: "Preparing",
  PREPARING: "Preparing",
  READY: "Ready",
  OUT_FOR_DELIVERY: "HandedOver",
  DELIVERED: "Delivered",
  CANCELLED: "Rejected",
  FAILED: "NotDelivered",
};
const toServer: Record<OrderStatus, string> = {
  New: "PLACED",
  Preparing: "PREPARING",
  Ready: "READY",
  HandedOver: "OUT_FOR_DELIVERY",
  Delivered: "DELIVERED",
  NotDelivered: "FAILED",
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
/** The statuses the Orders screen works on; the rest is history. */
const LIVE_STATUSES = ["PREPARING", "READY", "OUT_FOR_DELIVERY"];
/** Orders asked for per page: the backend's agreed page size (page and limit are always sent). */
export const PAGE_LIMIT = 50;
/** The most pages read for one status, so a very long list cannot load forever. */
const MAX_LIVE_PAGES = 10;
/** One order of GET /orders (or GET /orders/{orderNumber}); the names are the Swagger ones, older names still read. */
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
    if (!name) return [];
    const price = Number(
        item.total_price ?? item.line_total ?? item.price ?? item.unit_price,
      ),
      type = first(item.food_served, item.food_type, item.item_type, item.type);
    return [
      {
        name,
        quantity: Number(item.quantity) || 1,
        price: Number.isFinite(price) && price > 0 ? price : undefined,
        category: first(item.category, item.category_name, asRow(item.menu_item).category),
        type: type
          ? { veg: "Veg", non_veg: "Non-veg", egg: "Egg" }[type.toLowerCase()] ?? type
          : undefined,
        note: first(item.note, item.special_instructions, item.instructions),
      },
    ];
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
  const payment = asRow(Array.isArray(row.payments) ? row.payments[0] : undefined),
    user = asRow(row.customer_user ?? row.customer),
    riderRow = asRow(row.rider ?? row.assigned_rider),
    riderName = first(riderRow.rider_name, riderRow.name, row.rider_name);
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
    // When the train reaches the station (ISO UTC); null when unknown.
    deliveryBy: first(
      row.scheduled_arrival_time,
      row.estimated_delivery_time,
      row.estimated_delivery_at,
      row.delivery_deadline,
    ),
    placedAt: first(row.created_at, row.createdAt),
    // Each order lists its payments: { method: "COD", status: "PENDING" }.
    paymentStatus: (
      first(row.payment_status, row.paymentStatus) ?? first(payment.status)
    )?.toUpperCase(),
    paymentMethod: first(payment.method)?.toUpperCase(),
    pickupOtp: first(row.pickup_otp, row.handover_otp, row.delivery_otp),
    note: first(row.customer_note, row.note),
    rider: riderName
      ? {
          id: first(riderRow.rider_id, row.assign_rider, row.rider_id),
          name: riderName,
          phone: first(riderRow.phone_number, riderRow.phone, row.rider_phone),
        }
      : undefined,
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
    // The server filters by status; the list is checked here too.
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
    /**
     * GET /orders: the orders still to work on (preparing, ready, out for
     * delivery). The list is ordered by the train's arrival, oldest first, not
     * by newest, so the first page of everything would be old orders: each
     * live status is asked for on its own, which the list now supports.
     */
    getOrders: build.query<Order[], void>({
      queryFn: flow(async (_arg: void, send) => {
        // One status at a time: page 1, then the rest while data.pagination.totalPages says there are more.
        const ofStatus = async (status: string) => {
          const rows: Order[] = [];
          let totalPages = 1;
          for (let page = 1; page <= Math.min(totalPages, MAX_LIVE_PAGES); page++) {
            const data = await send({
              url: endpoint(API_PATHS.orders),
              params: { status, page, limit: PAGE_LIMIT },
            });
            rows.push(...toOrders(data));
            totalPages = toOrderPage(data).totalPages;
          }
          return rows;
        };
        const seen = new Set<string>();
        return (await Promise.all(LIVE_STATUSES.map(ofStatus)))
          .flat()
          .filter((o) => !seen.has(o.id) && !!seen.add(o.id));
      }),
      providesTags: ["Orders"],
    }),
    /** GET /orders: one page of every order the restaurant has received, optionally by status. */
    getOrderPage: build.query<
      OrderPage,
      { page: number; limit?: number; status?: OrderStatus | "FAILED" }
    >({
      query: ({ page, limit = PAGE_LIMIT, status }) => ({
        url: endpoint(API_PATHS.orders),
        params: {
          page,
          limit,
          ...(status && {
            status: status === "FAILED" ? status : toServer[status],
          }),
        },
      }),
      transformResponse: (data: unknown, _meta, arg) =>
        toOrderPage(data, arg.status),
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
    /**
     * PATCH /orders/{orderNumber}/status. Moving PREPARING → READY
     * requires assign_rider: the rider's public code (e.g. RID-A7K9M2) from
     * GET /restaurant/riders. The endpoint rejects any other field (400), so
     * nothing else is sent: a not-delivered reason has no field to go in.
     */
    updateOrder: build.mutation<
      void,
      {
        id: string;
        state: OrderStatus;
        riderId?: string;
      }
    >({
      query: ({ id, state, riderId }) => ({
        url: updatePath(id),
        method: "patch",
        data: {
          status: toServer[state],
          ...(riderId && { assign_rider: riderId }),
        },
      }),
      invalidatesTags: ["Orders"],
    }),
  }),
});
export const {
  useGetOrdersQuery,
  useLazyGetOrderPageQuery,
  useGetOrderQuery,
  useUpdateOrderMutation,
} = orderApi;
