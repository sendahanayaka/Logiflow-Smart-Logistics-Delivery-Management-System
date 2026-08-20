import { Link } from 'react-router-dom'
import Button from '../../../shared/components/Button'
import DataTable from '../../../shared/components/DataTable'
import StatusBadge from '../../../shared/components/StatusBadge'
import { getRoleLabel } from './RoleSelector'

function formatDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? '—'
    : new Intl.DateTimeFormat(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }).format(date)
}

function getInitials(name) {
  return String(name ?? '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

export default function UserTable({
  users,
  isLoading,
  currentUserId,
  onRoleChange,
  onStatusChange,
  onDeactivate,
}) {
  const columns = [
    {
      key: 'user',
      header: 'User',
      render: (user) => (
        <div className="user-cell">
          <span className="user-cell__avatar" aria-hidden="true">
            {getInitials(user.fullName)}
          </span>
          <strong>{user.fullName}</strong>
        </div>
      ),
    },
    { key: 'email', header: 'Email' },
    {
      key: 'role',
      header: 'Role',
      render: (user) => <span className="role-label">{getRoleLabel(user.role)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (user) => <StatusBadge status={user.status} />,
    },
    {
      key: 'createdAt',
      header: 'Created',
      render: (user) => formatDate(user.createdAt),
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'data-table__actions-column',
      render: (user) => {
        const isCurrentUser = user.id === currentUserId
        const nextStatus = user.status === 'Active' ? 'Suspended' : 'Active'

        return (
          <div className="row-actions">
            <Link className="table-action-link" to={`/users/${user.id}`}>
              View
            </Link>
            <Link className="table-action-link" to={`/users/${user.id}/edit`}>
              Edit
            </Link>
            <Button
              size="small"
              variant="ghost"
              onClick={() => onRoleChange(user)}
              disabled={isCurrentUser}
              title={isCurrentUser ? 'You cannot change your own administrative role.' : undefined}
            >
              Change Role
            </Button>
            <Button
              size="small"
              variant="ghost"
              onClick={() => onStatusChange(user, nextStatus)}
              disabled={isCurrentUser}
              title={isCurrentUser ? 'You cannot change your own account status.' : undefined}
            >
              {nextStatus === 'Active' ? 'Activate' : 'Suspend'}
            </Button>
            <Button
              size="small"
              variant="ghost"
              onClick={() => onDeactivate(user)}
              disabled={isCurrentUser || user.status === 'Inactive'}
              title={isCurrentUser ? 'You cannot deactivate your own account.' : undefined}
            >
              Deactivate
            </Button>
          </div>
        )
      },
    },
  ]

  return (
    <DataTable
      columns={columns}
      rows={users}
      isLoading={isLoading}
      emptyMessage="No users match the current search and filters."
      caption="LogiFlow system users"
    />
  )
}
