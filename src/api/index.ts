/**
 * API barrel exports.
 * @deprecated Import from domain-specific API modules instead:
 *   - App: '@/features/app/api'
 *   - Admin: '@/features/admin/api'
 */
export { api } from '@/features/app/api/client';
export { authApi } from '@/features/app/api/auth';
export { usersApi } from '@/features/app/api/users';
export { organizationsApi } from '@/features/app/api/organizations';
export { eventsApi } from '@/features/app/api/events';
export { gamesApi } from '@/features/app/api/games';
export { notificationsApi } from '@/features/app/api/notifications';
export { leaderboardsApi } from '@/features/app/api/leaderboards';
export { filesApi } from '@/features/app/api/files';
export { analyticsApi } from '@/features/app/api/analytics';
export type { DashboardStats, AnalyticsOverview, ActiveSession } from '@/features/app/api/analytics';
export { postsApi } from '@/features/app/api/posts';
export { adminApi } from '@/features/admin/api/admin';
export { contactApi } from '@/features/app/api/contact';
