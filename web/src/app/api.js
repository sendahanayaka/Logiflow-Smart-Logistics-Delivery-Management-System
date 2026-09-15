import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import {
  clearCredentials,
  setCredentials,
} from '../features/auth/authSlice'

const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim()
const baseUrl = configuredBaseUrl
  ? configuredBaseUrl.replace(/\/$/, '')
  : '/api'

const authEndpointsWithoutRetry = new Set([
  'auth/login',
  'auth/register',
  'auth/refresh',
  'auth/logout',
])

const rawBaseQuery = fetchBaseQuery({
  baseUrl,
  credentials: 'include',
  prepareHeaders: (headers, { getState }) => {
    const accessToken = getState().auth.accessToken

    if (accessToken) {
      headers.set('authorization', `Bearer ${accessToken}`)
    }

    headers.set('accept', 'application/json')
    return headers
  },
})

let refreshPromise = null

function getRequestPath(args) {
  const url = typeof args === 'string' ? args : args.url
  return url
    .replace(/^https?:\/\/[^/]+/i, '')
    .split('?')[0]
    .replace(/^\/+/, '')
    .replace(/^api\//, '')
    .replace(/\/$/, '')
}

function shouldAttemptRefresh(args) {
  return !authEndpointsWithoutRetry.has(getRequestPath(args))
}

export async function baseQueryWithReauth(args, apiContext, extraOptions) {
  const tokenUsed = apiContext.getState().auth.accessToken
  let result = await rawBaseQuery(args, apiContext, extraOptions)

  if (result.error?.status !== 401 || !shouldAttemptRefresh(args)) {
    return result
  }

  const currentToken = apiContext.getState().auth.accessToken

  if (currentToken && currentToken !== tokenUsed) {
    return rawBaseQuery(args, apiContext, extraOptions)
  }

  if (!refreshPromise) {
    refreshPromise = rawBaseQuery(
      { url: 'auth/refresh', method: 'POST' },
      apiContext,
      extraOptions,
    )
      .then((refreshResult) => {
        if (refreshResult.data) {
          apiContext.dispatch(setCredentials(refreshResult.data))
        } else {
          apiContext.dispatch(clearCredentials())
        }

        return refreshResult
      })
      .finally(() => {
        refreshPromise = null
      })
  }

  const refreshResult = await refreshPromise

  if (refreshResult.data) {
    result = await rawBaseQuery(args, apiContext, extraOptions)
  }

  return result
}

export const api = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Auth', 'Users'],
  endpoints: () => ({}),
})
