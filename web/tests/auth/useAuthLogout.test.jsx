import { configureStore } from '@reduxjs/toolkit'
import { act, renderHook } from '@testing-library/react'
import { Provider } from 'react-redux'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { api } from '../../src/app/api'
import authReducer, {
  setCredentials,
} from '../../src/features/auth/authSlice'
import useAuth from '../../src/shared/hooks/useAuth'

const NativeRequest = globalThis.Request

function createHarness() {
  vi.stubGlobal(
    'Request',
    class extends NativeRequest {
      constructor(input, options) {
        super(
          typeof input === 'string'
            ? new URL(input, 'http://localhost.test')
            : input,
          options,
        )
      }
    },
  )

  const store = configureStore({
    reducer: {
      auth: authReducer,
      [api.reducerPath]: api.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(api.middleware),
  })
  store.dispatch(
    setCredentials({
      accessToken: 'access-token',
      expiresAt: '2099-01-01T00:00:00Z',
      user: { id: 'user-1', role: 'Customer' },
    }),
  )
  const wrapper = ({ children }) => <Provider store={store}>{children}</Provider>
  return { store, wrapper }
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('useAuth logout', () => {
  it('calls backend logout and clears Redux only after success', async () => {
    const { store, wrapper } = createHarness()
    const fetchMock = vi.fn(async (request) => {
      expect(new URL(request.url).pathname).toBe('/api/auth/logout')
      expect(request.method).toBe('POST')
      expect(request.credentials).toBe('include')
      return new Response(null, { status: 204 })
    })
    vi.stubGlobal('fetch', fetchMock)
    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => result.current.logout())

    expect(fetchMock).toHaveBeenCalledOnce()
    expect(store.getState().auth.status).toBe('unauthenticated')
    expect(store.getState().auth.accessToken).toBeNull()
  })

  it('keeps Redux authenticated when backend logout fails', async () => {
    const { store, wrapper } = createHarness()
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(JSON.stringify({ title: 'Logout unavailable' }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    )
    const { result } = renderHook(() => useAuth(), { wrapper })

    await expect(
      act(async () => result.current.logout()),
    ).rejects.toMatchObject({ status: 503 })

    expect(store.getState().auth.status).toBe('authenticated')
    expect(store.getState().auth.accessToken).toBe('access-token')
  })
})
