import { Navigate, createBrowserRouter } from 'react-router-dom'
import LoginPage from '../features/auth/pages/LoginPage'
import RegisterPage from '../features/auth/pages/RegisterPage'
import UnauthorizedPage from '../features/auth/pages/UnauthorizedPage'
import AppHomePage from '../features/auth/pages/AppHomePage'
import ProtectedRoute from '../features/auth/components/ProtectedRoute'
import RoleGuard from '../features/auth/components/RoleGuard'
import { USER_ROLES } from '../features/auth/roles'
import LandingPage from '../features/public/pages/LandingPage'
import UserDetailsPage from '../features/users/pages/UserDetailsPage'
import UserEditPage from '../features/users/pages/UserEditPage'
import UserListPage from '../features/users/pages/UserListPage'
import MainLayout from '../shared/layout/MainLayout'

export const appRoutes = [
  { path: '/', element: <LandingPage /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  { path: '/unauthorized', element: <UnauthorizedPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <MainLayout />,
        children: [
          { path: '/app', element: <AppHomePage /> },
          {
            element: (
              <RoleGuard allowedRoles={[USER_ROLES.OPERATIONS_MANAGER]} />
            ),
            children: [
              { path: '/users', element: <UserListPage /> },
              { path: '/users/:id', element: <UserDetailsPage /> },
              { path: '/users/:id/edit', element: <UserEditPage /> },
            ],
          },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]

export const router = createBrowserRouter(appRoutes)
