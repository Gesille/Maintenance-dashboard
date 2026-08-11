/* eslint-disable @typescript-eslint/no-explicit-any */
import { apiSlice } from "../api/apiSlice";

// ── Types ─────────────────────────────────────────────────────────────────────
// Mirrors models/Procedure.model.ts / models/Maintenancerequest.model.ts (IProcedureInstance)

export type ProcedureStatus = "draft" | "published";

export type ProcedureFieldType =
  | "section_header"
  | "text"
  | "number"
  | "checkbox"
  | "multiple_choice"
  | "inspection"
  | "photo"
  | "signature"
  | "date";

export const VALID_FIELD_TYPES: ProcedureFieldType[] = [
  "section_header",
  "text",
  "number",
  "checkbox",
  "multiple_choice",
  "inspection",
  "photo",
  "signature",
  "date",
];

export const SCORABLE_FIELD_TYPES: ProcedureFieldType[] = ["checkbox", "multiple_choice", "inspection"];

export interface OptionScore {
  option: string;
  score: number;
}

export interface FieldCondition {
  fieldId: string;
  equals: string;
}

export interface ProcedureField {
  id: string;
  type: ProcedureFieldType;
  label: string;
  required: boolean;
  options: string[];
  order: number;
  scoringEnabled: boolean;
  maxScore: number;
  optionScores: OptionScore[];
  condition: FieldCondition | null;
}

export interface Procedure {
  id: number;
  title: string;
  description: string | null;
  coverImageUrl: string | null;
  status: ProcedureStatus;
  fields: ProcedureField[];
  tags: string[];
  teams: string[];
  scoringEnabled: boolean;
  goalScore: number;
  createdByName: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

// ── Work-order-attached instance (frozen snapshot) ────────────────────────────

export interface ProcedureFieldResponse {
  fieldId: string;
  value: string | number | boolean | string[] | null;
  scoreEarned: number | null;
}

export interface ProcedureInstance {
  procedureId: number | null;
  title: string;
  fields: ProcedureField[];
  responses: ProcedureFieldResponse[];
  scoringEnabled: boolean;
  maxScore: number;
  totalScore: number | null;
  completedAt: string | null;
  completedBy: string | null;
  attachedAt: string;
  attachedBy: string;
}

// ── Request / response payload shapes ─────────────────────────────────────────

export interface ProcedureFilters {
  status?: ProcedureStatus;
  tag?: string;
  search?: string;
}

export interface CreateProcedureInput {
  title: string;
  description?: string | null;
  coverImageUrl?: string | null;
  tags?: string[];
  teams?: string[];
  scoringEnabled?: boolean;
  goalScore?: number;
}

export interface UpdateProcedureInput {
  id: number;
  title?: string;
  description?: string | null;
  coverImageUrl?: string | null;
  tags?: string[];
  teams?: string[];
  scoringEnabled?: boolean;
  goalScore?: number;
}

export interface ProcedureFieldInput {
  type: ProcedureFieldType;
  label: string;
  required?: boolean;
  options?: string[];
  scoringEnabled?: boolean;
  maxScore?: number;
  optionScores?: OptionScore[];
  condition?: FieldCondition | null;
}

interface ListResponse {
  success: boolean;
  total: number;
  data: Procedure[];
}

interface SingleResponse {
  success: boolean;
  data: Procedure;
}

interface InstanceResponse {
  success: boolean;
  data: ProcedureInstance | null;
}

interface BulkAttachResponse {
  success: boolean;
  message: string;
  data: { matched: number; modified: number };
}

// ── Slice ─────────────────────────────────────────────────────────────────────

export const procedureApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // ── Library reads ──
    getAllProcedures: builder.query<Procedure[], ProcedureFilters | void>({
      query: (filters) => {
        const params = new URLSearchParams();
        if (filters?.status) params.set("status", filters.status);
        if (filters?.tag) params.set("tag", filters.tag);
        if (filters?.search) params.set("search", filters.search);
        const qs = params.toString();
        return {
          url: `get-all-procedures${qs ? `?${qs}` : ""}`,
          method: "GET",
          credentials: "include" as const,
        };
      },
      transformResponse: (res: ListResponse) => res.data,
      providesTags: (result) =>
        result
          ? [
              ...result.map((p) => ({ type: "Procedure" as const, id: p.id })),
              { type: "Procedure" as const, id: "LIST" },
            ]
          : [{ type: "Procedure" as const, id: "LIST" }],
    }),

