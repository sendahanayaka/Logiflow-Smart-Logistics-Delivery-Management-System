import { Navigate, createBrowserRouter } from 'react-router-dom'
import LoginPage from '../features/auth/pages/LoginPage'
import RegisterPage from '../features/auth/pages/RegisterPage'
import UnauthorizedPage from '../features/auth/pages/UnauthorizedPage'

export const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/login" replace /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  { path: '/unauthorized', element: <UnauthorizedPage /> },
  { path: '*', element: <Navigate to="/login" replace /> },
])
