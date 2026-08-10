// redux/Restaurant/Restaurantapi.ts
import { apiSlice } from "../api/apiSlice";
import { Restaurant } from "@/types/restaurant";

interface ListResponse {
  success: boolean;
  total: number;
  data: Restaurant[];
}
interface SingleResponse {
  success: boolean;
  message?: string;
  data: Restaurant;
}
interface DeleteResponse {
  success: boolean;
  message: string;
}

export const restaurantApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAllRestaurants: builder.query<ListResponse, void>({
      query: () => ({ url: "get-all-restaurants", method: "GET", credentials: "include" as const }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map((r) => ({ type: "Restaurant" as const, id: r.id })),
              { type: "Restaurant" as const, id: "LIST" },
            ]
          : [{ type: "Restaurant" as const, id: "LIST" }],
    }),
    createRestaurant: builder.mutation<SingleResponse, { name: string }>({
      query: (body) => ({ url: "create-restaurant", method: "POST", body, credentials: "include" as const }),
      invalidatesTags: [{ type: "Restaurant", id: "LIST" }],
    }),
    updateRestaurant: builder.mutation<SingleResponse, { id: number; name: string }>({
      query: ({ id, name }) => ({
        url: `update-restaurant/${id}`,
        method: "PUT",
        body: { name },
        credentials: "include" as const,
      }),
      invalidatesTags: (_r, _e, { id }) => [{ type: "Restaurant", id }, { type: "Restaurant", id: "LIST" }],
    }),
    deleteRestaurant: builder.mutation<DeleteResponse, number>({
      query: (id) => ({ url: `delete-restaurant/${id}`, method: "DELETE", credentials: "include" as const }),
      invalidatesTags: (_r, _e, id) => [{ type: "Restaurant", id }, { type: "Restaurant", id: "LIST" }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetAllRestaurantsQuery,
  useCreateRestaurantMutation,
  useUpdateRestaurantMutation,
  useDeleteRestaurantMutation,
} = restaurantApi;