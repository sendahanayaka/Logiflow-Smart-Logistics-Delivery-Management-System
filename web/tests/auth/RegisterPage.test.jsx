import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  MemoryRouter,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import RegisterPage from '../../src/features/auth/pages/RegisterPage'

const mocks = vi.hoisted(() => ({
  register: vi.fn(),
  useAuth: vi.fn(),
  useRegisterMutation: vi.fn(),
}))

vi.mock('../../src/shared/hooks/useAuth', () => ({
  default: mocks.useAuth,
}))

vi.mock('../../src/features/auth/authApi', () => ({
  useRegisterMutation: mocks.useRegisterMutation,
  getAuthErrorMessage: (_error, fallback) => fallback,
}))

function LoginDestination() {
  const location = useLocation()
  return (
    <h1>
      Login destination {location.state?.registrationSucceeded ? 'success' : ''}
    </h1>
  )
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/register']}>
      <Routes>
        <Route path="/" element={<h1>Home</h1>} />
        <Route path="/app" element={<h1>App Home</h1>} />
        <Route path="/login" element={<LoginDestination />} />
        <Route path="/register" element={<RegisterPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

async function fillRequiredFields(user, password, confirmation = password) {
  await user.type(screen.getByLabelText('Full Name'), 'Test Customer')
  await user.type(screen.getByLabelText('Email'), 'customer@example.com')
  await user.type(screen.getByLabelText('Phone Number'), '+94771112233')
  await user.type(screen.getByLabelText('Password'), password)
  await user.type(screen.getByLabelText('Confirm Password'), confirmation)
  await user.click(screen.getByRole('button', { name: 'Create account' }))
}

describe('RegisterPage', () => {
  beforeEach(() => {
    mocks.register.mockReset()
    mocks.useAuth.mockReturnValue({
      isAuthenticated: false,
      isInitializing: false,
    })
    mocks.useRegisterMutation.mockReturnValue([
      mocks.register,
      { isLoading: false, error: null },
    ])
  })

  it.each([
    ['Aa1!', 'Password must be at least 8 characters.'],
    ['lowercase1!', 'Password must include an uppercase letter.'],
    ['UPPERCASE1!', 'Password must include a lowercase letter.'],
    ['NoNumber!', 'Password must include a number.'],
    ['NoSpecial1', 'Password must include a special character.'],
  ])('rejects an invalid password: %s', async (password, message) => {
    const user = userEvent.setup()
    renderPage()

    await fillRequiredFields(user, password)

    expect(screen.getByText(message)).toBeInTheDocument()
    expect(mocks.register).not.toHaveBeenCalled()
  })

  it('rejects a password confirmation mismatch', async () => {
    const user = userEvent.setup()
    renderPage()

    await fillRequiredFields(user, 'Valid123!', 'Different123!')

    expect(screen.getByText('Passwords must match.')).toBeInTheDocument()
    expect(mocks.register).not.toHaveBeenCalled()
  })

  it('navigates to login with success state after registration', async () => {
    const user = userEvent.setup()
    mocks.register.mockReturnValue({ unwrap: () => Promise.resolve({}) })
    renderPage()

    await fillRequiredFields(user, 'Valid123!')

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: 'Login destination success' }),
      ).toBeInTheDocument()
    })
  })

  it('redirects an initialized authenticated user away from registration', () => {
    mocks.useAuth.mockReturnValue({
      isAuthenticated: true,
      isInitializing: false,
    })

    renderPage()

    expect(screen.getByRole('heading', { name: 'App Home' })).toBeInTheDocument()
  })
})
