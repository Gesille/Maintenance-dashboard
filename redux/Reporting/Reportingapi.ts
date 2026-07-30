import { apiSlice } from "../api/apiSlice";

// ─── Shared filter shape (mirrors backend ReportingFilters) ─────────────────
// Dates are passed as ISO strings on the wire; the backend parses them into
// real Date objects before hitting Mongo.

export interface ReportingFilters {
  startDate?: string;
  endDate?: string;
}

// ─── Response shapes (mirror backend Reporting.service.ts) ──────────────────

export interface CreatedVsCompletedPoint {
  date: string;
  created: number;
  completed: number;
}

export interface CreatedVsCompletedReport {
  series: CreatedVsCompletedPoint[];
  created: number;
  completed: number;
  percentCompleted: number;
}

export interface ReactiveVsRepeatableReport {
  reactive: number;
  repeatable: number;
}

export interface StatusBreakdownReport {
  open: number;
  inProgress: number;
  onHold: number;
  done: number;
  total: number;
}

export interface PriorityBreakdownRow {
  priority: string;
  count: number;
}

export interface ReportingSummary {
  createdVsCompleted: CreatedVsCompletedReport;
  reactiveVsRepeatable: ReactiveVsRepeatableReport;
  statusBreakdown: StatusBreakdownReport;
  priorityBreakdown: PriorityBreakdownRow[];
}

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

// ─── Query string helper ─────────────────────────────────────────────────────

function buildQuery(filters: ReportingFilters = {}): string {
  const params = new URLSearchParams();
  if (filters.startDate) params.set("startDate", filters.startDate);
  if (filters.endDate) params.set("endDate", filters.endDate);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export const reportingApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // One round trip for the whole dashboard — used by the Reporting page.
    getReportingSummary: builder.query<ReportingSummary, ReportingFilters | void>({
      query: (filters) => ({
        url: `summary${buildQuery(filters ?? {})}`,
        method: "GET",
        credentials: "include" as const,
      }),
      transformResponse: (res: ApiEnvelope<ReportingSummary>) => res.data,
    }),

    getCreatedVsCompleted: builder.query<CreatedVsCompletedReport, ReportingFilters | void>({
      query: (filters) => ({
        url: `created-vs-completed${buildQuery(filters ?? {})}`,
        method: "GET",
        credentials: "include" as const,
      }),
      transformResponse: (res: ApiEnvelope<CreatedVsCompletedReport>) => res.data,
    }),

    getReactiveVsRepeatable: builder.query<ReactiveVsRepeatableReport, ReportingFilters | void>({
      query: (filters) => ({
        url: `reactive-vs-repeatable${buildQuery(filters ?? {})}`,
        method: "GET",
        credentials: "include" as const,
      }),
      transformResponse: (res: ApiEnvelope<ReactiveVsRepeatableReport>) => res.data,
    }),

    getStatusBreakdown: builder.query<StatusBreakdownReport, ReportingFilters | void>({
      query: (filters) => ({
        url: `status-breakdown${buildQuery(filters ?? {})}`,
        method: "GET",
        credentials: "include" as const,
      }),
      transformResponse: (res: ApiEnvelope<StatusBreakdownReport>) => res.data,
    }),

    getPriorityBreakdown: builder.query<PriorityBreakdownRow[], ReportingFilters | void>({
      query: (filters) => ({
        url: `priority-breakdown${buildQuery(filters ?? {})}`,
        method: "GET",
        credentials: "include" as const,
      }),
      transformResponse: (res: ApiEnvelope<PriorityBreakdownRow[]>) => res.data,
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetReportingSummaryQuery,
  useGetCreatedVsCompletedQuery,
  useGetReactiveVsRepeatableQuery,
  useGetStatusBreakdownQuery,
  useGetPriorityBreakdownQuery,
} = reportingApi;