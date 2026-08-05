import { apiSlice } from "../api/apiSlice";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Part {
  id: number;
  name: string;
  partNumber: string | null;
  description: string | null;
  category: string | null;
  unitOfMeasure: string;
  quantityOnHand: number;
  minQuantity: number;
  reorderQuantity: number | null;
  unitCost: number;
  vendor: string | null;
  vendorPartNumber: string | null;
  location: string | null;
  barcode: string | null;
  linkedEquipmentIds: number[];
  active: boolean;
  isLowStock: boolean; // virtual — computed on the server, not stored
  createdAt: string;
  updatedAt: string;
}

export type StockMovementType = "restock" | "consume" | "adjustment" | "initial";

export interface PartStockMovement {
  _id: string;
  partId: number;
  type: StockMovementType;
  quantityDelta: number;
  previousQuantity: number;
  newQuantity: number;
  reason: string | null;
  referenceType: "maintenance_request" | "manual" | null;
  referenceId: number | null;
  performedById: string | null;
  performedByName: string | null;
  createdAt: string;
}

export interface CreatePartInput {
  name: string;
  partNumber?: string | null;
  description?: string | null;
  category?: string | null;
  unitOfMeasure?: string;
  quantityOnHand?: number;
  minQuantity?: number;
  reorderQuantity?: number | null;
  unitCost?: number;
  vendor?: string | null;
  vendorPartNumber?: string | null;
  location?: string | null;
  barcode?: string | null;
  linkedEquipmentIds?: number[];
}

export type UpdatePartInput = Partial<
  Pick<
    CreatePartInput,
    | "name"
    | "partNumber"
    | "description"
    | "category"
    | "unitOfMeasure"
    | "minQuantity"
    | "reorderQuantity"
    | "unitCost"
    | "vendor"
    | "vendorPartNumber"
    | "location"
    | "barcode"
  >
>;

export const EMPTY_PART_FORM: CreatePartInput = {
  name: "",
  partNumber: null,
  description: null,
  category: null,
  unitOfMeasure: "pcs",
  quantityOnHand: 0,
  minQuantity: 0,
  reorderQuantity: null,
  unitCost: 0,
  vendor: null,
  vendorPartNumber: null,
  location: null,
  barcode: null,
  linkedEquipmentIds: [],
};

export interface PartFilters {
  category?: string;
  equipmentId?: number;
  lowStockOnly?: boolean;
  search?: string;
}

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

interface StockMovementListResponse {
  success: boolean;
  total: number;
  data: PartStockMovement[];
}

interface DeleteResponse {
  success: boolean;
  message: string;
}

// ── Slice ─────────────────────────────────────────────────────────────────────

export const partApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAllParts: builder.query<ListResponse, PartFilters | void>({
      query: (params) => ({
        url: "get-all-parts",
        method: "GET",
        params: params
          ? {
              category: params.category,
              equipmentId: params.equipmentId,
              lowStockOnly: params.lowStockOnly ? "true" : undefined,
              search: params.search,
            }
          : undefined,
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
      providesTags: (result) =>
        result
          ? [
              ...result.data.map((p) => ({ type: "Part" as const, id: p.id })),
              { type: "Part" as const, id: "LOW_STOCK" },
            ]
          : [{ type: "Part" as const, id: "LOW_STOCK" }],
    }),

    getPartsByEquipment: builder.query<ListResponse, number>({
      query: (equipmentId) => ({
        url: `by-equipment/${equipmentId}`,
        method: "GET",
        credentials: "include" as const,
      }),
      providesTags: (result, _err, equipmentId) =>
        result
          ? [
              ...result.data.map((p) => ({ type: "Part" as const, id: p.id })),
              { type: "Part" as const, id: `EQUIPMENT_${equipmentId}` },
            ]
          : [{ type: "Part" as const, id: `EQUIPMENT_${equipmentId}` }],
    }),

    getPartStockHistory: builder.query<StockMovementListResponse, number>({
      query: (partId) => ({
        url: `stock-history/${partId}`,
        method: "GET",
        credentials: "include" as const,
      }),
      providesTags: (_result, _err, partId) => [
        { type: "PartStockMovement" as const, id: partId },
      ],
    }),

    createPart: builder.mutation<SingleResponse, CreatePartInput>({
      query: (body) => ({
        url: "create-part",
        method: "POST",
        body,
        credentials: "include" as const,
      }),
      invalidatesTags: [
        { type: "Part", id: "LIST" },
        { type: "Part", id: "LOW_STOCK" },
      ],
    }),

    updatePart: builder.mutation<SingleResponse, { id: number; data: UpdatePartInput }>({
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

    restockPart: builder.mutation<
      SingleResponse,
      { id: number; quantity: number; reason?: string }
    >({
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

    consumePart: builder.mutation<
      SingleResponse,
      { id: number; quantity: number; reason?: string; maintenanceRequestId?: number }
    >({
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

    adjustPartQuantity: builder.mutation<
      SingleResponse,
      { id: number; newQuantity: number; reason?: string }
    >({
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

    linkPartToEquipment: builder.mutation<SingleResponse, { id: number; equipmentId: number }>({
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

    unlinkPartFromEquipment: builder.mutation<SingleResponse, { id: number; equipmentId: number }>({
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