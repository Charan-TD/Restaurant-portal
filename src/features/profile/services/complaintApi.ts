import { baseApi } from "@/core/api/baseApi";
import { API_PATHS, endpoint } from "@/core/constants/config";
import type {
  Complaint,
  ComplaintCounts,
  ComplaintMessage,
  ComplaintPage,
  ComplaintStatus,
} from "../models/complaints";

type Row = Record<string, unknown>;
const asRow = (value: unknown): Row =>
  value && typeof value === "object" ? (value as Row) : {};
const text = (value: unknown) =>
  typeof value === "string" && value.trim() ? value.trim() : undefined;
const body = (data: unknown) => asRow(asRow(data).data);

const message = (raw: unknown): ComplaintMessage => {
  const row = asRow(raw);
  return {
    id: text(row.id) ?? "",
    from: text(row.sender_type) ?? "CUSTOMER",
    text: text(row.message) ?? "",
    at: text(row.created_at) ?? "",
  };
};

export function toComplaint(raw: unknown): Complaint {
  const row = asRow(raw),
    status = text(row.status)?.toUpperCase();
  return {
    id: text(row.id) ?? "",
    number: text(row.complaint_number) ?? "",
    order: text(row.order_number) ?? "",
    customer: text(row.customer_name) ?? "Customer",
    category: text(row.category) ?? "Complaint",
    description: text(row.description) ?? "",
    status: status === "REPLIED" || status === "RESOLVED" ? status : "PENDING",
    createdAt: text(row.created_at) ?? "",
    resolvedAt: text(row.resolved_at),
    messages: Array.isArray(row.messages) ? row.messages.map(message) : [],
  };
}

export interface ComplaintQuery {
  page: number;
  search?: string;
  status?: ComplaintStatus;
}
const params = ({ search, status }: Omit<ComplaintQuery, "page">) => ({
  ...(search?.trim() && { search: search.trim() }),
  ...(status && { status }),
});

const base = () => endpoint(API_PATHS.complaints);

export const complaintApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    /** GET /restaurant/complaints: ten per page, filtered on the server. */
    getComplaints: build.query<ComplaintPage, ComplaintQuery>({
      query: ({ page, ...filters }) => ({
        url: base(),
        params: { page, ...params(filters) },
      }),
      transformResponse: (data: unknown): ComplaintPage => {
        const root = asRow(data),
          pagination = asRow(root.pagination);
        return {
          rows: Array.isArray(root.data) ? root.data.map(toComplaint) : [],
          page: Number(pagination.page) || 1,
          pages: Math.max(1, Number(pagination.total_pages) || 1),
          total: Number(pagination.total_records) || 0,
        };
      },
      providesTags: ["Complaints"],
    }),
    /** GET /restaurant/complaints/metrics: counts for the filtered set, whatever the page. */
    getComplaintCounts: build.query<ComplaintCounts, string | void>({
      query: (search) => ({
        url: `${base()}/metrics`,
        params: search?.trim() ? { search: search.trim() } : undefined,
      }),
      transformResponse: (data: unknown): ComplaintCounts => {
        const d = body(data);
        return {
          total: Number(d.total_complaints) || 0,
          pending: Number(d.pending) || 0,
          replied: Number(d.replied) || 0,
          resolved: Number(d.resolved) || 0,
        };
      },
      providesTags: ["Complaints"],
    }),
    /** GET /restaurant/complaints/{id}: the complaint with its whole conversation. */
    getComplaint: build.query<Complaint, string>({
      query: (id) => ({ url: `${base()}/${encodeURIComponent(id)}` }),
      transformResponse: (data: unknown) => toComplaint(body(data)),
      providesTags: ["Complaints"],
    }),
    /** POST /restaurant/complaints/{id}/reply { message }: not allowed once resolved (409). */
    replyToComplaint: build.mutation<void, { id: string; message: string }>({
      query: ({ id, message }) => ({
        url: `${base()}/${encodeURIComponent(id)}/reply`,
        method: "post",
        data: { message },
      }),
      invalidatesTags: ["Complaints"],
    }),
  }),
});
export const {
  useGetComplaintsQuery,
  useGetComplaintCountsQuery,
  useGetComplaintQuery,
  useReplyToComplaintMutation,
} = complaintApi;
