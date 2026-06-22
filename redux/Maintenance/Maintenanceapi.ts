/* eslint-disable @typescript-eslint/no-explicit-any */
import { apiSlice } from "../api/apiSlice";

// ── Types ─────────────────────────────────────────────────────────────────────

export type RepairState = "new" | "under_repair" | "done" | "cancel";

export interface StageInfo {
  id: number;
  name: string;
  sequence: number;
  isfold: boolean;
}

export interface MaintenanceRequest {
  id: number;
  name: string;
  description: string | null;
  priority: string;
  state: RepairState;
  maintenanceType: string;
  stage: StageInfo;
  equipment: {
    id: number;
    name: string;
    location: { id: number; name: string } | string | null;
    assetCode: string | null;
    serialNo: string | null;
    model: string | null;
  } | null;
  category: { id: number; name: string } | null;
  maintenanceTeam: { id: number; name: string } | null;
  technicians: { id: number; name: string }[];
  createdBy: { id: number; name: string } | null;
  createDate: string | null;
  scheduleDate: string | null;
  scheduleEnd: string | null;
  closeDate: string | null;
  duration: number;
  isRecurring: boolean;
  color: number;
}

export interface MaintenanceMessage {
  id: number;
  type: "comment";
  author: { id: number; name: string } | null;
  body: string;
  date: string;
  isInternal: boolean;
  parentId: number | null;
}

// ── Response envelopes ────────────────────────────────────────────────────────

interface ListResponse {
  success: boolean;
  data: {
    requests: MaintenanceRequest[];
    stages: StageInfo[];
    total: number;
  };
}

interface SingleResponse {
  success: boolean;
  data: MaintenanceRequest;
}

interface MessagesResponse {
  success: boolean;
  data: MaintenanceMessage[];
}

interface CommentResponse {
  success: boolean;
  data: {
    id: number;
    body: string;
    authorName: string;
    date: string;
    isInternal: boolean;
  };
}

interface StatusUpdateResponse {
  success: boolean;
  data: MaintenanceRequest | null;
}

// ── Slice ─────────────────────────────────────────────────────────────────────

export const maintenanceApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({

    getAllMaintenanceRequests: builder.query<ListResponse, void>({
      query: () => ({
        url: "get-requests",
        method: "GET",
        credentials: "include" as const,
      }),
      providesTags: ["MaintenanceRequests"],
    }),

    getMaintenanceRequestDetail: builder.query<MaintenanceRequest, number>({
      query: (id) => ({
        url: `get-request-detail/${id}`,
        method: "GET",
        credentials: "include" as const,
      }),
      transformResponse: (res: SingleResponse) => res.data,
      providesTags: (_result, _err, id) => [{ type: "MaintenanceRequests", id }],
    }),

    updateMaintenanceStatus: builder.mutation<
      StatusUpdateResponse,
      { id: number; state: RepairState }
    >({
      query: ({ id, state }) => ({
        url: `update-request-status/${id}`,
        method: "PATCH",
        body: { state },
        credentials: "include" as const,
      }),
      // Invalidate so the list refetches after a status change
      invalidatesTags: ["MaintenanceRequests"],
    }),

    getMaintenanceMessages: builder.query<MaintenanceMessage[], number>({
      query: (id) => ({
        url: `get-request-messages/${id}`,
        method: "GET",
        credentials: "include" as const,
      }),
      transformResponse: (res: MessagesResponse) => res.data,
      providesTags: (_result, _err, id) => [{ type: "MaintenanceMessages" as any, id }],
    }),

    postMaintenanceComment: builder.mutation<
      CommentResponse,
      { id: number; body: string; authorName: string; isInternal?: boolean }
    >({
      query: ({ id, ...body }) => ({
        url: `post-request-message/${id}`,
        method: "POST",
        body,
        credentials: "include" as const,
      }),
      invalidatesTags: (_result, _err, { id }) => [
        { type: "MaintenanceMessages" as any, id },
      ],
    }),
  }),

  overrideExisting: false,
});

export const {
  useGetAllMaintenanceRequestsQuery,
  useGetMaintenanceRequestDetailQuery,
  useUpdateMaintenanceStatusMutation,
  useGetMaintenanceMessagesQuery,
  usePostMaintenanceCommentMutation,
} = maintenanceApi;