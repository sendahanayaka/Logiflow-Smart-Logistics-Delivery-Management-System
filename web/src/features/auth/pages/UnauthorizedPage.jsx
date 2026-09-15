import { Link } from 'react-router-dom'
import useAuth from '../../../shared/hooks/useAuth'
import { getRoleLabel } from '../roles'

export default function UnauthorizedPage() {
  const { user } = useAuth()

  return (
    <main className="auth-state-page">
      <section className="auth-state-card">
        <span className="auth-state-card__code">403</span>
        <span className="eyebrow">Access restricted</span>
        <h1>You do not have permission to view this page.</h1>
        <p>
          {user?.role
            ? `Your current ${getRoleLabel(user.role)} role does not include access to this area.`
            : 'Your current account does not include access to this area.'}
        </p>
        <div className="auth-state-card__actions">
          <Link className="button button--primary button-link" to="/app">
            Back to App
          </Link>
        </div>
      </section>
    </main>
  )
}
