export const USER_ROLES = {
  CUSTOMER: 'Customer',
  DRIVER: 'Driver',
  WAREHOUSE_STAFF: 'WarehouseStaff',
  OPERATIONS_MANAGER: 'OperationsManager',
}

export const ALL_USER_ROLES = Object.values(USER_ROLES)

export const ROLE_LABELS = {
  [USER_ROLES.CUSTOMER]: 'Customer',
  [USER_ROLES.DRIVER]: 'Driver',
  [USER_ROLES.WAREHOUSE_STAFF]: 'Warehouse Staff',
  [USER_ROLES.OPERATIONS_MANAGER]: 'Operations Manager',
}

export function getRoleLabel(role) {
  return ROLE_LABELS[role] ?? role ?? 'Unknown role'
}
