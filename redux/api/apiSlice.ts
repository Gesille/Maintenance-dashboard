
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { userLoggedIn } from "../auth/authSlice";

export const apiSlice = createApi({
  reducerPath: "api",
  tagTypes: ["MaintenanceRequests"], 
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_SERVER_URL,
    
    credentials: "include", 
     
    prepareHeaders: (headers, { getState }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const token = (getState() as any).auth.token;
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  endpoints: (builder) => ({

    refreshToken: builder.query({
      query: () => ({
        url: "refresh",
        method: "GET",
      }),
      async onQueryStarted(_arg, { queryFulfilled, dispatch }) {
        try {
          const result = await queryFulfilled;
          dispatch(
            userLoggedIn({
              accessToken: result.data.accessToken,
              user: result.data.user,
            })
          );
        } catch {
          // No valid refresh token — user is logged out
        }
      },
    }),

    // Load current user (called after refreshToken)
    loadUser: builder.query({
      query: (token) => ({
        url: "me",
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }),
      async onQueryStarted(_arg, { queryFulfilled, dispatch }) {
        try {
          const result = await queryFulfilled;
          dispatch(
            userLoggedIn({
              accessToken: result.data.accessToken,
              user: result.data.user,
            })
          );
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
          console.log("Load user error:", error);
        }
      },
    }),
  }),
});

export const { useRefreshTokenQuery, useLoadUserQuery } = apiSlice;