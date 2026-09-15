import { Navigate, Outlet, useLocation } from 'react-router-dom'
import LoadingSpinner from '../../../shared/components/LoadingSpinner'
import useAuth from '../../../shared/hooks/useAuth'

export default function ProtectedRoute({ allowedRoles, children }) {
  const { isAuthenticated, isInitializing, user } = useAuth()
  const location = useLocation()

  if (isInitializing) {
    return <LoadingSpinner label="Restoring your session" />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (allowedRoles?.length > 0 && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/unauthorized" replace state={{ from: location }} />
  }

  return children ?? <Outlet />
}
