const statusClasses = {
  active: 'status-badge--active',
  inactive: 'status-badge--inactive',
  suspended: 'status-badge--suspended',
}

export default function StatusBadge({ status }) {
  const normalizedStatus = String(status || 'Inactive').toLowerCase()
  const statusClass = statusClasses[normalizedStatus] ?? statusClasses.inactive

  return (
    <span className={`status-badge ${statusClass}`}>
      <span className="status-badge__dot" aria-hidden="true" />
      {status || 'Inactive'}
    </span>
  )
}
