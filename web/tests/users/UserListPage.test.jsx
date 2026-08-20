import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import UserListPage from '../../src/features/users/pages/UserListPage'

const mocks = vi.hoisted(() => ({
  useGetUsersQuery: vi.fn(),
  changeRole: vi.fn(),
  changeStatus: vi.fn(),
  deactivate: vi.fn(),
  refetch: vi.fn(),
}))

vi.mock('../../src/shared/hooks/useAuth', () => ({
  default: () => ({
    user: { id: 'manager-1', role: 'OperationsManager' },
  }),
}))

vi.mock('../../src/features/users/usersApi', () => ({
  useGetUsersQuery: mocks.useGetUsersQuery,
  useChangeUserRoleMutation: () => [
    mocks.changeRole,
    { isLoading: false },
  ],
  useChangeUserStatusMutation: () => [
    mocks.changeStatus,
    { isLoading: false },
  ],
  useDeactivateUserMutation: () => [
    mocks.deactivate,
    { isLoading: false },
  ],
  getUsersErrorMessage: (error, fallback) =>
    error?.data?.message ?? error?.data?.title ?? fallback,
}))

const sampleUser = {
  id: 'user-1',
  fullName: 'Alex Driver',
  email: 'alex@example.com',
  phoneNumber: '+94770000000',
  role: 'Driver',
  status: 'Active',
  createdAt: '2026-08-19T08:00:00Z',
}

function queryResult(overrides = {}) {
  return {
    data: {
      items: [sampleUser],
      page: 1,
      pageSize: 20,
      totalCount: 1,
      totalPages: 1,
    },
    isLoading: false,
    isFetching: false,
    isError: false,
    error: null,
    refetch: mocks.refetch,
    ...overrides,
  }
}

function renderPage() {
  return render(
    <MemoryRouter>
      <UserListPage />
    </MemoryRouter>,
  )
}

describe('UserListPage', () => {
  beforeEach(() => {
    mocks.useGetUsersQuery.mockReset()
    mocks.refetch.mockReset()
    mocks.useGetUsersQuery.mockReturnValue(queryResult())
  })

  it('renders users returned by the API', () => {
    renderPage()

    expect(screen.getByRole('heading', { name: 'User Management' })).toBeInTheDocument()
    const row = screen.getByText('Alex Driver').closest('tr')
    expect(row).not.toBeNull()
    expect(within(row).getByText('alex@example.com')).toBeInTheDocument()
    expect(within(row).getByText('Driver')).toBeInTheDocument()
    expect(within(row).getByText('Active')).toBeInTheDocument()
  })

  it('shows the loading state', () => {
    mocks.useGetUsersQuery.mockReturnValue(
      queryResult({ data: undefined, isLoading: true, isFetching: true }),
    )

    renderPage()

    expect(screen.getByText('Loading records')).toBeInTheDocument()
  })

  it('shows the empty state', () => {
    mocks.useGetUsersQuery.mockReturnValue(
      queryResult({
        data: {
          items: [],
          page: 1,
          pageSize: 20,
          totalCount: 0,
          totalPages: 0,
        },
      }),
    )

    renderPage()

    expect(
      screen.getByText('No users match the current search and filters.'),
    ).toBeInTheDocument()
  })

  it('shows an API error and retry action', async () => {
    const user = userEvent.setup()
    mocks.useGetUsersQuery.mockReturnValue(
      queryResult({
        data: undefined,
        isError: true,
        error: { data: { message: 'Users are unavailable.' } },
      }),
    )

    renderPage()

    expect(screen.getByText('Users are unavailable.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Try again' }))
    expect(mocks.refetch).toHaveBeenCalledOnce()
  })

  it('sends search and filter values to RTK Query', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.type(
      screen.getByLabelText('Search users by name or email'),
      'alex',
    )
    await user.selectOptions(screen.getByLabelText('Role'), 'Driver')
    await user.selectOptions(screen.getByLabelText('Status'), 'Suspended')
    await user.selectOptions(screen.getByLabelText('Sort users by'), 'Email')
    await user.selectOptions(screen.getByLabelText('Sort direction'), 'Asc')

    expect(mocks.useGetUsersQuery).toHaveBeenLastCalledWith(
      expect.objectContaining({
        search: 'alex',
        role: 'Driver',
        status: 'Suspended',
        sortBy: 'Email',
        sortDirection: 'Asc',
        page: 1,
      }),
    )
  })

  it('requests the selected pagination page', async () => {
    const user = userEvent.setup()
    mocks.useGetUsersQuery.mockReturnValue(
      queryResult({
        data: {
          items: [sampleUser],
          page: 1,
          pageSize: 20,
          totalCount: 45,
          totalPages: 3,
        },
      }),
    )
    renderPage()

    await user.click(screen.getByRole('button', { name: 'Next page' }))

    expect(mocks.useGetUsersQuery).toHaveBeenLastCalledWith(
      expect.objectContaining({ page: 2, pageSize: 20 }),
    )
  })
})