    getProcedureById: builder.query<Procedure, number>({
      query: (id) => ({
        url: `get-procedure/${id}`,
        method: "GET",
        credentials: "include" as const,
      }),
      transformResponse: (res: SingleResponse) => res.data,
      providesTags: (_r, _e, id) => [{ type: "Procedure", id }],
    }),

    // ── Library management ──
    createProcedure: builder.mutation<Procedure, CreateProcedureInput>({
      query: (body) => ({
        url: "create-procedure",
        method: "POST",
        body,
        credentials: "include" as const,
      }),
      transformResponse: (res: SingleResponse) => res.data,
      invalidatesTags: [{ type: "Procedure", id: "LIST" }],
    }),

    updateProcedure: builder.mutation<Procedure, UpdateProcedureInput>({
      query: ({ id, ...body }) => ({
        url: `update-procedure/${id}`,
        method: "PUT",
        body,
        credentials: "include" as const,
      }),
      transformResponse: (res: SingleResponse) => res.data,
      invalidatesTags: (_r, _e, { id }) => [
        { type: "Procedure", id },
        { type: "Procedure", id: "LIST" },
      ],
    }),

    deleteProcedure: builder.mutation<{ success: boolean }, number>({
      query: (id) => ({
        url: `delete-procedure/${id}`,
        method: "DELETE",
        credentials: "include" as const,
      }),
      invalidatesTags: [{ type: "Procedure", id: "LIST" }],
    }),

    publishProcedure: builder.mutation<Procedure, number>({
      query: (id) => ({
        url: `publish/${id}`,
        method: "PATCH",
        credentials: "include" as const,
      }),
      transformResponse: (res: SingleResponse) => res.data,
      invalidatesTags: (_r, _e, id) => [
        { type: "Procedure", id },
        { type: "Procedure", id: "LIST" },
      ],
    }),

    duplicateProcedure: builder.mutation<Procedure, number>({
      query: (id) => ({
        url: `duplicate/${id}`,
        method: "POST",
        credentials: "include" as const,
      }),
      transformResponse: (res: SingleResponse) => res.data,
      invalidatesTags: [{ type: "Procedure", id: "LIST" }],
    }),

    // ── Field management ──
    addProcedureField: builder.mutation<Procedure, { id: number; field: ProcedureFieldInput }>({
      query: ({ id, field }) => ({
        url: `add-field/${id}`,
        method: "POST",
        body: field,
        credentials: "include" as const,
      }),
      transformResponse: (res: SingleResponse) => res.data,
      invalidatesTags: (_r, _e, { id }) => [{ type: "Procedure", id }],
    }),

    updateProcedureField: builder.mutation<
      Procedure,
      { id: number; fieldId: string; data: Partial<ProcedureFieldInput> }
    >({
      query: ({ id, fieldId, data }) => ({
        url: `update-field/${id}/${fieldId}`,
        method: "PUT",
        body: data,
        credentials: "include" as const,
      }),
      transformResponse: (res: SingleResponse) => res.data,
      invalidatesTags: (_r, _e, { id }) => [{ type: "Procedure", id }],
    }),

