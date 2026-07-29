/* eslint-disable @typescript-eslint/no-explicit-any */
import { apiSlice } from "../api/apiSlice";

// ── Types ─────────────────────────────────────────────────────────────────────

export type TicketStatus = "open" | "in_progress" | "resolved" | "closed";
export type TicketCategory =
  | "technical_issue"
  | "request_not_updating"
  | "account_login"
  | "equipment"
  | "other";

export interface SupportTicket {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  category: TicketCategory;
  subject: string;
  message: string;
  status: TicketStatus;
  adminReply: string | null;
  repliedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// ── Response envelopes ────────────────────────────────────────────────────────

interface ListResponse {
  success: boolean;
  total: number;
  data: SupportTicket[];
}

interface SingleResponse {
  success: boolean;
  message?: string;
  data: SupportTicket;
}

export interface CreateTicketArgs {
  category: TicketCategory;
  subject: string;
  message: string;
}

export interface UpdateTicketArgs {
  id: string;
  status?: TicketStatus;
  adminReply?: string;
}

// ── Slice ─────────────────────────────────────────────────────────────────────

export const supportTicketApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    createTicket: builder.mutation<SingleResponse, CreateTicketArgs>({
      query: (body) => ({
        url: "create-ticket",
        method: "POST",
        body,
        credentials: "include" as const,
      }),
      invalidatesTags: ["SupportTickets" as any],
    }),

    getMyTickets: builder.query<SupportTicket[], void>({
      query: () => ({
        url: "my-tickets",
        method: "GET",
        credentials: "include" as const,
      }),
      transformResponse: (res: ListResponse) => res.data,
      providesTags: ["SupportTickets" as any],
    }),

    getTicketById: builder.query<SupportTicket, string>({
      query: (id) => ({
        url: `my-tickets/${id}`,
        method: "GET",
        credentials: "include" as const,
      }),
      transformResponse: (res: SingleResponse) => res.data,
      providesTags: (_result, _err, id) => [{ type: "SupportTickets" as any, id }],
    }),

    getAllTickets: builder.query<SupportTicket[], { status?: TicketStatus } | void>({
      query: (args) => ({
        url: "all-tickets",
        method: "GET",
        params: args?.status ? { status: args.status } : undefined,
        credentials: "include" as const,
      }),
      transformResponse: (res: ListResponse) => res.data,
      providesTags: ["SupportTickets" as any],
    }),

    updateTicket: builder.mutation<SingleResponse, UpdateTicketArgs>({
      query: ({ id, ...body }) => ({
        url: `update-ticket/${id}`,
        method: "PUT",
        body,
        credentials: "include" as const,
      }),
      // Invalidate so the list + detail refetch after a status/reply change
      invalidatesTags: ["SupportTickets" as any],
    }),
  }),

  overrideExisting: false,
});

export const {
  useCreateTicketMutation,
  useGetMyTicketsQuery,
  useGetTicketByIdQuery,
  useGetAllTicketsQuery,
  useUpdateTicketMutation,
} = supportTicketApi;