import { api } from '../../app/api'

function unwrapResponse(response) {
  return response.data
}

export const usersApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getUsers: builder.query({
      query: ({
        search,
        role,
        status,
        sortBy = 'CreatedAt',
        sortDirection = 'Desc',
        page = 1,
        pageSize = 20,
      } = {}) => ({
        url: 'users',
        params: {
          ...(search ? { search } : {}),
          ...(role ? { role } : {}),
          ...(status ? { status } : {}),
          sortBy,
          sortDirection,
          page,
          pageSize,
        },
      }),
      transformResponse: unwrapResponse,
      providesTags: (result) => [
        { type: 'Users', id: 'LIST' },
        ...(result?.items?.map((user) => ({ type: 'Users', id: user.id })) ?? []),
      ],
    }),
    getUser: builder.query({
      query: (id) => `users/${id}`,
      transformResponse: unwrapResponse,
      providesTags: (_result, _error, id) => [{ type: 'Users', id }],
    }),
    createUser: builder.mutation({
      query: (user) => ({
        url: 'users',
        method: 'POST',
        body: user,
      }),
      transformResponse: unwrapResponse,
      invalidatesTags: [{ type: 'Users', id: 'LIST' }],
    }),
    updateUser: builder.mutation({
      query: ({ id, ...user }) => ({
        url: `users/${id}`,
        method: 'PUT',
        body: user,
      }),
      transformResponse: unwrapResponse,
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Users', id },
        { type: 'Users', id: 'LIST' },
      ],
    }),
    changeUserRole: builder.mutation({
      query: ({ id, role }) => ({
        url: `users/${id}/role`,
        method: 'PATCH',
        body: { role },
      }),
      transformResponse: unwrapResponse,
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Users', id },
        { type: 'Users', id: 'LIST' },
      ],
    }),
    changeUserStatus: builder.mutation({
      query: ({ id, status }) => ({
        url: `users/${id}/status`,
        method: 'PATCH',
        body: { status },
      }),
      transformResponse: unwrapResponse,
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Users', id },
        { type: 'Users', id: 'LIST' },
      ],
    }),
    deactivateUser: builder.mutation({
      query: (id) => ({
        url: `users/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'Users', id },
        { type: 'Users', id: 'LIST' },
      ],
    }),
  }),
})

export const {
  useGetUsersQuery,
  useGetUserQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useChangeUserRoleMutation,
  useChangeUserStatusMutation,
  useDeactivateUserMutation,
} = usersApi

export function getUsersErrorMessage(error, fallbackMessage) {
  const response = error?.data

  if (typeof response === 'string' && response.trim()) return response
  if (response?.message) {
    return Array.isArray(response.errors) && response.errors.length > 0
      ? `${response.message} ${response.errors.join(' ')}`
      : response.message
  }
  if (response?.title) return response.title
  if (error?.status === 'FETCH_ERROR') {
    return 'Unable to reach LogiFlow. Check your connection and try again.'
  }

  return fallbackMessage
}
