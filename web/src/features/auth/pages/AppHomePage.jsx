import useAuth from '../../../shared/hooks/useAuth'
import { getRoleLabel, USER_ROLES } from '../roles'

const roleDescriptions = {
  [USER_ROLES.CUSTOMER]:
    'Manage your delivery requests and track your shipments.',
  [USER_ROLES.DRIVER]:
    'View your assigned delivery work and duty information.',
  [USER_ROLES.WAREHOUSE_STAFF]:
    'Manage package intake and dispatch preparation.',
  [USER_ROLES.OPERATIONS_MANAGER]:
    'Monitor operations and manage platform users.',
}

export default function AppHomePage() {
  const { user } = useAuth()
  const roleLabel = getRoleLabel(user?.role)

  return (
    <section className="app-home" aria-labelledby="app-home-title">
      <div className="app-home__welcome">
        <span className="eyebrow">Authenticated workspace</span>
        <h1 id="app-home-title">Welcome, {user?.fullName}</h1>
        <p>{roleDescriptions[user?.role] ?? 'Welcome to your LogiFlow workspace.'}</p>
      </div>

      <article className="app-home__role-card">
        <span>Your current role</span>
        <strong>{roleLabel}</strong>
        <p>
          Use the navigation to access the LogiFlow areas currently available
          to your account.
        </p>
      </article>
    </section>
  )
}
