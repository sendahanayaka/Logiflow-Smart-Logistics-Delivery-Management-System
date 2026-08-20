import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim()
const baseUrl = configuredBaseUrl
  ? configuredBaseUrl.replace(/\/$/, '')
  : '/api'

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl,
    prepareHeaders: (headers, { getState }) => {
      const accessToken = getState().auth.accessToken

      if (accessToken) {
        headers.set('authorization', `Bearer ${accessToken}`)
      }

      headers.set('accept', 'application/json')
      return headers
    },
  }),
  tagTypes: ['Auth', 'Users'],
  endpoints: () => ({}),
})
