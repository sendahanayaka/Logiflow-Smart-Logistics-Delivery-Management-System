import { Navigate, Outlet, useLocation } from 'react-router-dom'
import useAuth from '../../../shared/hooks/useAuth'

export default function ProtectedRoute({ allowedRoles, children }) {
  const { isAuthenticated, user } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (allowedRoles?.length > 0 && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/unauthorized" replace state={{ from: location }} />
  }

  return children ?? <Outlet />
}
