import { useId } from 'react'

// Role metadata intentionally lives with the required RoleSelector component.
// oxlint-disable react/only-export-components

export const USER_ROLES = [
  { value: 'Customer', label: 'Customer' },
  { value: 'Driver', label: 'Driver' },
  { value: 'WarehouseStaff', label: 'Warehouse Staff' },
  { value: 'OperationsManager', label: 'Operations Manager' },
]

export function getRoleLabel(role) {
  return USER_ROLES.find((option) => option.value === role)?.label ?? role ?? '—'
}

export default function RoleSelector({
  value,
  onChange,
  label = 'Role',
  includeAll = false,
  allLabel = 'All roles',
  hideLabel = false,
  disabled = false,
  required = false,
  className = '',
}) {
  const id = useId()

  return (
    <label className={`select-field ${className}`.trim()} htmlFor={id}>
      <span className={hideLabel ? 'sr-only' : ''}>{label}</span>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        required={required}
      >
        {includeAll && <option value="">{allLabel}</option>}
        {USER_ROLES.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}
