import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import LoginPage from '../../src/features/auth/pages/LoginPage'

const mocks = vi.hoisted(() => ({
  login: vi.fn(),
  signIn: vi.fn(),
  useAuth: vi.fn(),
  useLoginMutation: vi.fn(),
}))

vi.mock('../../src/shared/hooks/useAuth', () => ({
  default: mocks.useAuth,
}))

vi.mock('../../src/features/auth/authApi', () => ({
  useLoginMutation: mocks.useLoginMutation,
  getAuthErrorMessage: (error, fallback) => error?.data?.title ?? fallback,
}))

function renderPage(initialEntry = '/login') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/" element={<h1>Home</h1>} />
        <Route path="/app" element={<h1>App Home</h1>} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/users" element={<h1>User Management</h1>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('LoginPage', () => {
  beforeEach(() => {
    mocks.login.mockReset()
    mocks.signIn.mockReset()
    mocks.useAuth.mockReturnValue({
      isAuthenticated: false,
      isInitializing: false,
      signIn: mocks.signIn,
    })
    mocks.useLoginMutation.mockReturnValue([
      mocks.login,
      { isLoading: false, error: null },
    ])
  })

  it('renders and submits the login form', async () => {
    const user = userEvent.setup()
    const credentials = {
      accessToken: 'test-token',
      expiresAt: '2099-01-01T00:00:00Z',
      user: {
        id: 'user-1',
        fullName: 'Operations Manager',
        email: 'manager@example.com',
        role: 'OperationsManager',
        status: 'Active',
      },
    }
    mocks.login.mockReturnValue({ unwrap: () => Promise.resolve(credentials) })
    renderPage()

    await user.type(screen.getByLabelText('Email'), 'manager@example.com')
    await user.type(screen.getByLabelText('Password'), 'Test123!')
    await user.click(screen.getByRole('button', { name: 'Login' }))

    expect(mocks.login).toHaveBeenCalledWith({
      email: 'manager@example.com',
      password: 'Test123!',
    })
    await waitFor(() => expect(mocks.signIn).toHaveBeenCalledWith(credentials))
    expect(screen.getByRole('heading', { name: 'App Home' })).toBeInTheDocument()
  })

  it('returns to the originally requested protected route after login', async () => {
    const user = userEvent.setup()
    const credentials = {
      accessToken: 'test-token',
      expiresAt: '2099-01-01T00:00:00Z',
      user: { id: 'user-1', role: 'OperationsManager' },
    }
    mocks.login.mockReturnValue({ unwrap: () => Promise.resolve(credentials) })
    renderPage({
      pathname: '/login',
      state: { from: { pathname: '/users', search: '?page=2', hash: '' } },
    })

    await user.type(screen.getByLabelText('Email'), 'manager@example.com')
    await user.type(screen.getByLabelText('Password'), 'Test123!')
    await user.click(screen.getByRole('button', { name: 'Login' }))

    expect(
      await screen.findByRole('heading', { name: 'User Management' }),
    ).toBeInTheDocument()
  })

  it('redirects an initialized authenticated user away from login', () => {
    mocks.useAuth.mockReturnValue({
      isAuthenticated: true,
      isInitializing: false,
    })

    renderPage()

    expect(screen.getByRole('heading', { name: 'App Home' })).toBeInTheDocument()
  })

  it('shows client-side errors for missing credentials', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: 'Login' }))

    expect(screen.getByText('Email is required.')).toBeInTheDocument()
    expect(screen.getByText('Password is required.')).toBeInTheDocument()
    expect(mocks.login).not.toHaveBeenCalled()
  })

  it('shows the backend invalid-credentials error', () => {
    mocks.useLoginMutation.mockReturnValue([
      mocks.login,
      {
        isLoading: false,
        error: {
          status: 401,
          data: { title: 'Invalid email or password' },
        },
      },
    ])

    renderPage()

    expect(screen.getByText('Unable to log in')).toBeInTheDocument()
    expect(screen.getByText('Invalid email or password')).toBeInTheDocument()
  })

  it('disables the form while login is loading', () => {
    mocks.useLoginMutation.mockReturnValue([
      mocks.login,
      { isLoading: true, error: null },
    ])

    renderPage()

    expect(screen.getByLabelText('Email')).toBeDisabled()
    expect(screen.getByLabelText('Password')).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Login' })).toBeDisabled()
  })
})
