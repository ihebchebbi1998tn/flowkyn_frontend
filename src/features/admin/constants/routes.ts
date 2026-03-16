/**
 * Admin route constants.
 */
export const ADMIN_ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  USERS: '/users',
  USER_DETAIL: (id = ':id') => `/users/${id}`,
  ORGANIZATIONS: '/organizations',
  ORG_DETAIL: (id = ':id') => `/organizations/${id}`,
  GAMES: '/games',
  CONTACTS: '/contacts',
  EARLY_ACCESS: '/early-access',
  AUDIT_LOGS: '/audit-logs',
  BUG_REPORTS: '/bug-reports',
  SETTINGS: '/settings',
} as const;
