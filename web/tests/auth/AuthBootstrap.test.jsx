import { configureStore } from '@reduxjs/toolkit'
import { render, screen, waitFor } from '@testing-library/react'
import { Provider } from 'react-redux'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import authReducer from '../../src/features/auth/authSlice'
import AuthBootstrap from '../../src/features/auth/components/AuthBootstrap'

const mocks = vi.hoisted(() => ({
  refresh: vi.fn(),
  useRefreshMutation: vi.fn(),
}))

vi.mock('../../src/features/auth/authApi', () => ({
  useRefreshMutation: mocks.useRefreshMutation,
}))

function renderBootstrap() {
  const store = configureStore({ reducer: { auth: authReducer } })
  render(
    <Provider store={store}>
      <AuthBootstrap>
        <span>Application content</span>
      </AuthBootstrap>
    </Provider>,
  )
  return store
}

describe('AuthBootstrap', () => {
  beforeEach(() => {
    mocks.refresh.mockReset()
    mocks.useRefreshMutation.mockReturnValue([mocks.refresh])
  })

  it('restores authenticated state when startup refresh succeeds', async () => {
    const session = {
      accessToken: 'restored-token',
      expiresAt: '2099-01-01T00:00:00Z',
      user: { id: 'user-1', role: 'Customer' },
    }
    mocks.refresh.mockReturnValue({ unwrap: () => Promise.resolve(session) })

    const store = renderBootstrap()

    expect(screen.getByText('Application content')).toBeInTheDocument()
    await waitFor(() => {
      expect(store.getState().auth).toMatchObject({
        ...session,
        status: 'authenticated',
      })
    })
    expect(mocks.refresh).toHaveBeenCalledOnce()
  })

  it('finishes unauthenticated when startup refresh returns 401', async () => {
    mocks.refresh.mockReturnValue({
      unwrap: () => Promise.reject({ status: 401 }),
    })

    const store = renderBootstrap()

    await waitFor(() => {
      expect(store.getState().auth.status).toBe('unauthenticated')
    })
    expect(store.getState().auth.accessToken).toBeNull()
    expect(mocks.refresh).toHaveBeenCalledOnce()
  })
})
