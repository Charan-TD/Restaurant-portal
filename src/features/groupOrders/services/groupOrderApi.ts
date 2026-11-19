import { baseApi, flow } from "@/core/api/baseApi";
import { API_PATHS, endpoint } from "@/core/constants/config";
import type { GroupOrder, GroupOrderItem } from "../models/groupOrder";
type Row = Record<string, unknown>;
const asRow = (value: unknown): Row =>
  value && typeof value === "object" ? (value as Row) : {};
const text = (value: unknown) =>
  typeof value === "string" && value.trim()
    ? value.trim()
    : typeof value === "number"
      ? String(value)
      : undefined;
const list = (value: unknown) => (Array.isArray(value) ? value : []);
/** The first of several possible field names that holds text. */
const pick = (row: Row, ...names: string[]) => {
  for (const name of names) {
    const value = text(row[name]);
    if (value) return value;
  }
  return undefined;
};
const number = (value: unknown) => {
  const n = typeof value === "string" ? Number(value.replace(/[₹,\s]/g, "")) : Number(value);
  return value !== null && value !== undefined && value !== "" && Number.isFinite(n) ? n : undefined;
};
/**
 * A date-time the server may send whole ("2026-11-12T20:40:00Z") or split
 * into a date and a clock time ("2026-11-12" and "20:40").
 */
