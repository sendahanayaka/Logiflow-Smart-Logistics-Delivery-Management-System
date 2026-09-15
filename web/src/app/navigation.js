import { ALL_USER_ROLES, USER_ROLES } from '../features/auth/roles'

export const navigationItems = [
  {
    label: 'Home',
    route: '/app',
    allowedRoles: ALL_USER_ROLES,
    implemented: true,
  },
  {
    label: 'User Management',
    route: '/users',
    allowedRoles: [USER_ROLES.OPERATIONS_MANAGER],
    implemented: true,
  },
  {
    label: 'My Orders',
    allowedRoles: [USER_ROLES.CUSTOMER],
    implemented: false,
  },
  {
    label: 'My Deliveries',
    allowedRoles: [USER_ROLES.DRIVER],
    implemented: false,
  },
  {
    label: 'Package Intake',
    allowedRoles: [USER_ROLES.WAREHOUSE_STAFF],
    implemented: false,
  },
  {
    label: 'Approvals',
    allowedRoles: [USER_ROLES.OPERATIONS_MANAGER],
    implemented: false,
  },
]

export function getNavigationItems(role) {
  return navigationItems.filter((item) => item.allowedRoles.includes(role))
}
