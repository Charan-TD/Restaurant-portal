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
/** Each line is { quantity, menu_item: { name, total_price, … } }. */
function toItem(line: unknown): GroupOrderItem[] {
  const item = asRow(line),
    menu = asRow(item.menu_item),
    name = text(menu.name) ?? text(item.name),
    quantity = Number(item.quantity) || 1,
    price = Number(menu.total_price);
  return name
    ? [
        {
          name,
          quantity,
          amount: Number.isFinite(price) ? price * quantity : undefined,
        },
      ]
    : [];
}
function toGroupOrder(raw: unknown, i: number): GroupOrder {
  const row = asRow(raw),
    contactName = text(row.contact_name) ?? "Customer",
    mobile = text(row.mobile_number) ?? "";
  const id = text(row.grp_ord_id) ?? text(row.id),
    // Not documented yet: the names the orders API uses for its rider.
    riderRow = asRow(row.rider ?? row.assigned_rider),
    riderName = text(riderRow.rider_name) ?? text(riderRow.name);
  return {
    id,
    key: id ?? `${contactName}-${mobile}-${i}`,
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
     * READY → OUT_FOR_DELIVERY requires assigned_rider: the rider's public
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
