import { apiSlice } from "../api/apiSlice";

export interface ManagedUser {
  _id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  isVerified: boolean;
  createdAt: string;
}

interface GetAllUsersResponse {
  success: boolean;
  users: ManagedUser[];
}

export const userApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    updateAvatar: builder.mutation({
      query: (avatar) => ({
        url: "update-user-avatar",
        method: "PUT",
        body: { avatar },
        credentials: "include" as const,
      }),
    }),
    editeProfile: builder.mutation({
      query: ({ name }) => ({
        url: "update-user-info",
        method: "PUT",
        body: { name },
        credentials: "include" as const,
      }),
    }),
    updatePassword: builder.mutation({
      query: ({ oldPassword, newPassword }) => ({
        url: "update-user-pass",
        method: "PUT",
        body: { oldPassword, newPassword },
        credentials: "include" as const,
      }),
    }),

    getAllUsers: builder.query<GetAllUsersResponse, void>({
      query: () => ({
        url: "get-users",
        method: "GET",
        credentials: "include" as const,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.users.map((u) => ({ type: "Users" as const, id: u._id })),
              { type: "Users" as const, id: "LIST" },
            ]
          : [{ type: "Users" as const, id: "LIST" }],
    }),

    createUser: builder.mutation<
      { success: boolean; message: string; user: ManagedUser },
      { name: string; email: string; password: string; role: string; phone?: string }
    >({
      query: (data) => ({
        url: "create-user",
        method: "POST",
        body: data,
        credentials: "include" as const,
      }),
      invalidatesTags: [{ type: "Users", id: "LIST" }],
    }),

    // ← fixed: now sends `id` (what the backend actually reads), not `email`
    updateUserRole: builder.mutation<
      { success: boolean; user: ManagedUser },
      { id: string; role: string }
    >({
      query: ({ id, role }) => ({
        url: "update-user",
        method: "PUT",
        body: { id, role },
        credentials: "include" as const,
      }),
      invalidatesTags: (_result, _err, { id }) => [
        { type: "Users", id },
        { type: "Users", id: "LIST" },
      ],
    }),

    deleteUser: builder.mutation<{ success: boolean; message: string }, string>({
      query: (id) => ({
        url: `delete-user/${id}`,
        method: "DELETE",
        credentials: "include" as const,
      }),
      invalidatesTags: (_result, _err, id) => [
        { type: "Users", id },
        { type: "Users", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useUpdateAvatarMutation,
  useEditeProfileMutation,
  useUpdatePasswordMutation,
  useGetAllUsersQuery,
  useCreateUserMutation,
  useUpdateUserRoleMutation,
  useDeleteUserMutation,
} = userApi;