import { useState } from 'react'
import ConfirmDialog from '../../../shared/components/ConfirmDialog'
import ErrorMessage from '../../../shared/components/ErrorMessage'
import Pagination from '../../../shared/components/Pagination'
import SearchBar from '../../../shared/components/SearchBar'
import useAuth from '../../../shared/hooks/useAuth'
import RoleSelector, {
  getRoleLabel,
} from '../components/RoleSelector'
import UserTable from '../components/UserTable'
import {
  getUsersErrorMessage,
  useChangeUserRoleMutation,
  useChangeUserStatusMutation,
  useDeactivateUserMutation,
  useGetUsersQuery,
} from '../usersApi'

const statusOptions = ['Active', 'Inactive', 'Suspended']

export default function UserListPage() {
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('')
  const [status, setStatus] = useState('')
  const [sortBy, setSortBy] = useState('CreatedAt')
  const [sortDirection, setSortDirection] = useState('Desc')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [dialog, setDialog] = useState(null)
  const [selectedRole, setSelectedRole] = useState('Customer')
  const [feedback, setFeedback] = useState(null)
  const { user: currentUser } = useAuth()

  const query = useGetUsersQuery({
    search: search.trim() || undefined,
    role: role || undefined,
    status: status || undefined,
    sortBy,
    sortDirection,
    page,
    pageSize,
  })
  const [changeRole, roleMutation] = useChangeUserRoleMutation()
  const [changeStatus, statusMutation] = useChangeUserStatusMutation()
  const [deactivate, deactivateMutation] = useDeactivateUserMutation()

  const users = query.data?.items ?? []
  const totalCount = query.data?.totalCount ?? 0
  const totalPages = query.data?.totalPages ?? 0
  const isActionLoading =
    roleMutation.isLoading || statusMutation.isLoading || deactivateMutation.isLoading

  const updateFilter = (setter) => (value) => {
    setter(value)
    setPage(1)
    setFeedback(null)
  }

  const openRoleDialog = (user) => {
    setSelectedRole(user.role)
    setDialog({ type: 'role', user })
    setFeedback(null)
  }

  const openStatusDialog = (user, nextStatus) => {
    setDialog({ type: 'status', user, nextStatus })
    setFeedback(null)
  }

  const openDeactivateDialog = (user) => {
    setDialog({ type: 'deactivate', user })
    setFeedback(null)
  }

  const handleConfirm = async () => {
    if (!dialog) return

    try {
      if (dialog.type === 'role') {
        if (selectedRole === dialog.user.role) {
          setDialog(null)
          return
        }
        await changeRole({ id: dialog.user.id, role: selectedRole }).unwrap()
        setFeedback({
          type: 'success',
          message: `${dialog.user.fullName} is now ${getRoleLabel(selectedRole)}.`,
        })
      } else if (dialog.type === 'status') {
        await changeStatus({
          id: dialog.user.id,
          status: dialog.nextStatus,
        }).unwrap()
        setFeedback({
          type: 'success',
          message: `${dialog.user.fullName} is now ${dialog.nextStatus}.`,
        })
      } else {
        await deactivate(dialog.user.id).unwrap()
        setFeedback({
          type: 'success',
          message: `${dialog.user.fullName} was deactivated.`,
        })
      }
      setDialog(null)
    } catch (error) {
      setFeedback({
        type: 'error',
        message: getUsersErrorMessage(error, 'The account action could not be completed.'),
      })
      setDialog(null)
    }
  }

  const dialogContent = (() => {
    if (!dialog) return null
    if (dialog.type === 'role') {
      return {
        title: 'Change user role',
        confirmLabel: 'Change role',
        message: (
          <>
            <span>
              Select the role to assign to <strong>{dialog.user.fullName}</strong>.
            </span>
            <RoleSelector
              value={selectedRole}
              onChange={setSelectedRole}
              className="confirm-dialog__select"
            />
          </>
        ),
      }
    }
    if (dialog.type === 'status') {
      return {
        title: `${dialog.nextStatus === 'Active' ? 'Activate' : 'Suspend'} account`,
        confirmLabel: dialog.nextStatus === 'Active' ? 'Activate' : 'Suspend',
        message: `Change ${dialog.user.fullName}'s account status to ${dialog.nextStatus}?`,
      }
    }
    return {
      title: 'Deactivate account',
      confirmLabel: 'Deactivate',
      message: `Deactivate ${dialog.user.fullName}? The user will no longer be able to log in.`,
    }
  })()

  return (
    <section className="users-page" aria-labelledby="users-title">
      <header className="users-page__header">
        <div className="page-heading">
          <span className="eyebrow">Operations Manager</span>
          <h1 id="users-title">User Management</h1>
          <p>Manage system users, roles and account access.</p>
        </div>
        <div className="users-page__count">
          <strong>{totalCount}</strong>
          <span>{totalCount === 1 ? 'user' : 'users'}</span>
        </div>
      </header>

      {feedback?.type === 'success' && (
        <div className="auth-notice auth-notice--success" role="status">
          {feedback.message}
        </div>
      )}
      {feedback?.type === 'error' && (
        <ErrorMessage title="Account action failed" message={feedback.message} />
      )}

      <div className="users-toolbar">
        <SearchBar
          value={search}
          onChange={updateFilter(setSearch)}
          onClear={() => updateFilter(setSearch)('')}
          placeholder="Search by name or email"
          label="Search users by name or email"
        />
        <div className="users-toolbar__filters">
          <RoleSelector
            value={role}
            onChange={updateFilter(setRole)}
            includeAll
            hideLabel
          />
          <label className="select-field">
            <span className="sr-only">Status</span>
            <select value={status} onChange={(event) => updateFilter(setStatus)(event.target.value)}>
              <option value="">All statuses</option>
              {statusOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </label>
          <label className="select-field">
            <span className="sr-only">Sort users by</span>
            <select value={sortBy} onChange={(event) => updateFilter(setSortBy)(event.target.value)}>
              <option value="FullName">Sort: Full Name</option>
              <option value="Email">Sort: Email</option>
              <option value="CreatedAt">Sort: Created</option>
            </select>
          </label>
          <label className="select-field">
            <span className="sr-only">Sort direction</span>
            <select value={sortDirection} onChange={(event) => updateFilter(setSortDirection)(event.target.value)}>
              <option value="Asc">Ascending</option>
              <option value="Desc">Descending</option>
            </select>
          </label>
        </div>
      </div>

      {query.isError ? (
        <ErrorMessage
          title="Unable to load users"
          message={getUsersErrorMessage(query.error, 'Users could not be loaded.')}
          action={
            <button type="button" className="text-action" onClick={query.refetch}>
              Try again
            </button>
          }
        />
      ) : (
        <>
          <UserTable
            users={users}
            isLoading={query.isLoading || query.isFetching}
            currentUserId={currentUser?.id}
            onRoleChange={openRoleDialog}
            onStatusChange={openStatusDialog}
            onDeactivate={openDeactivateDialog}
          />
          <div className="users-pagination-row">
            <label className="page-size-control">
              <span>Rows per page</span>
              <select
                value={pageSize}
                onChange={(event) => {
                  setPageSize(Number(event.target.value))
                  setPage(1)
                }}
              >
                {[10, 20, 50].map((size) => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </label>
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        </>
      )}

      <ConfirmDialog
        isOpen={Boolean(dialog)}
        title={dialogContent?.title}
        message={dialogContent?.message}
        confirmLabel={dialogContent?.confirmLabel}
        onConfirm={handleConfirm}
        onCancel={() => setDialog(null)}
        isLoading={isActionLoading}
      />
    </section>
  )
}
