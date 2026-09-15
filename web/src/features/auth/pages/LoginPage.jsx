import { Link, Navigate, useLocation } from 'react-router-dom'
import useAuth from '../../../shared/hooks/useAuth'
import LoginForm from '../components/LoginForm'

export default function LoginPage() {
  const { isAuthenticated, isInitializing } = useAuth()
  const location = useLocation()

  if (!isInitializing && isAuthenticated) {
    return <Navigate to={location.state?.from ?? '/app'} replace />
  }

  return (
    <main className="auth-page">
      <section className="auth-brand-panel" aria-label="LogiFlow">
        <div className="auth-brand-panel__content">
          <Link className="auth-home-link" to="/" aria-label="Back to LogiFlow home">
            <img src="/logo.png" alt="" />
            <span>LogiFlow</span>
          </Link>
          <span className="eyebrow eyebrow--light">Smart logistics platform</span>
          <h1>Keep every operation moving.</h1>
          <p>
            Secure access to LogiFlow's shared logistics administration
            workspace.
          </p>
        </div>
      </section>

      <section className="auth-form-panel" aria-labelledby="login-title">
        <div className="auth-card">
          <div className="auth-card__heading">
            <span className="eyebrow">Welcome back</span>
            <h2 id="login-title">Sign in to LogiFlow</h2>
            <p>Enter your account credentials to continue.</p>
          </div>
          <LoginForm />
        </div>
      </section>
    </main>
  )
}
