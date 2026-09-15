import { useId } from 'react'
import {
  ALL_USER_ROLES,
  getRoleLabel,
} from '../../auth/roles'

// Exports are retained for existing user-management imports.
// oxlint-disable react/only-export-components

export const USER_ROLES = ALL_USER_ROLES.map((role) => ({
  value: role,
  label: getRoleLabel(role),
}))

export { getRoleLabel }

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
