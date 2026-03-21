import { api } from '@/features/app/api/client';

export interface UserEngagementMetrics {
  id: string;
  user_id: string;
  engagement_score: number;
  last_active_at: string;
  total_sessions: number;
  total_games_played: number;
  average_session_duration_minutes: number;
  user_tags: string[];
  current_streak_days: number;
  highest_streak_days: number;
  created_at: string;
  updated_at: string;
}

export interface EngagementStats {
  totalUsers: number;
  averageScore: number;
  averageSessions: number;
  averageGamesPlayed: number;
  topTag: string;
  activeToday: number;
}

export const userEngagementApi = {
  getUserMetrics: (userId: string) =>
    api.get<UserEngagementMetrics>(`/admin/user-engagement/user/${userId}`),

  recordActivity: (userId: string, activityType: 'session_started' | 'game_completed' | 'message_sent' | 'interaction') =>
    api.post<UserEngagementMetrics>(`/admin/user-engagement/user/${userId}/activity`, { activityType }),

  addTag: (userId: string, tag: string) =>
    api.post<UserEngagementMetrics>(`/admin/user-engagement/user/${userId}/tags`, { tag }),

  removeTag: (userId: string, tag: string) =>
    api.del<UserEngagementMetrics>(`/admin/user-engagement/user/${userId}/tags/${tag}`),

  updateSessionDuration: (userId: string, durationMinutes: number) =>
    api.post<UserEngagementMetrics>(`/admin/user-engagement/user/${userId}/session-duration`, {
      durationMinutes,
    }),

  updateStreak: (userId: string) =>
    api.post<UserEngagementMetrics>(`/admin/user-engagement/user/${userId}/streak`),

  getTopUsers: (limit = 10) =>
    api.get<UserEngagementMetrics[]>('/admin/user-engagement/top', { limit: String(limit) }),

  getUsersByTag: (tag: string, page = 1, limit = 20) =>
    api.get<{ data: UserEngagementMetrics[]; total: number }>(`/admin/user-engagement/tag/${tag}`, {
      page: String(page),
      limit: String(limit),
    }),

  getTimeline: (userId: string, days = 30, interval: 'hour' | 'day' | 'week' = 'day') =>
    api.get(`/admin/user-engagement/user/${userId}/timeline`, {
      days: String(days),
      interval,
    }),

  getStats: () =>
    api.get<EngagementStats>('/admin/user-engagement/stats'),
};
