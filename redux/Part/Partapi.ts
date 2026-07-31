/* eslint-disable @typescript-eslint/no-empty-object-type */
// redux/Part/Partapi.ts
import { Part, PartStockMovement, PartFormInput, PartFilters } from "@/types/Part";
import { apiSlice } from "../api/apiSlice";

// ── Response envelopes (mirrors Part.controller.ts responses exactly) ────────

interface ListResponse {
  success: boolean;
  total: number;
  data: Part[];
}

interface SingleResponse {
  success: boolean;
  message?: string;
  data: Part;
}

interface MovementListResponse {
  success: boolean;
  total: number;
  data: PartStockMovement[];
}

interface DeleteResponse {
  success: boolean;
  message: string;
}

// ── Mutation payload shapes ───────────────────────────────────────────────────

export interface CreatePartPayload extends Omit<PartFormInput, never> {}

export type UpdatePartPayload = Partial<
  Omit<PartFormInput, "quantityOnHand" | "linkedEquipmentIds">
>;

export interface StockActionPayload {
  id: number;
  quantity: number;
  reason?: string;
}

export interface AdjustPayload {
  id: number;
  newQuantity: number;
  reason?: string;
}

export interface ConsumePayload extends StockActionPayload {
  maintenanceRequestId?: number;
}

export interface LinkEquipmentPayload {
  id: number;
  equipmentId: number;
}

