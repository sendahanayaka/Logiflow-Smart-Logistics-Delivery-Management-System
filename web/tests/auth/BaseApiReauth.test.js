import { configureStore } from '@reduxjs/toolkit'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { baseQueryWithReauth } from '../../src/app/api'
import authReducer, {
  setCredentials,
} from '../../src/features/auth/authSlice'

const session = {
  accessToken: 'old-access-token',
  expiresAt: '2099-01-01T00:00:00Z',
  user: { id: 'user-1', role: 'Customer' },
}

const refreshedSession = {
  ...session,
  accessToken: 'new-access-token',
}

const NativeRequest = globalThis.Request

function supportRelativeRequests() {
  vi.stubGlobal(
    'Request',
    class extends NativeRequest {
      constructor(input, options) {
        const resolvedInput =
          typeof input === 'string'
            ? new URL(input, 'http://localhost.test')
            : input
        super(resolvedInput, options)
      }
    },
  )
}

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function createContext() {
  supportRelativeRequests()
  const store = configureStore({ reducer: { auth: authReducer } })
  store.dispatch(setCredentials(session))

  return {
    store,
    context: {
      signal: new AbortController().signal,
      dispatch: store.dispatch,
      getState: store.getState,
      extra: undefined,
      endpoint: 'test',
      type: 'query',
      forced: false,
    },
  }
}

function requestPath(request) {
  return new URL(request.url, 'http://localhost').pathname
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('baseQueryWithReauth', () => {
  it('includes credentials and the Redux access token centrally', async () => {
    const { context } = createContext()
    const fetchMock = vi.fn(async (request) => {
      expect(request.credentials).toBe('include')
      expect(request.headers.get('authorization')).toBe(
        'Bearer old-access-token',
      )
      return jsonResponse({ ok: true })
    })
    vi.stubGlobal('fetch', fetchMock)

    await baseQueryWithReauth('users', context, {})

    expect(fetchMock).toHaveBeenCalledOnce()
  })

  it('refreshes after 401 and retries the request once with the new token', async () => {
    const { context, store } = createContext()
    let userRequests = 0
    const fetchMock = vi.fn(async (request) => {
      const path = requestPath(request)
      if (path.endsWith('/auth/refresh')) {
        return jsonResponse(refreshedSession)
      }

      userRequests += 1
      if (userRequests === 1) return jsonResponse({ title: 'Unauthorized' }, 401)
      expect(request.headers.get('authorization')).toBe(
        'Bearer new-access-token',
      )
      return jsonResponse({ items: [] })
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await baseQueryWithReauth('users', context, {})

    expect(result.data).toEqual({ items: [] })
    expect(userRequests).toBe(2)
    expect(store.getState().auth.accessToken).toBe('new-access-token')
  })

  it('clears auth after failed refresh without retrying indefinitely', async () => {
    const { context, store } = createContext()
    const fetchMock = vi.fn(async (request) =>
      requestPath(request).endsWith('/auth/refresh')
        ? jsonResponse({ title: 'Invalid refresh session' }, 401)
        : jsonResponse({ title: 'Unauthorized' }, 401),
    )
    vi.stubGlobal('fetch', fetchMock)

    const result = await baseQueryWithReauth('users', context, {})

    expect(result.error.status).toBe(401)
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(store.getState().auth.status).toBe('unauthenticated')
  })

  it('uses one refresh request for simultaneous 401 responses', async () => {
    const { context } = createContext()
    let releaseRefresh
    const refreshResponse = new Promise((resolve) => {
      releaseRefresh = () => resolve(jsonResponse(refreshedSession))
    })
    let refreshRequests = 0
    let originalRequests = 0
    const fetchMock = vi.fn(async (request) => {
      if (requestPath(request).endsWith('/auth/refresh')) {
        refreshRequests += 1
        return refreshResponse
      }

      originalRequests += 1
      return originalRequests <= 2
        ? jsonResponse({ title: 'Unauthorized' }, 401)
        : jsonResponse({ ok: true })
    })
    vi.stubGlobal('fetch', fetchMock)

    const requests = Promise.all([
      baseQueryWithReauth('users?page=1', context, {}),
      baseQueryWithReauth('users?page=2', context, {}),
    ])
    await vi.waitFor(() => expect(refreshRequests).toBe(1))
    releaseRefresh()
    const results = await requests

    expect(refreshRequests).toBe(1)
    expect(results.every((result) => result.data?.ok)).toBe(true)
  })

  it.each(['auth/login', 'auth/register', 'auth/refresh', 'auth/logout'])(
    'does not recursively refresh %s',
    async (path) => {
      const { context } = createContext()
      const fetchMock = vi.fn(async () =>
        jsonResponse({ title: 'Unauthorized' }, 401),
      )
      vi.stubGlobal('fetch', fetchMock)

      await baseQueryWithReauth({ url: path, method: 'POST' }, context, {})

      expect(fetchMock).toHaveBeenCalledOnce()
    },
  )
})
