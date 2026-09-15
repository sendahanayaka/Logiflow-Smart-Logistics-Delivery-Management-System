import { configureStore } from '@reduxjs/toolkit'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from 'react-redux'
import { RouterProvider, createMemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { api } from '../../src/app/api'
import { appRoutes } from '../../src/app/router'
import authReducer from '../../src/features/auth/authSlice'
import { USER_ROLES } from '../../src/features/auth/roles'

const mocks = vi.hoisted(() => ({
  getUsers: vi.fn(),
  getUser: vi.fn(),
  changeRole: vi.fn(),
  changeStatus: vi.fn(),
  deactivate: vi.fn(),
  updateUser: vi.fn(),
}))

vi.mock('../../src/features/users/usersApi', () => ({
  useGetUsersQuery: mocks.getUsers,
  useGetUserQuery: mocks.getUser,
  useChangeUserRoleMutation: () => [mocks.changeRole, { isLoading: false }],
  useChangeUserStatusMutation: () => [
    mocks.changeStatus,
    { isLoading: false },
  ],
  useDeactivateUserMutation: () => [mocks.deactivate, { isLoading: false }],
  useUpdateUserMutation: () => [
    mocks.updateUser,
    { isLoading: false, error: null },
  ],
  getUsersErrorMessage: (_error, fallback) => fallback,
}))

const roleCases = [
  [
    USER_ROLES.CUSTOMER,
    'Customer',
    'Manage your delivery requests and track your shipments.',
    'My Orders',
  ],
  [
    USER_ROLES.DRIVER,
    'Driver',
    'View your assigned delivery work and duty information.',
    'My Deliveries',
  ],
  [
    USER_ROLES.WAREHOUSE_STAFF,
    'Warehouse Staff',
    'Manage package intake and dispatch preparation.',
    'Package Intake',
  ],
  [
    USER_ROLES.OPERATIONS_MANAGER,
    'Operations Manager',
    'Monitor operations and manage platform users.',
    'Approvals',
  ],
]

const managedUser = {
  id: 'user-2',
  fullName: 'Alex Driver',
  email: 'alex@example.com',
  phoneNumber: '+94770000000',
  role: USER_ROLES.DRIVER,
  status: 'Active',
  createdAt: '2026-08-19T08:00:00Z',
  updatedAt: '2026-08-20T08:00:00Z',
}

const NativeRequest = globalThis.Request

function createAuthState(role, status = 'authenticated') {
  return {
    accessToken: status === 'authenticated' ? 'access-token' : null,
    expiresAt: status === 'authenticated' ? '2099-01-01T00:00:00Z' : null,
    user:
      status === 'authenticated'
        ? {
            id: 'current-user',
            fullName: `${role} User`,
            email: 'current@example.com',
            role,
            status: 'Active',
          }
        : null,
    status,
  }
}

function renderRoute(path, authState) {
  const store = configureStore({
    reducer: {
      auth: authReducer,
      [api.reducerPath]: api.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(api.middleware),
    preloadedState: { auth: authState },
  })
  const router = createMemoryRouter(appRoutes, { initialEntries: [path] })

  render(
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>,
  )

  return { router, store }
}

describe('authenticated app routes', () => {
  beforeEach(() => {
    mocks.getUsers.mockReset()
    mocks.getUser.mockReset()
    mocks.getUsers.mockReturnValue({
      data: { items: [], page: 1, pageSize: 20, totalCount: 0, totalPages: 0 },
      isLoading: false,
      isFetching: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    })
    mocks.getUser.mockReturnValue({
      data: managedUser,
      isLoading: false,
      isError: false,
      error: null,
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it.each(roleCases)(
    'renders /app and role navigation for %s',
    (role, roleLabel, description, futureItem) => {
      renderRoute('/app', createAuthState(role))

      expect(
        screen.getByRole('heading', { name: `Welcome, ${role} User` }),
      ).toBeInTheDocument()
      expect(screen.getByText(description)).toBeInTheDocument()
      expect(screen.getAllByText(roleLabel).length).toBeGreaterThan(0)
      expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute(
        'href',
        '/app',
      )
      expect(screen.getByText(futureItem).closest('a')).toBeNull()
      expect(screen.getByText(futureItem)).toHaveAttribute(
        'aria-disabled',
        'true',
      )
      if (role === USER_ROLES.OPERATIONS_MANAGER) {
        expect(
          screen.getByRole('link', { name: 'User Management' }),
        ).toBeInTheDocument()
      } else {
        expect(
          screen.queryByRole('link', { name: 'User Management' }),
        ).toBeNull()
      }
    },
  )

  it('redirects unauthenticated /app access to login', () => {
    const { router } = renderRoute(
      '/app',
      createAuthState(USER_ROLES.CUSTOMER, 'unauthenticated'),
    )

    expect(
      screen.getByRole('heading', { name: 'Sign in to LogiFlow' }),
    ).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/login')
  })

  it('shows initialization loading before deciding access', () => {
    renderRoute(
      '/app',
      createAuthState(USER_ROLES.CUSTOMER, 'initializing'),
    )

    expect(screen.getByText('Restoring your session')).toBeInTheDocument()
  })

  it('lets Operations Managers open user management inside MainLayout', () => {
    renderRoute('/users', createAuthState(USER_ROLES.OPERATIONS_MANAGER))

    expect(
      screen.getByRole('heading', { name: 'User Management' }),
    ).toBeInTheDocument()
    expect(screen.getByText('LogiFlow App')).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'User Management' }),
    ).toHaveAttribute('href', '/users')
    expect(mocks.getUsers).toHaveBeenCalledOnce()
  })

  it.each([
    USER_ROLES.CUSTOMER,
    USER_ROLES.DRIVER,
    USER_ROLES.WAREHOUSE_STAFF,
  ])('redirects %s away from user management', (role) => {
    const { router } = renderRoute('/users', createAuthState(role))

    expect(
      screen.getByRole('heading', {
        name: 'You do not have permission to view this page.',
      }),
    ).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/unauthorized')
    expect(mocks.getUsers).not.toHaveBeenCalled()
  })

  it('navigates through existing user details and edit pages', async () => {
    const user = userEvent.setup()
    renderRoute(
      `/users/${managedUser.id}`,
      createAuthState(USER_ROLES.OPERATIONS_MANAGER),
    )

    expect(
      screen.getByRole('heading', { level: 1, name: managedUser.fullName }),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('link', { name: 'Edit user' }))

    expect(
      await screen.findByRole('heading', {
        name: `Edit ${managedUser.fullName}`,
      }),
    ).toBeInTheDocument()
  })

  it('opens and closes mobile navigation accessibly', async () => {
    const user = userEvent.setup()
    renderRoute('/app', createAuthState(USER_ROLES.CUSTOMER))
    const menuButton = screen.getByRole('button', { name: 'Open navigation' })

    expect(menuButton).toHaveAttribute('aria-expanded', 'false')
    await user.click(menuButton)
    expect(menuButton).toHaveAttribute('aria-expanded', 'true')
    expect(menuButton).toHaveAccessibleName('Close navigation')
    await user.keyboard('{Escape}')
    expect(menuButton).toHaveAttribute('aria-expanded', 'false')
  })

  it('logs out from MainLayout and returns to the landing page', async () => {
    const user = userEvent.setup()
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
    const fetchMock = vi.fn(async () => new Response(null, { status: 204 }))
    vi.stubGlobal('fetch', fetchMock)
    const { store } = renderRoute(
      '/app',
      createAuthState(USER_ROLES.CUSTOMER),
    )

    await user.click(screen.getByRole('button', { name: 'Sign Out' }))

    expect(
      await screen.findByRole('heading', { name: /smarter logistics/i }),
    ).toBeInTheDocument()
    await waitFor(() => {
      expect(store.getState().auth.status).toBe('unauthenticated')
    })
    expect(fetchMock).toHaveBeenCalledOnce()
  })

  it('offers authenticated users an Open App action on the landing page', async () => {
    const user = userEvent.setup()
    const { router } = renderRoute(
      '/',
      createAuthState(USER_ROLES.CUSTOMER),
    )

    await user.click(screen.getByRole('link', { name: 'Open App' }))

    expect(router.state.location.pathname).toBe('/app')
    expect(
      screen.getByRole('heading', { name: 'Welcome, Customer User' }),
    ).toBeInTheDocument()
  })
})
