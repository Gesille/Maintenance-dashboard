import { apiSlice } from "../api/apiSlice";
import { Vendor, VendorFormInput } from "@/types/vendor";

interface ListResponse {
  success: boolean;
  total: number;
  data: Vendor[];
}
interface SingleResponse {
  success: boolean;
  message?: string;
  data: Vendor;
}
interface DeleteResponse {
  success: boolean;
  message: string;
}

export const vendorApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAllVendors: builder.query<ListResponse, void>({
      query: () => ({ url: "get-all-vendors", method: "GET", credentials: "include" as const }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map((v) => ({ type: "Vendor" as const, id: v.id })),
              { type: "Vendor" as const, id: "LIST" },
            ]
          : [{ type: "Vendor" as const, id: "LIST" }],
    }),
    createVendor: builder.mutation<SingleResponse, VendorFormInput>({
      query: (body) => ({ url: "create-vendor", method: "POST", body, credentials: "include" as const }),
      invalidatesTags: [{ type: "Vendor", id: "LIST" }],
    }),
    updateVendor: builder.mutation<SingleResponse, { id: number; data: Partial<VendorFormInput> }>({
      query: ({ id, data }) => ({
        url: `update-vendor/${id}`,
        method: "PUT",
        body: data,
        credentials: "include" as const,
      }),
      invalidatesTags: (_r, _e, { id }) => [{ type: "Vendor", id }, { type: "Vendor", id: "LIST" }],
    }),
    deleteVendor: builder.mutation<DeleteResponse, number>({
      query: (id) => ({ url: `delete-vendor/${id}`, method: "DELETE", credentials: "include" as const }),
      invalidatesTags: (_r, _e, id) => [{ type: "Vendor", id }, { type: "Vendor", id: "LIST" }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetAllVendorsQuery,
  useCreateVendorMutation,
  useUpdateVendorMutation,
  useDeleteVendorMutation,
} = vendorApi;