// Builds a query string from PartFilters, skipping anything unset
function buildFilterQuery(filters: PartFilters = {}) {
  const params = new URLSearchParams();
  if (filters.category) params.set("category", filters.category);
  if (filters.equipmentId !== undefined) params.set("equipmentId", String(filters.equipmentId));
  if (filters.lowStockOnly) params.set("lowStockOnly", "true");
  if (filters.search) params.set("search", filters.search);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export const partApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // ── Reads ──────────────────────────────────────────────────────────────
    getAllParts: builder.query<ListResponse, PartFilters | void>({
      query: (filters) => ({
        url: `get-all-parts${buildFilterQuery(filters ?? {})}`,
        method: "GET",
        credentials: "include" as const,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map((p) => ({ type: "Part" as const, id: p.id })),
              { type: "Part" as const, id: "LIST" },
            ]
          : [{ type: "Part" as const, id: "LIST" }],
    }),

    getPartById: builder.query<Part, number>({
      query: (id) => ({
        url: `get-part/${id}`,
        method: "GET",
        credentials: "include" as const,
      }),
      transformResponse: (res: SingleResponse) => res.data,
      providesTags: (_result, _err, id) => [{ type: "Part", id }],
    }),

    getLowStockParts: builder.query<ListResponse, void>({
      query: () => ({
        url: "low-stock",
        method: "GET",
        credentials: "include" as const,
      }),
      providesTags: [{ type: "Part", id: "LOW_STOCK" }],
    }),

    getPartsByEquipment: builder.query<ListResponse, number>({
      query: (equipmentId) => ({
        url: `by-equipment/${equipmentId}`,
        method: "GET",
        credentials: "include" as const,
      }),
      providesTags: (_result, _err, equipmentId) => [
        { type: "Part", id: `EQUIPMENT_${equipmentId}` },
      ],
    }),

    getPartStockHistory: builder.query<MovementListResponse, number>({
      query: (id) => ({
        url: `stock-history/${id}`,
        method: "GET",
        credentials: "include" as const,
      }),
      providesTags: (_result, _err, id) => [{ type: "PartStockMovement", id }],
    }),

    // ── Create / update / delete ──────────────────────────────────────────
    createPart: builder.mutation<SingleResponse, CreatePartPayload>({
      query: (body) => ({
        url: "create-part",
        method: "POST",
        body,
        credentials: "include" as const,
      }),
      invalidatesTags: [{ type: "Part", id: "LIST" }, { type: "Part", id: "LOW_STOCK" }],
    }),

    updatePart: builder.mutation<SingleResponse, { id: number; data: UpdatePartPayload }>({
      query: ({ id, data }) => ({
        url: `update-part/${id}`,
        method: "PUT",
        body: data,
        credentials: "include" as const,
      }),
      invalidatesTags: (_result, _err, { id }) => [
        { type: "Part", id },
        { type: "Part", id: "LIST" },
      ],
    }),

    deletePart: builder.mutation<DeleteResponse, number>({
      query: (id) => ({
        url: `delete-part/${id}`,
        method: "DELETE",
        credentials: "include" as const,
      }),
      invalidatesTags: (_result, _err, id) => [
        { type: "Part", id },
        { type: "Part", id: "LIST" },
        { type: "Part", id: "LOW_STOCK" },
      ],
    }),

    // ── Stock movement ────────────────────────────────────────────────────
    restockPart: builder.mutation<SingleResponse, StockActionPayload>({
      query: ({ id, quantity, reason }) => ({
        url: `restock/${id}`,
        method: "PATCH",
        body: { quantity, reason },
        credentials: "include" as const,
      }),
      invalidatesTags: (_result, _err, { id }) => [
        { type: "Part", id },
        { type: "Part", id: "LIST" },
        { type: "Part", id: "LOW_STOCK" },
        { type: "PartStockMovement", id },
      ],
    }),

    consumePart: builder.mutation<SingleResponse, ConsumePayload>({
      query: ({ id, quantity, reason, maintenanceRequestId }) => ({
        url: `consume/${id}`,
        method: "PATCH",
        body: { quantity, reason, maintenanceRequestId },
        credentials: "include" as const,
      }),
      invalidatesTags: (_result, _err, { id }) => [
        { type: "Part", id },
        { type: "Part", id: "LIST" },
        { type: "Part", id: "LOW_STOCK" },
        { type: "PartStockMovement", id },
      ],
    }),

    adjustPartQuantity: builder.mutation<SingleResponse, AdjustPayload>({
      query: ({ id, newQuantity, reason }) => ({
        url: `adjust/${id}`,
        method: "PATCH",
        body: { newQuantity, reason },
        credentials: "include" as const,
      }),
      invalidatesTags: (_result, _err, { id }) => [
        { type: "Part", id },
        { type: "Part", id: "LIST" },
        { type: "Part", id: "LOW_STOCK" },
        { type: "PartStockMovement", id },
      ],
    }),

    // ── Equipment linking ──────────────────────────────────────────────────
    linkPartToEquipment: builder.mutation<SingleResponse, LinkEquipmentPayload>({
      query: ({ id, equipmentId }) => ({
        url: `link-equipment/${id}`,
        method: "POST",
        body: { equipmentId },
        credentials: "include" as const,
      }),
      invalidatesTags: (_result, _err, { id, equipmentId }) => [
        { type: "Part", id },
        { type: "Part", id: "LIST" },
        { type: "Part", id: `EQUIPMENT_${equipmentId}` },
      ],
    }),

    unlinkPartFromEquipment: builder.mutation<SingleResponse, LinkEquipmentPayload>({
      query: ({ id, equipmentId }) => ({
        url: `unlink-equipment/${id}/${equipmentId}`,
        method: "DELETE",
        credentials: "include" as const,
      }),
      invalidatesTags: (_result, _err, { id, equipmentId }) => [
        { type: "Part", id },
        { type: "Part", id: "LIST" },
        { type: "Part", id: `EQUIPMENT_${equipmentId}` },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetAllPartsQuery,
  useGetPartByIdQuery,
  useGetLowStockPartsQuery,
  useGetPartsByEquipmentQuery,
  useGetPartStockHistoryQuery,
  useCreatePartMutation,
  useUpdatePartMutation,
  useDeletePartMutation,
  useRestockPartMutation,
  useConsumePartMutation,
  useAdjustPartQuantityMutation,
  useLinkPartToEquipmentMutation,
  useUnlinkPartFromEquipmentMutation,
} = partApi;