import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuth from '../../../shared/hooks/useAuth'

export default function LogoutButton({ onLoggedOut }) {
  const [error, setError] = useState(null)
  const { logout, logoutState } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    setError(null)

    try {
      await logout()
      onLoggedOut?.()
      navigate('/', { replace: true })
    } catch {
      setError(
        'LogiFlow could not confirm sign-out. Your session is still shown as active; check your connection and try again.',
      )
    }
  }

  return (
    <div className="session-actions">
      <button
        type="button"
        className="public-sign-in public-sign-out"
        onClick={handleLogout}
        disabled={logoutState.isLoading}
      >
        {logoutState.isLoading ? 'Signing out…' : 'Sign Out'}
      </button>
      {error && <span role="alert">{error}</span>}
    </div>
  )
}
