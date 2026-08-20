import Button from '../../../shared/components/Button'
import useAuth from '../../../shared/hooks/useAuth'
import LoginForm from '../components/LoginForm'

export default function LoginPage() {
  const { isAuthenticated, logout, user } = useAuth()

  if (isAuthenticated) {
    return (
      <main className="auth-page">
        <section className="auth-brand-panel" aria-label="LogiFlow">
          <div className="auth-brand-panel__content">
            <img src="/logo.png" alt="" />
            <span className="eyebrow eyebrow--light">Secure access</span>
            <h1>You are signed in to LogiFlow.</h1>
            <p>Your authenticated session is active.</p>
          </div>
        </section>

        <section className="auth-form-panel" aria-labelledby="session-title">
          <div className="auth-card">
            <div className="auth-card__heading">
              <span className="eyebrow">Login successful</span>
              <h2 id="session-title">Welcome, {user?.fullName}</h2>
              <p>{user?.email}</p>
            </div>

            <div className="auth-notice auth-notice--success" role="status">
              Your account is authenticated as {user?.role}.
            </div>

            <Button type="button" className="auth-form__submit" onClick={logout}>
              Logout
            </Button>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="auth-page">
      <section className="auth-brand-panel" aria-label="LogiFlow">
        <div className="auth-brand-panel__content">
          <img src="/logo.png" alt="" />
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