    removeProcedureField: builder.mutation<Procedure, { id: number; fieldId: string }>({
      query: ({ id, fieldId }) => ({
        url: `remove-field/${id}/${fieldId}`,
        method: "DELETE",
        credentials: "include" as const,
      }),
      transformResponse: (res: SingleResponse) => res.data,
      invalidatesTags: (_r, _e, { id }) => [{ type: "Procedure", id }],
    }),

    reorderProcedureFields: builder.mutation<Procedure, { id: number; orderedFieldIds: string[] }>({
      query: ({ id, orderedFieldIds }) => ({
        url: `reorder-fields/${id}`,
        method: "PATCH",
        body: { orderedFieldIds },
        credentials: "include" as const,
      }),
      transformResponse: (res: SingleResponse) => res.data,
      invalidatesTags: (_r, _e, { id }) => [{ type: "Procedure", id }],
    }),

    // ── Attach to work order(s) ──
    attachProcedureToRequest: builder.mutation<Procedure, { procedureId: number; requestId: number }>({
      query: ({ procedureId, requestId }) => ({
        url: `attach/${procedureId}/request/${requestId}`,
        method: "POST",
        credentials: "include" as const,
      }),
      transformResponse: (res: SingleResponse) => res.data,
      invalidatesTags: (_r, _e, { requestId }) => [
        { type: "ProcedureInstance", id: requestId },
        "MaintenanceRequests",
      ],
    }),

    bulkAttachProcedure: builder.mutation<
      BulkAttachResponse["data"],
      { procedureId: number; requestIds: number[] }
    >({
      query: ({ procedureId, requestIds }) => ({
        url: `attach/${procedureId}/bulk`,
        method: "POST",
        body: { requestIds },
        credentials: "include" as const,
      }),
      transformResponse: (res: BulkAttachResponse) => res.data,
      invalidatesTags: ["MaintenanceRequests"],
    }),

    // ── Fill out / complete on a work order ──
    getProcedureInstance: builder.query<ProcedureInstance | null, number>({
      query: (requestId) => ({
        url: `request/${requestId}/instance`,
        method: "GET",
        credentials: "include" as const,
      }),
      transformResponse: (res: InstanceResponse) => res.data,
      providesTags: (_r, _e, requestId) => [{ type: "ProcedureInstance", id: requestId }],
    }),

    submitProcedureResponses: builder.mutation<
      ProcedureInstance,
      { requestId: number; responses: { fieldId: string; value: any }[] }
    >({
      query: ({ requestId, responses }) => ({
        url: `request/${requestId}/responses`,
        method: "PATCH",
        body: { responses },
        credentials: "include" as const,
      }),
      transformResponse: (res: { success: boolean; data: ProcedureInstance }) => res.data,
      invalidatesTags: (_r, _e, { requestId }) => [{ type: "ProcedureInstance", id: requestId }],
    }),

    completeProcedure: builder.mutation<ProcedureInstance, number>({
      query: (requestId) => ({
        url: `request/${requestId}/complete`,
        method: "PATCH",
        credentials: "include" as const,
      }),
      transformResponse: (res: { success: boolean; data: ProcedureInstance }) => res.data,
      invalidatesTags: (_r, _e, requestId) => [
        { type: "ProcedureInstance", id: requestId },
        "MaintenanceRequests",
      ],
    }),
  }),

  overrideExisting: false,
});

export const {
  useGetAllProceduresQuery,
  useGetProcedureByIdQuery,
  useCreateProcedureMutation,
  useUpdateProcedureMutation,
  useDeleteProcedureMutation,
  usePublishProcedureMutation,
  useDuplicateProcedureMutation,
  useAddProcedureFieldMutation,
  useUpdateProcedureFieldMutation,
  useRemoveProcedureFieldMutation,
  useReorderProcedureFieldsMutation,
  useAttachProcedureToRequestMutation,
  useBulkAttachProcedureMutation,
  useGetProcedureInstanceQuery,
  useSubmitProcedureResponsesMutation,
  useCompleteProcedureMutation,
} = procedureApi;