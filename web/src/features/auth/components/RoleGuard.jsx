import { Navigate, Outlet, useLocation } from 'react-router-dom'
import useAuth from '../../../shared/hooks/useAuth'

export default function RoleGuard({ allowedRoles, children }) {
  const { user } = useAuth()
  const location = useLocation()

  if (!allowedRoles.includes(user?.role)) {
    return <Navigate to="/unauthorized" replace state={{ from: location }} />
  }

  return children ?? <Outlet />
}
