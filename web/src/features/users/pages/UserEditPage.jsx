import { Link, useNavigate, useParams } from 'react-router-dom'
import ErrorMessage from '../../../shared/components/ErrorMessage'
import LoadingSpinner from '../../../shared/components/LoadingSpinner'
import StatusBadge from '../../../shared/components/StatusBadge'
import { getRoleLabel } from '../components/RoleSelector'
import UserForm from '../components/UserForm'
import {
  getUsersErrorMessage,
  useGetUserQuery,
  useUpdateUserMutation,
} from '../usersApi'

export default function UserEditPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const query = useGetUserQuery(id)
  const [updateUser, updateMutation] = useUpdateUserMutation()

  const handleSubmit = async (values) => {
    try {
      const updatedUser = await updateUser({ id, ...values }).unwrap()
      navigate(`/users/${updatedUser.id}`, {
        replace: true,
        state: { userUpdated: true },
      })
    } catch {
      // The mutation error is rendered below using the backend response.
    }
  }

  if (query.isLoading) {
    return <div className="page-state"><LoadingSpinner size="large" label="Loading user" /></div>
  }

  if (query.isError) {
    return (
      <div className="page-state">
        <ErrorMessage
          title={query.error?.status === 404 ? 'User not found' : 'Unable to load user'}
          message={getUsersErrorMessage(query.error, 'The user could not be loaded for editing.')}
          action={<Link to="/users">Return to User Management</Link>}
        />
      </div>
    )
  }

  const user = query.data
  if (!user) {
    return <div className="page-state"><ErrorMessage title="User not found" message="No editable user data is available." /></div>
  }

  return (
    <section className="user-edit-page" aria-labelledby="user-edit-title">
      <header className="detail-page-header">
        <div>
          <Link className="back-link" to={`/users/${user.id}`}>← User details</Link>
          <h1 id="user-edit-title">Edit {user.fullName}</h1>
          <p>Update the user's shared profile information.</p>
        </div>
        <div className="edit-account-state">
          <span>{getRoleLabel(user.role)}</span>
          <StatusBadge status={user.status} />
        </div>
      </header>

      <article className="user-form-card">
        <UserForm
          key={user.id}
          user={user}
          onSubmit={handleSubmit}
          onCancel={() => navigate(`/users/${user.id}`)}
          isLoading={updateMutation.isLoading}
          error={
            updateMutation.error
              ? getUsersErrorMessage(updateMutation.error, 'The user could not be updated.')
              : null
          }
        />
      </article>
    </section>
  )
}