const dateTime = (value?: string, day?: string) => {
  if (!value) return undefined;
  if (!Number.isNaN(Date.parse(value)) && /\d{4}-\d{2}-\d{2}/.test(value)) return new Date(value).toISOString();
  const clock = value.match(/^(\d{1,2}):(\d{2})/);
  if (clock && day && /^\d{4}-\d{2}-\d{2}/.test(day)) {
    const local = new Date(`${day.slice(0, 10)}T${clock[1].padStart(2, "0")}:${clock[2]}:00`);
    return Number.isNaN(local.getTime()) ? undefined : local.toISOString();
  }
  return undefined;
};
/** "veg", "non-veg" or "egg" from the ways the server may write it. */
const foodType = (value?: string) => {
  const t = (value ?? "").toLowerCase().replace(/[\s_-]+/g, "");
  if (!t) return undefined;
  if (t.startsWith("non") || t === "nv") return "non-veg";
  if (t.includes("egg")) return "egg";
  if (t.startsWith("veg") || t === "v") return "veg";
  return undefined;
};
/** Each line is { quantity, menu_item: { name, total_price, … } }. */
function toItem(line: unknown): GroupOrderItem[] {
  const item = asRow(line),
    menu = asRow(item.menu_item),
    name = text(menu.name) ?? text(item.name) ?? text(item.item_name),
    quantity = Number(item.quantity) || 1,
    unitPrice = number(menu.total_price) ?? number(menu.price) ?? number(item.price),
    lineTotal = number(item.total_price) ?? number(item.amount);
  return name
    ? [
        {
          name,
          quantity,
          unitPrice,
          amount: lineTotal ?? (unitPrice === undefined ? undefined : unitPrice * quantity),
          description: pick(menu, "description") ?? pick(item, "description"),
          foodType: foodType(
            pick(menu, "food_type", "food_served", "type", "veg_type") ??
              pick(item, "food_type", "food_served", "type"),
          ),
        },
      ]
    : [];
}
/** Coaches as a list, whether sent as ["S4", "S5"] or "S4, S5". */
const coachesOf = (row: Row) => {
  const raw = row.coaches ?? row.coach_numbers ?? row.coach;
  return (Array.isArray(raw) ? raw.map((c) => text(c)) : (text(raw) ?? "").split(/[,/]/))
    .map((c) => (c ?? "").trim())
    .filter(Boolean);
};
function toGroupOrder(raw: unknown, i: number): GroupOrder {
  const row = asRow(raw),
    contactName = text(row.contact_name) ?? "Customer",
    mobile = text(row.mobile_number) ?? "";
  const id = text(row.grp_ord_id) ?? text(row.id),
    // Not documented yet: the names the orders API uses for its rider.
    riderRow = asRow(row.rider ?? row.assigned_rider),
    riderName = text(riderRow.rider_name) ?? text(riderRow.name);
  // Train and timing details: the names the orders API uses, and likely others.
  const train = asRow(row.train),
    day = pick(row, "journey_date", "travel_date", "date") ?? pick(train, "journey_date");
  return {
    id,
    key: id ?? `${contactName}-${mobile}-${i}`,
    assignedAt: pick(row, "assigned_at", "created_at"),
    total: number(row.total_amount) ?? number(row.order_value) ?? number(row.total),
    trainNumber: pick(row, "train_number", "train_no") ?? pick(train, "train_number", "number"),
    trainName: pick(row, "train_name") ?? pick(train, "train_name", "name"),
    stationName:
      pick(row, "delivery_station_name", "delivery_station", "boarding_station_name", "station_name", "station") ??
      pick(asRow(row.station), "station_name", "name"),
    trainArrival: dateTime(
      pick(row, "train_arrival", "arrival_time", "train_arrival_time", "eta", "delivery_deadline", "delivery_time"),
      day,
    ),
    coaches: coachesOf(row),
    readyBy: dateTime(pick(row, "food_ready_by", "ready_by", "ready_time", "prep_deadline"), day),
    riderAt: dateTime(pick(row, "rider_arrival", "rider_eta", "pickup_time", "pickup_at"), day),
    note: pick(row, "note", "notes", "special_instructions", "instructions", "customer_note") ?? text(row.order_details),
    contactName,
    mobile,
    email: text(row.email),
    groupSize: Number(row.group_size) || 0,
    details: text(row.order_details) ?? "",
    status: (text(row.status) ?? "ASSIGNED").toUpperCase(),
    updatedAt:
      text(row.delivered_at) ?? text(row.updated_at) ?? text(row.created_at),
    placedAt: text(row.created_at),
    items: list(row.items).flatMap(toItem),
    rider: riderName
      ? {
          id: text(riderRow.rider_id) ?? text(riderRow.id) ?? "",
          name: riderName,
          phone: text(riderRow.phone_number) ?? text(riderRow.phone),
        }
      : undefined,
  };
}
export const groupOrderApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    /** GET /restaurant/orders/group-orders: the group orders the admin assigned to this restaurant. */
    getGroupOrders: build.query<GroupOrder[], void>({
      queryFn: flow<void, GroupOrder[]>(async (_, send) => {
        const body = asRow(
          asRow(await send({ url: endpoint(API_PATHS.groupOrders) })).data,
        );
        return list(body.group_orders).map(toGroupOrder);
      }),
      providesTags: ["GroupOrders"],
    }),
    /**
     * Accepting (PREPARING) or rejecting (REJECTED) an ASSIGNED order is
     * POST .../respond; every later step is PATCH .../status, one step forward.
     * PREPARING → READY requires assigned_rider: the rider's public
     * code (e.g. RID-9ERNEW) from GET /restaurant/riders.
     */
    updateGroupOrder: build.mutation<
      void,
      { id: string; status: string; riderId?: string }
    >({
      query: ({ id, status, riderId }) => {
        const responds = status === "PREPARING" || status === "REJECTED",
          path = endpoint(
            responds ? API_PATHS.respondGroupOrder : API_PATHS.updateGroupOrder,
          ).replace("{id}", encodeURIComponent(id));
        return responds
          ? {
              url: path,
              method: "post",
              data: { decision: status === "PREPARING" ? "ACCEPT" : "REJECT" },
            }
          : {
              url: path,
              method: "patch",
              data: { status, ...(riderId && { assigned_rider: riderId }) },
            };
      },
      invalidatesTags: ["GroupOrders"],
    }),
  }),
});
export const {
  useGetGroupOrdersQuery,
  useUpdateGroupOrderMutation,
} = groupOrderApi;
