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
  FEEDBACKS: '/feedbacks',
  SETTINGS: '/settings',
  // TIER 1 Features
  FEATURE_FLAGS: '/tier1/feature-flags',
  GAME_CONTENT: '/tier1/game-content',
  MODERATION_QUEUE: '/tier1/moderation-queue',
  USER_ENGAGEMENT: '/tier1/user-engagement',
  ORG_ANALYTICS: '/tier1/organization-analytics',
  ANALYTICS_REPORTS: '/tier1/analytics-reports',
} as const;
