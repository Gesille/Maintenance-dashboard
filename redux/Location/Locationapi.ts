// redux/Location/Locationapi.ts
import { apiSlice } from "../api/apiSlice";
import { Location } from "@/types/location";

interface ListResponse {
  success: boolean;
  total: number;
  data: Location[];
}
interface SingleResponse {
  success: boolean;
  message?: string;
  data: Location;
}
interface DeleteResponse {
  success: boolean;
  message: string;
}

export const locationApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAllLocations: builder.query<ListResponse, void>({
      query: () => ({ url: "get-all-locations", method: "GET", credentials: "include" as const }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map((l) => ({ type: "Location" as const, id: l.id })),
              { type: "Location" as const, id: "LIST" },
            ]
          : [{ type: "Location" as const, id: "LIST" }],
    }),
    createLocation: builder.mutation<SingleResponse, { name: string }>({
      query: (body) => ({ url: "create-location", method: "POST", body, credentials: "include" as const }),
      invalidatesTags: [{ type: "Location", id: "LIST" }],
    }),
    updateLocation: builder.mutation<SingleResponse, { id: number; name: string }>({
      query: ({ id, name }) => ({
        url: `update-location/${id}`,
        method: "PUT",
        body: { name },
        credentials: "include" as const,
      }),
      invalidatesTags: (_r, _e, { id }) => [{ type: "Location", id }, { type: "Location", id: "LIST" }],
    }),
    deleteLocation: builder.mutation<DeleteResponse, number>({
      query: (id) => ({ url: `delete-location/${id}`, method: "DELETE", credentials: "include" as const }),
      invalidatesTags: (_r, _e, id) => [{ type: "Location", id }, { type: "Location", id: "LIST" }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetAllLocationsQuery,
  useCreateLocationMutation,
  useUpdateLocationMutation,
  useDeleteLocationMutation,
} = locationApi;