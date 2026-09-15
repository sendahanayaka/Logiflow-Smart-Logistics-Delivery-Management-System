import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ProtectedRoute from '../../src/features/auth/components/ProtectedRoute'

const mocks = vi.hoisted(() => ({ useAuth: vi.fn() }))

vi.mock('../../src/shared/hooks/useAuth', () => ({
  default: mocks.useAuth,
}))

function renderProtectedRoute() {
  return render(
    <MemoryRouter initialEntries={['/users']}>
      <Routes>
        <Route path="/login" element={<h1>Login page</h1>} />
        <Route path="/unauthorized" element={<h1>Unauthorized page</h1>} />
        <Route
          element={<ProtectedRoute allowedRoles={['OperationsManager']} />}
        >
          <Route path="/users" element={<h1>User Management</h1>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

describe('ProtectedRoute', () => {
  beforeEach(() => mocks.useAuth.mockReset())

  it('waits for session initialization before redirecting', () => {
    mocks.useAuth.mockReturnValue({
      isAuthenticated: false,
      isInitializing: true,
      user: null,
    })

    renderProtectedRoute()

    expect(screen.getByText('Restoring your session')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Login page' })).toBeNull()
  })

  it('redirects an unauthenticated visitor to login', () => {
    mocks.useAuth.mockReturnValue({
      isAuthenticated: false,
      isInitializing: false,
      user: null,
    })

    renderProtectedRoute()

    expect(screen.getByRole('heading', { name: 'Login page' })).toBeInTheDocument()
  })

  it('redirects an authenticated user without the role to unauthorized', () => {
    mocks.useAuth.mockReturnValue({
      isAuthenticated: true,
      user: { role: 'Customer' },
    })

    renderProtectedRoute()

    expect(
      screen.getByRole('heading', { name: 'Unauthorized page' }),
    ).toBeInTheDocument()
  })

  it('renders the protected page for an OperationsManager', () => {
    mocks.useAuth.mockReturnValue({
      isAuthenticated: true,
      user: { role: 'OperationsManager' },
    })

    renderProtectedRoute()

    expect(
      screen.getByRole('heading', { name: 'User Management' }),
    ).toBeInTheDocument()
  })
})
