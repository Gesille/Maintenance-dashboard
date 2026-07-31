import { apiSlice } from "../api/apiSlice";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Category {
  id: number;
  name: string;
  icon: string;
  color: string;
  description: string | null;
  createdByName: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export type CategoryFormInput = Pick<Category, "name" | "icon" | "color" | "description">;

export const EMPTY_CATEGORY_FORM: CategoryFormInput = {
  name: "",
  icon: "Tag",
  color: "#6366F1",
  description: null,
};

interface ListResponse {
  success: boolean;
  total: number;
  data: Category[];
}

interface SingleResponse {
  success: boolean;
  message?: string;
  data: Category;
}

interface DeleteResponse {
  success: boolean;
  message: string;
}

// ── Slice ─────────────────────────────────────────────────────────────────────

export const categoryApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAllCategories: builder.query<ListResponse, { search?: string } | void>({
      query: (params) => ({
        url: "get-all-categories",
        method: "GET",
        params: params?.search ? { search: params.search } : undefined,
        credentials: "include" as const,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map((c) => ({ type: "Category" as const, id: c.id })),
              { type: "Category" as const, id: "LIST" },
            ]
          : [{ type: "Category" as const, id: "LIST" }],
    }),

    getCategoryById: builder.query<Category, number>({
      query: (id) => ({
        url: `get-category/${id}`,
        method: "GET",
        credentials: "include" as const,
      }),
      transformResponse: (res: SingleResponse) => res.data,
      providesTags: (_result, _err, id) => [{ type: "Category", id }],
    }),

    createCategory: builder.mutation<SingleResponse, CategoryFormInput>({
      query: (body) => ({
        url: "create-category",
        method: "POST",
        body,
        credentials: "include" as const,
      }),
      invalidatesTags: [{ type: "Category", id: "LIST" }],
    }),

    updateCategory: builder.mutation<SingleResponse, { id: number; data: Partial<CategoryFormInput> }>({
      query: ({ id, data }) => ({
        url: `update-category/${id}`,
        method: "PUT",
        body: data,
        credentials: "include" as const,
      }),
      invalidatesTags: (_result, _err, { id }) => [
        { type: "Category", id },
        { type: "Category", id: "LIST" },
      ],
    }),

    deleteCategory: builder.mutation<DeleteResponse, number>({
      query: (id) => ({
        url: `delete-category/${id}`,
        method: "DELETE",
        credentials: "include" as const,
      }),
      invalidatesTags: (_result, _err, id) => [
        { type: "Category", id },
        { type: "Category", id: "LIST" },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetAllCategoriesQuery,
  useGetCategoryByIdQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} = categoryApi;