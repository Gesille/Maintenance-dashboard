import { apiSlice } from "../api/apiSlice";

// ── Types ─────────────────────────────────────────────────────────────────────

export type PurchaseOrderStatus =
  | "requested"
  | "declined"
  | "approved"
  | "ordered"
  | "partially_fulfilled"
  | "fulfilled"
  | "cancelled";

export interface PurchaseOrderItem {
  partId: number | null; // null for one-off items
  partName: string;
  isOneOff: boolean;
  quantityOrdered: number;
  quantityFulfilled: number;
  unitCost: number;
}

export interface AdditionalCost {
  description: string;
  amount: number;
}

export interface PurchaseOrder {
  id: number;
  poNumber: string;
  vendor: string | null;
  vendorContact: string | null;
  status: PurchaseOrderStatus;
  items: PurchaseOrderItem[];
  taxAmount: number;
  additionalCosts: AdditionalCost[];
  subtotal: number;
  totalCost: number;
  orderDate: string | null;
  expectedDeliveryDate: string | null;
  fulfilledDate: string | null;
  notes: string | null;
  createdByName: string;
  createdByRole: string;
  approvedByName: string | null;
  declineReason: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

// Costs are optional on the wire — Full Users get them stripped by the API.
export type PurchaseOrderListItem = Omit<
  PurchaseOrder,
  "taxAmount" | "additionalCosts" | "subtotal" | "totalCost"
> &
  Partial<Pick<PurchaseOrder, "taxAmount" | "additionalCosts" | "subtotal" | "totalCost">> & {
    items: (Omit<PurchaseOrderItem, "unitCost"> & Partial<Pick<PurchaseOrderItem, "unitCost">>)[];
  };

export interface LineItemInput {
  partId?: number | null; // omit for a one-off item
  partName?: string;      // required when partId is omitted
  quantityOrdered: number;
  unitCost?: number;
}

export interface PurchaseOrderFormInput {
  vendor: string | null;
  vendorContact: string | null;
  items: LineItemInput[];
  taxAmount: number;
  additionalCosts: AdditionalCost[];
  expectedDeliveryDate: string | null;
  notes: string | null;
}

export const EMPTY_PURCHASE_ORDER_FORM: PurchaseOrderFormInput = {
  vendor: null,
  vendorContact: null,
  items: [{ partId: undefined, partName: "", quantityOrdered: 1, unitCost: 0 }],
  taxAmount: 0,
  additionalCosts: [],
  expectedDeliveryDate: null,
  notes: null,
};

export interface FulfillItemInput {
  partId?: number | null;
  partName?: string;
  quantityFulfilled: number;
  unitCost?: number;
}

interface ListResponse {
  success: boolean;
  total: number;
  data: PurchaseOrderListItem[];
}

interface SingleResponse {
  success: boolean;
  message?: string;
  data: PurchaseOrderListItem;
}

interface ActionResponse {
  success: boolean;
  message: string;
}

export interface PurchaseOrderListParams {
  status?: PurchaseOrderStatus;
  vendor?: string;
  search?: string;
}

// ── Slice ─────────────────────────────────────────────────────────────────────

export const purchaseOrderApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAllPurchaseOrders: builder.query<ListResponse, PurchaseOrderListParams | void>({
      query: (params) => ({
        url: "get-all-purchase-orders",
        method: "GET",
        params: params ?? undefined,
        credentials: "include" as const,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map((po) => ({ type: "PurchaseOrder" as const, id: po.id })),
              { type: "PurchaseOrder" as const, id: "LIST" },
            ]
          : [{ type: "PurchaseOrder" as const, id: "LIST" }],
    }),

    getPurchaseOrderById: builder.query<PurchaseOrderListItem, number>({
      query: (id) => ({
        url: `get-purchase-order/${id}`,
        method: "GET",
        credentials: "include" as const,
      }),
      transformResponse: (res: SingleResponse) => res.data,
      providesTags: (_result, _err, id) => [{ type: "PurchaseOrder", id }],
    }),

    createPurchaseOrder: builder.mutation<SingleResponse, PurchaseOrderFormInput>({
      query: (body) => ({
        url: "create-purchase-order",
        method: "POST",
        body,
        credentials: "include" as const,
      }),
      invalidatesTags: [{ type: "PurchaseOrder", id: "LIST" }],
    }),

    orderPartDirectly: builder.mutation<SingleResponse, { partId: number; quantity: number }>({
      query: ({ partId, quantity }) => ({
        url: `order-part/${partId}`,
        method: "POST",
        body: { quantity },
        credentials: "include" as const,
      }),
      invalidatesTags: [{ type: "PurchaseOrder", id: "LIST" }],
    }),

    updatePurchaseOrder: builder.mutation<
      SingleResponse,
      { id: number; data: Partial<PurchaseOrderFormInput> }
    >({
      query: ({ id, data }) => ({
        url: `update-purchase-order/${id}`,
        method: "PUT",
        body: data,
        credentials: "include" as const,
      }),
      invalidatesTags: (_result, _err, { id }) => [
        { type: "PurchaseOrder", id },
        { type: "PurchaseOrder", id: "LIST" },
      ],
    }),

    deletePurchaseOrder: builder.mutation<ActionResponse, number>({
      query: (id) => ({
        url: `delete-purchase-order/${id}`,
        method: "DELETE",
        credentials: "include" as const,
      }),
      invalidatesTags: (_result, _err, id) => [
        { type: "PurchaseOrder", id },
        { type: "PurchaseOrder", id: "LIST" },
      ],
    }),

    approvePurchaseOrder: builder.mutation<SingleResponse, number>({
      query: (id) => ({
        url: `approve/${id}`,
        method: "PATCH",
        credentials: "include" as const,
      }),
      invalidatesTags: (_result, _err, id) => [
        { type: "PurchaseOrder", id },
        { type: "PurchaseOrder", id: "LIST" },
      ],
    }),

    declinePurchaseOrder: builder.mutation<SingleResponse, { id: number; reason?: string }>({
      query: ({ id, reason }) => ({
        url: `decline/${id}`,
        method: "PATCH",
        body: { reason },
        credentials: "include" as const,
      }),
      invalidatesTags: (_result, _err, { id }) => [
        { type: "PurchaseOrder", id },
        { type: "PurchaseOrder", id: "LIST" },
      ],
    }),

    markPurchaseOrderAsOrdered: builder.mutation<SingleResponse, number>({
      query: (id) => ({
        url: `mark-ordered/${id}`,
        method: "PATCH",
        credentials: "include" as const,
      }),
      invalidatesTags: (_result, _err, id) => [
        { type: "PurchaseOrder", id },
        { type: "PurchaseOrder", id: "LIST" },
      ],
    }),

    cancelPurchaseOrder: builder.mutation<SingleResponse, number>({
      query: (id) => ({
        url: `cancel/${id}`,
        method: "PATCH",
        credentials: "include" as const,
      }),
      invalidatesTags: (_result, _err, id) => [
        { type: "PurchaseOrder", id },
        { type: "PurchaseOrder", id: "LIST" },
      ],
    }),

    fulfillPurchaseOrderItems: builder.mutation<
      SingleResponse,
      { id: number; items: FulfillItemInput[] }
    >({
      query: ({ id, items }) => ({
        url: `fulfill-items/${id}`,
        method: "PATCH",
        body: { items },
        credentials: "include" as const,
      }),
      invalidatesTags: (_result, _err, { id }) => [
        { type: "PurchaseOrder", id },
        { type: "PurchaseOrder", id: "LIST" },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetAllPurchaseOrdersQuery,
  useGetPurchaseOrderByIdQuery,
  useCreatePurchaseOrderMutation,
  useOrderPartDirectlyMutation,
  useUpdatePurchaseOrderMutation,
  useDeletePurchaseOrderMutation,
  useApprovePurchaseOrderMutation,
  useDeclinePurchaseOrderMutation,
  useMarkPurchaseOrderAsOrderedMutation,
  useCancelPurchaseOrderMutation,
  useFulfillPurchaseOrderItemsMutation,
} = purchaseOrderApi;