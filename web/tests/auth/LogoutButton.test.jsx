import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import LogoutButton from '../../src/features/auth/components/LogoutButton'

const mocks = vi.hoisted(() => ({
  logout: vi.fn(),
  useAuth: vi.fn(),
}))

vi.mock('../../src/shared/hooks/useAuth', () => ({
  default: mocks.useAuth,
}))

function renderButton() {
  return render(
    <MemoryRouter initialEntries={['/inside']}>
      <Routes>
        <Route path="/" element={<h1>Home</h1>} />
        <Route path="/inside" element={<LogoutButton />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('LogoutButton', () => {
  beforeEach(() => {
    mocks.logout.mockReset()
    mocks.useAuth.mockReturnValue({
      logout: mocks.logout,
      logoutState: { isLoading: false },
    })
  })

  it('contacts the backend logout flow before clearing the visible session', async () => {
    const user = userEvent.setup()
    mocks.logout.mockResolvedValue()
    renderButton()

    await user.click(screen.getByRole('button', { name: 'Sign Out' }))

    expect(mocks.logout).toHaveBeenCalledOnce()
    expect(screen.queryByRole('alert')).toBeNull()
    expect(screen.getByRole('heading', { name: 'Home' })).toBeInTheDocument()
  })

  it('keeps the session visible and reports a useful logout failure', async () => {
    const user = userEvent.setup()
    mocks.logout.mockRejectedValue({ status: 'FETCH_ERROR' })
    renderButton()

    await user.click(screen.getByRole('button', { name: 'Sign Out' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'could not confirm sign-out',
    )
  })
})
