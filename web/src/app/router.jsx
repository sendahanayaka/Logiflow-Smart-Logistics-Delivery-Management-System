import { Navigate, createBrowserRouter } from 'react-router-dom'
import LoginPage from '../features/auth/pages/LoginPage'
import RegisterPage from '../features/auth/pages/RegisterPage'
import UnauthorizedPage from '../features/auth/pages/UnauthorizedPage'
import LandingPage from '../features/public/pages/LandingPage'

export const appRoutes = [
  { path: '/', element: <LandingPage /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  { path: '/unauthorized', element: <UnauthorizedPage /> },
  { path: '*', element: <Navigate to="/" replace /> },
]

export const router = createBrowserRouter(appRoutes)
