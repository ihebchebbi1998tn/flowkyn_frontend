/**
 * @fileoverview Analytics API Module
 *
 * Provides engagement tracking and dashboard data:
 * - Event tracking (fire-and-forget analytics events)
 * - Dashboard stats (active sessions, team members, upcoming events)
 * - Analytics overview (engagement trends, activity breakdown, top activities)
 * - Active game sessions (currently running)
 *
 * All analytics endpoints require authentication and scope data
 * to the user's organizations.
 *
 * @see NodejsBackend/src/routes/analytics.routes.ts
 */

import { api } from './client';

/** Dashboard statistics for the authenticated user's workspace */
export interface DashboardStats {
  activeSessions: number;
  teamMembers: number;
  totalEvents: number;
  completedSessions: number;
  upcomingEvents: {
    id: string;
    title: string;
    event_mode: string;
    start_time: string | null;
    status: string;
    max_participants: number;
    participant_count: number;
  }[];
  recentActivity: {
    id: string;
    status: string;
    current_round: number;
    started_at: string;
    ended_at: string | null;
    game_type_name: string;
    game_type_key: string;
    event_title: string;
  }[];
}

/** Analytics overview with engagement trends and breakdowns */
export interface AnalyticsOverview {
  engagementTrend: { month: string; month_num: number; sessions: string; completed: string }[];
  activityBreakdown: { name: string; category: string; sessions: string; participants: string }[];
  topActivities: { name: string; category: string; sessions: string; participants: string; total_actions: string }[];
  stats: {
    totalSessions: number;
    totalParticipants: number;
    completionRate: number;
  };
}

/** Currently active game session */
export interface ActiveSession {
  id: string;
  event_id: string;
  game_type_id: string;
  status: string;
  current_round: number;
  game_duration_minutes: number;
  started_at: string;
  game_type_name: string;
  game_type_key: string;
  event_title: string;
  organization_name: string;
}

export const analyticsApi = {
  /** Track a custom analytics event */
  track: (eventName: string, properties: Record<string, unknown> = {}) =>
    api.post('/analytics', { event_name: eventName, properties }),

  /** Get dashboard statistics (aggregated for user's orgs) */
  getDashboard: () =>
    api.get<DashboardStats>('/analytics/dashboard'),

  /** Get analytics overview with trends and breakdowns */
  getOverview: (months = 6) =>
    api.get<AnalyticsOverview>('/analytics/overview', { months: String(months) }),

  /** Get list of currently active game sessions */
  getActiveSessions: () =>
    api.get<ActiveSession[]>('/analytics/active-sessions'),
};
