import { Link, useLocation, useParams } from 'react-router-dom'
import ErrorMessage from '../../../shared/components/ErrorMessage'
import LoadingSpinner from '../../../shared/components/LoadingSpinner'
import StatusBadge from '../../../shared/components/StatusBadge'
import { getRoleLabel } from '../components/RoleSelector'
import { getUsersErrorMessage, useGetUserQuery } from '../usersApi'

function formatDateTime(value) {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? '—'
    : new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(date)
}

export default function UserDetailsPage() {
  const { id } = useParams()
  const location = useLocation()
  const query = useGetUserQuery(id)

  if (query.isLoading) {
    return <div className="page-state"><LoadingSpinner size="large" label="Loading user details" /></div>
  }

  if (query.isError) {
    return (
      <div className="page-state">
        <ErrorMessage
          title={query.error?.status === 404 ? 'User not found' : 'Unable to load user'}
          message={getUsersErrorMessage(query.error, 'The user details could not be loaded.')}
          action={<Link to="/users">Return to User Management</Link>}
        />
      </div>
    )
  }

  const user = query.data
  if (!user) {
    return <div className="page-state"><ErrorMessage title="User not found" message="No user details are available." /></div>
  }

  const details = [
    ['Full Name', user.fullName],
    ['Email', user.email],
    ['Phone Number', user.phoneNumber || '—'],
    ['Role', getRoleLabel(user.role)],
    ['Status', <StatusBadge key="status" status={user.status} />],
    ['Created At', formatDateTime(user.createdAt)],
    ['Updated At', formatDateTime(user.updatedAt)],
  ]

  return (
    <section className="user-details-page" aria-labelledby="user-details-title">
      <header className="detail-page-header">
        <div>
          <Link className="back-link" to="/users">← User Management</Link>
          <h1 id="user-details-title">{user.fullName}</h1>
          <p>Account profile, access role and current status.</p>
        </div>
        <Link className="button button--primary button-link" to={`/users/${user.id}/edit`}>
          Edit user
        </Link>
      </header>

      {location.state?.userUpdated && (
        <div className="auth-notice auth-notice--success" role="status">
          User profile updated successfully.
        </div>
      )}

      <article className="details-card">
        <div className="details-card__identity">
          <span aria-hidden="true">{user.fullName?.slice(0, 1).toUpperCase()}</span>
          <div>
            <h2>{user.fullName}</h2>
            <p>{getRoleLabel(user.role)}</p>
          </div>
        </div>
        <dl className="details-grid">
          {details.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      </article>
    </section>
  )
}
