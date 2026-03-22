/**
 * Centralized route path constants.
 * Always reference these instead of hardcoding path strings.
 */
export const ROUTES = {
  // Public
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  VERIFY_OTP: '/verify-otp',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  ONBOARDING: '/onboarding',

  // Dashboard
  DASHBOARD: '/dashboard',

  // Organizations
  ORGANIZATIONS: '/organizations',

  // Events
  EVENTS: '/events',
  EVENT_NEW: '/events/new',
  EVENT_DETAIL: (id = ':id') => `/events/${id}`,
  EVENT_EDIT: (id = ':id') => `/events/${id}/edit`,
  /** @deprecated Use PLAY instead */
  EVENT_LIVE: (id = ':id') => `/play/${id}`,

  // Activities
  ACTIVITY_DETAIL: (id = ':id') => `/activities/${id}`,
  ACTIVITY_LAUNCH: (id = ':id') => `/activities/${id}/launch`,

  // Games & Play
  GAMES: '/games',
  SESSION_DETAILS: (id = ':sessionId') => `/games/sessions/${id}`,
  /** @deprecated Use PLAY instead */
  GAME_SESSION: (id = ':id') => `/play/${id}`,
  PLAY: (id = ':id') => `/play/${id}`,

  // Event lobby (focused, no dashboard)
  EVENT_LOBBY: (id = ':id') => `/join/${id}`,

  // Invitations
  INVITE: (token = ':token') => `/invite/${token}`,

  // Support & Bug Reports
  SUPPORT_REPORT: '/support/report',
  SUPPORT_REPORTS: '/support/reports',

  // Other
  NOTIFICATIONS: '/notifications',
  ANALYTICS: '/analytics',
  PROFILE: '/profile',
  USERS: '/users',
  
  SETTINGS: '/settings',

  // Dev/Testing
  UI_TESTS: '/uitests',
  UI_TESTS_ALT: '/ui-tests',

  // Static pages
  ABOUT: '/about',
  CONTACT: '/contact',
  PRIVACY: '/privacy',
  TERMS: '/terms',
  SECURITY: '/security',
} as const;
