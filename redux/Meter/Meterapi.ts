import { apiSlice } from "../api/apiSlice";

// ── Types ─────────────────────────────────────────────────────────────────────

export type MeterType = "manual" | "automated";
export type MeterReadingTypeKind = "cumulative" | "gauge";
export type MeterStatus = "pending" | "stable" | "triggered";
export type TriggerOperator = "gte" | "lte" | "eq" | "between" | "increased_by";
export type ReadingSource = "manual" | "api" | "sensor";

export interface TechnicianRef {
  id: string;
  name: string;
  email: string;
}

export interface MeterTrigger {
  id: string;
  label: string;
  operator: TriggerOperator;
  value: number;
  valueMax: number | null;
  active: boolean;
  createWorkOrder: boolean;
  workOrderPriority: string;
  workOrderDescription: string;
  assignTechnicians: TechnicianRef[];
  notifyEmails: string[];
}

export interface Meter {
  id: number;
  name: string;
  equipmentId: number;
  equipmentName: string | null;
  unit: string;
  meterType: MeterType;
  readingType: MeterReadingTypeKind;
  description: string | null;
  lastReadingValue: number | null;
  lastReadingAt: string | null;
  status: MeterStatus;
  triggers: MeterTrigger[];
  createdByName: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MeterReading {
  id: number;
  meterId: number;
  value: number;
  previousValue: number | null;
  source: ReadingSource;
  recordedById: string | null;
  recordedByName: string;
  note: string | null;
  triggeredWorkOrder: boolean;
  triggeredRequestId: number | null;
  matchedTriggerIds: string[];
  createdAt: string;
}

export interface ChartPoint {
  value: number;
  createdAt: string;
  triggeredWorkOrder: boolean;
}

export type MeterFormInput = Pick<
  Meter,
  "name" | "equipmentId" | "unit" | "meterType" | "readingType" | "description"
>;

export const EMPTY_METER_FORM: MeterFormInput = {
  name: "",
  equipmentId: 0,
  unit: "",
  meterType: "manual",
  readingType: "gauge",
  description: null,
};

export type TriggerFormInput = Omit<MeterTrigger, "id">;

export const EMPTY_TRIGGER_FORM: TriggerFormInput = {
  label: "",
  operator: "gte",
  value: 0,
  valueMax: null,
  active: true,
  createWorkOrder: true,
  workOrderPriority: "medium",
  workOrderDescription: "",
  assignTechnicians: [],
  notifyEmails: [],
};

export interface MeterFilters {
  equipmentId?: number;
  status?: MeterStatus;
  meterType?: MeterType;
  search?: string;
}

interface ListResponse {
  success: boolean;
  total: number;
  data: Meter[];
}

interface SingleResponse {
  success: boolean;
  message?: string;
  data: Meter;
}

interface ReadingListResponse {
  success: boolean;
  total: number;
  data: MeterReading[];
}

interface ChartResponse {
  success: boolean;
  data: ChartPoint[];
}

interface RecordReadingResponse {
  success: boolean;
  message: string;
  data: { meter: Meter; reading: MeterReading };
}

interface DeleteResponse {
  success: boolean;
  message: string;
}

// ── Slice ─────────────────────────────────────────────────────────────────────

export const meterApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAllMeters: builder.query<ListResponse, MeterFilters | void>({
      query: (params) => ({
        url: "get-all-meters",
        method: "GET",
        params: params
          ? {
              equipmentId: params.equipmentId,
              status: params.status,
              meterType: params.meterType,
              search: params.search,
            }
          : undefined,
        credentials: "include" as const,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map((m) => ({ type: "Meter" as const, id: m.id })),
              { type: "Meter" as const, id: "LIST" },
            ]
          : [{ type: "Meter" as const, id: "LIST" }],
    }),

    getMeterById: builder.query<Meter, number>({
      query: (id) => ({
        url: `get-meter/${id}`,
        method: "GET",
        credentials: "include" as const,
      }),
      transformResponse: (res: SingleResponse) => res.data,
      providesTags: (_result, _err, id) => [{ type: "Meter", id }],
    }),

    createMeter: builder.mutation<SingleResponse, MeterFormInput>({
      query: (body) => ({
        url: "create-meter",
        method: "POST",
        body,
        credentials: "include" as const,
      }),
      invalidatesTags: [{ type: "Meter", id: "LIST" }],
    }),

    updateMeter: builder.mutation<SingleResponse, { id: number; data: Partial<MeterFormInput> }>({
      query: ({ id, data }) => ({
        url: `update-meter/${id}`,
        method: "PUT",
        body: data,
        credentials: "include" as const,
      }),
      invalidatesTags: (_result, _err, { id }) => [
        { type: "Meter", id },
        { type: "Meter", id: "LIST" },
      ],
    }),

    deleteMeter: builder.mutation<DeleteResponse, number>({
      query: (id) => ({
        url: `delete-meter/${id}`,
        method: "DELETE",
        credentials: "include" as const,
      }),
      invalidatesTags: (_result, _err, id) => [
        { type: "Meter", id },
        { type: "Meter", id: "LIST" },
      ],
    }),

    addMeterTrigger: builder.mutation<SingleResponse, { id: number; data: TriggerFormInput }>({
      query: ({ id, data }) => ({
        url: `add-trigger/${id}`,
        method: "POST",
        body: data,
        credentials: "include" as const,
      }),
      invalidatesTags: (_result, _err, { id }) => [{ type: "Meter", id }],
    }),

    updateMeterTrigger: builder.mutation<
      SingleResponse,
      { id: number; triggerId: string; data: Partial<TriggerFormInput> }
    >({
      query: ({ id, triggerId, data }) => ({
        url: `update-trigger/${id}/${triggerId}`,
        method: "PUT",
        body: data,
        credentials: "include" as const,
      }),
      invalidatesTags: (_result, _err, { id }) => [{ type: "Meter", id }],
    }),

    removeMeterTrigger: builder.mutation<SingleResponse, { id: number; triggerId: string }>({
      query: ({ id, triggerId }) => ({
        url: `remove-trigger/${id}/${triggerId}`,
        method: "DELETE",
        credentials: "include" as const,
      }),
      invalidatesTags: (_result, _err, { id }) => [{ type: "Meter", id }],
    }),

    recordMeterReading: builder.mutation<
      RecordReadingResponse,
      { id: number; value: number; note?: string }
    >({
      query: ({ id, value, note }) => ({
        url: `record-reading/${id}`,
        method: "POST",
        body: { value, note },
        credentials: "include" as const,
      }),
      invalidatesTags: (_result, _err, { id }) => [
        { type: "Meter", id },
        { type: "Meter", id: "LIST" },
        { type: "MeterReading", id: `LIST-${id}` },
      ],
    }),

    getMeterReadingHistory: builder.query<ReadingListResponse, { id: number; limit?: number }>({
      query: ({ id, limit }) => ({
        url: `get-reading-history/${id}`,
        method: "GET",
        params: limit ? { limit } : undefined,
        credentials: "include" as const,
      }),
      providesTags: (_result, _err, { id }) => [{ type: "MeterReading", id: `LIST-${id}` }],
    }),

    getMeterChartData: builder.query<
      ChartResponse,
      { id: number; startDate?: string; endDate?: string }
    >({
      query: ({ id, startDate, endDate }) => ({
        url: `get-chart-data/${id}`,
        method: "GET",
        params: { startDate, endDate },
        credentials: "include" as const,
      }),
      providesTags: (_result, _err, { id }) => [{ type: "MeterReading", id: `CHART-${id}` }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetAllMetersQuery,
  useGetMeterByIdQuery,
  useCreateMeterMutation,
  useUpdateMeterMutation,
  useDeleteMeterMutation,
  useAddMeterTriggerMutation,
  useUpdateMeterTriggerMutation,
  useRemoveMeterTriggerMutation,
  useRecordMeterReadingMutation,
  useGetMeterReadingHistoryQuery,
  useGetMeterChartDataQuery,
} = meterApi;