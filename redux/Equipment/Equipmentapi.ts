import { apiSlice } from "../api/apiSlice";
import { Equipment, EquipmentFormInput } from "@/types/equipment";

interface ListResponse {
  success: boolean;
  total: number;
  data: Equipment[];
}

interface SingleResponse {
  success: boolean;
  message?: string;
  data: Equipment;
}

interface DeleteResponse {
  success: boolean;
  message: string;
}

export const equipmentApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAllEquipment: builder.query<ListResponse, void>({
      query: () => ({
        url: "get-all-equipment",
        method: "GET",
        credentials: "include" as const,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map((e) => ({ type: "Equipment" as const, id: e.id })),
              { type: "Equipment" as const, id: "LIST" },
            ]
          : [{ type: "Equipment" as const, id: "LIST" }],
    }),

    getEquipmentById: builder.query<Equipment, number>({
      query: (id) => ({
        url: `get-equipment/${id}`,
        method: "GET",
        credentials: "include" as const,
      }),
      transformResponse: (res: SingleResponse) => res.data,
      providesTags: (_result, _err, id) => [{ type: "Equipment", id }],
    }),

    createEquipment: builder.mutation<SingleResponse, EquipmentFormInput>({
      query: (body) => ({
        url: "create-equipment",
        method: "POST",
        body,
        credentials: "include" as const,
      }),
      invalidatesTags: [{ type: "Equipment", id: "LIST" }],
    }),

    updateEquipment: builder.mutation<
      SingleResponse,
      { id: number; data: Partial<EquipmentFormInput> }
    >({
      query: ({ id, data }) => ({
        url: `update-equipment/${id}`,
        method: "PUT",
        body: data,
        credentials: "include" as const,
      }),
      invalidatesTags: (_result, _err, { id }) => [
        { type: "Equipment", id },
        { type: "Equipment", id: "LIST" },
      ],
    }),

    deleteEquipment: builder.mutation<DeleteResponse, number>({
      query: (id) => ({
        url: `delete-equipment/${id}`,
        method: "DELETE",
        credentials: "include" as const,
      }),
      invalidatesTags: (_result, _err, id) => [
        { type: "Equipment", id },
        { type: "Equipment", id: "LIST" },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetAllEquipmentQuery,
  useGetEquipmentByIdQuery,
  useCreateEquipmentMutation,
  useUpdateEquipmentMutation,
  useDeleteEquipmentMutation,
} = equipmentApi;