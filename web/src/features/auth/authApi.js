import { api } from '../../app/api'

export const authApi = api.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation({
      query: ({ email, password }) => ({
        url: 'auth/login',
        method: 'POST',
        body: { email, password },
      }),
      invalidatesTags: ['Auth'],
    }),
    register: builder.mutation({
      query: ({ fullName, email, phoneNumber, password, confirmPassword }) => ({
        url: 'auth/register',
        method: 'POST',
        body: { fullName, email, phoneNumber, password, confirmPassword },
      }),
    }),
    getCurrentUser: builder.query({
      query: () => 'auth/me',
      providesTags: ['Auth'],
    }),
  }),
})

export const {
  useLoginMutation,
  useRegisterMutation,
  useGetCurrentUserQuery,
} = authApi

export function getAuthErrorMessage(error, fallbackMessage) {
  const problem = error?.data

  if (typeof problem === 'string' && problem.trim()) {
    return problem
  }

  if (Array.isArray(problem?.errors) && problem.errors.length > 0) {
    return problem.errors.join(' ')
  }

  if (problem?.errors && typeof problem.errors === 'object') {
    const validationMessages = Object.values(problem.errors).flat()
    if (validationMessages.length > 0) {
      return validationMessages.join(' ')
    }
  }

  if (problem?.title) {
    return problem.title
  }

  if (error?.status === 'FETCH_ERROR') {
    return 'Unable to reach LogiFlow. Check your connection and try again.'
  }

  return fallbackMessage
}
