import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getRoleLabel } from '../../features/auth/roles'
import useAuth from '../hooks/useAuth'

export default function Navbar({ isSidebarOpen, onMenuClick }) {
  const [logoutError, setLogoutError] = useState(null)
  const { logout, logoutState, user } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    setLogoutError(null)

    try {
      await logout()
      navigate('/', { replace: true })
    } catch {
      setLogoutError('Sign-out could not be confirmed. Check your connection and try again.')
    }
  }

  return (
    <header className="navbar">
      <button
        type="button"
        className="navbar__menu"
        onClick={onMenuClick}
        aria-label={isSidebarOpen ? 'Close navigation' : 'Open navigation'}
        aria-controls="app-sidebar"
        aria-expanded={isSidebarOpen}
      >
        <span />
        <span />
        <span />
      </button>

      <div className="navbar__context">
        <span className="navbar__label">Authenticated workspace</span>
        <strong>LogiFlow App</strong>
      </div>

      <div className="navbar__account">
        <span className="navbar__avatar" aria-hidden="true">
          {user?.fullName?.trim().slice(0, 1).toUpperCase() ?? 'U'}
        </span>
        <div className="navbar__identity">
          <strong>{user?.fullName}</strong>
          <span>{getRoleLabel(user?.role)}</span>
        </div>
        <button
          type="button"
          className="navbar__logout"
          onClick={handleLogout}
          disabled={logoutState.isLoading}
        >
          {logoutState.isLoading ? 'Signing out…' : 'Sign Out'}
        </button>
      </div>
      {logoutError && <span className="navbar__error" role="alert">{logoutError}</span>}
    </header>
  )
}
