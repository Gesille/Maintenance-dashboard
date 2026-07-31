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
  total: number;
  percentRepeatable: number;
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

export interface ResolutionTimeByPriority {
  priority: string;
  avgHours: number;
  count: number;
}

export interface AverageResolutionTimeReport {
  avgHours: number;
  resolvedCount: number;
  byPriority: ResolutionTimeByPriority[];
}

export interface TechnicianWorkloadRow {
  technicianId: string;
  technicianName: string;
  open: number;
  completed: number;
  total: number;
}

export interface EquipmentReliabilityRow {
  equipmentId: number;
  name: string;
  assetCode: string | null;
  restaurant: string | null;
  requestCount: number;
  openCount: number;
}

export interface OverdueRequestRow {
  id: number;
  name: string;
  priority: string;
  status: "new" | "under_repair" | "done" | "cancel";
  scheduleDate: string;
  daysOverdue: number;
}

export interface OverdueRequestsReport {
  count: number;
  requests: OverdueRequestRow[];
}

export interface LocationBreakdownRow {
  restaurant: string;
  count: number;
}

export interface CategoryBreakdownRow {
  category: string;
  count: number;
}

export interface CostRollupReport {
  activeAssetValue: number;
  activeEquipmentCount: number;
  totalAssetValue: number;
  totalEquipmentCount: number;
}

export interface ReportingSummary {
  createdVsCompleted: CreatedVsCompletedReport;
  reactiveVsRepeatable: ReactiveVsRepeatableReport;
  statusBreakdown: StatusBreakdownReport;
  priorityBreakdown: PriorityBreakdownRow[];
  averageResolutionTime: AverageResolutionTimeReport;
  technicianWorkload: TechnicianWorkloadRow[];
  equipmentReliability: EquipmentReliabilityRow[];
  overdueRequests: OverdueRequestsReport;
  locationBreakdown: LocationBreakdownRow[];
  categoryBreakdown: CategoryBreakdownRow[];
  costRollup: CostRollupReport;
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
        url: `reporting/summary${buildQuery(filters ?? {})}`,
        method: "GET",
        credentials: "include" as const,
      }),
      transformResponse: (res: ApiEnvelope<ReportingSummary>) => res.data,
    }),

    getCreatedVsCompleted: builder.query<CreatedVsCompletedReport, ReportingFilters | void>({
      query: (filters) => ({
        url: `reporting/created-vs-completed${buildQuery(filters ?? {})}`,
        method: "GET",
        credentials: "include" as const,
      }),
      transformResponse: (res: ApiEnvelope<CreatedVsCompletedReport>) => res.data,
    }),

    getReactiveVsRepeatable: builder.query<ReactiveVsRepeatableReport, ReportingFilters | void>({
      query: (filters) => ({
        url: `reporting/reactive-vs-repeatable${buildQuery(filters ?? {})}`,
        method: "GET",
        credentials: "include" as const,
      }),
      transformResponse: (res: ApiEnvelope<ReactiveVsRepeatableReport>) => res.data,
    }),

    getStatusBreakdown: builder.query<StatusBreakdownReport, ReportingFilters | void>({
      query: (filters) => ({
        url: `reporting/status-breakdown${buildQuery(filters ?? {})}`,
        method: "GET",
        credentials: "include" as const,
      }),
      transformResponse: (res: ApiEnvelope<StatusBreakdownReport>) => res.data,
    }),

    getPriorityBreakdown: builder.query<PriorityBreakdownRow[], ReportingFilters | void>({
      query: (filters) => ({
        url: `reporting/priority-breakdown${buildQuery(filters ?? {})}`,
        method: "GET",
        credentials: "include" as const,
      }),
      transformResponse: (res: ApiEnvelope<PriorityBreakdownRow[]>) => res.data,
    }),

    // ─── Average resolution time (MTTR) ──────────────────────────────────────
    getAverageResolutionTime: builder.query<AverageResolutionTimeReport, ReportingFilters | void>({
      query: (filters) => ({
        url: `reporting/resolution-time${buildQuery(filters ?? {})}`,
        method: "GET",
        credentials: "include" as const,
      }),
      transformResponse: (res: ApiEnvelope<AverageResolutionTimeReport>) => res.data,
    }),

    // ─── Technician workload ──────────────────────────────────────────────────
    getTechnicianWorkload: builder.query<TechnicianWorkloadRow[], ReportingFilters | void>({
      query: (filters) => ({
        url: `reporting/technician-workload${buildQuery(filters ?? {})}`,
        method: "GET",
        credentials: "include" as const,
      }),
      transformResponse: (res: ApiEnvelope<TechnicianWorkloadRow[]>) => res.data,
    }),

    // ─── Equipment reliability / repeat offenders ────────────────────────────
    getEquipmentReliability: builder.query<
      EquipmentReliabilityRow[],
      (ReportingFilters & { limit?: number }) | void
    >({
      query: (filters) => {
        const { limit, ...rest } = filters ?? {};
        const qs = buildQuery(rest);
        const limitPart = limit ? (qs ? `&limit=${limit}` : `?limit=${limit}`) : "";
        return {
          url: `reporting/equipment-reliability${qs}${limitPart}`,
          method: "GET",
          credentials: "include" as const,
        };
      },
      transformResponse: (res: ApiEnvelope<EquipmentReliabilityRow[]>) => res.data,
    }),

    // ─── Overdue requests ──────────────────────────────────────────────────────
    // Not date-filtered on the backend — always relative to "now".
    getOverdueRequests: builder.query<OverdueRequestsReport, void>({
      query: () => ({
        url: `reporting/overdue`,
        method: "GET",
        credentials: "include" as const,
      }),
      transformResponse: (res: ApiEnvelope<OverdueRequestsReport>) => res.data,
    }),

    // ─── Location / restaurant breakdown ─────────────────────────────────────
    getLocationBreakdown: builder.query<LocationBreakdownRow[], ReportingFilters | void>({
      query: (filters) => ({
        url: `reporting/location-breakdown${buildQuery(filters ?? {})}`,
        method: "GET",
        credentials: "include" as const,
      }),
      transformResponse: (res: ApiEnvelope<LocationBreakdownRow[]>) => res.data,
    }),

    // ─── Equipment category breakdown ────────────────────────────────────────
    getCategoryBreakdown: builder.query<CategoryBreakdownRow[], ReportingFilters | void>({
      query: (filters) => ({
        url: `reporting/category-breakdown${buildQuery(filters ?? {})}`,
        method: "GET",
        credentials: "include" as const,
      }),
      transformResponse: (res: ApiEnvelope<CategoryBreakdownRow[]>) => res.data,
    }),

    // ─── Cost rollup ───────────────────────────────────────────────────────────
    // Not date-filtered on the backend — reflects current asset state.
    getCostRollup: builder.query<CostRollupReport, void>({
      query: () => ({
        url: `reporting/cost-rollup`,
        method: "GET",
        credentials: "include" as const,
      }),
      transformResponse: (res: ApiEnvelope<CostRollupReport>) => res.data,
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
  useGetAverageResolutionTimeQuery,
  useGetTechnicianWorkloadQuery,
  useGetEquipmentReliabilityQuery,
  useGetOverdueRequestsQuery,
  useGetLocationBreakdownQuery,
  useGetCategoryBreakdownQuery,
  useGetCostRollupQuery,
} = reportingApi;