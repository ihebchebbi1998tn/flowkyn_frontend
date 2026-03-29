/**
 * @fileoverview Analytics API Module
 *
 * Provides engagement tracking and dashboard data:
 * - Event tracking (fire-and-forget analytics events)
 * - Dashboard stats (active sessions, team members, upcoming events)
 * - Analytics overview (engagement trends, activity breakdown, top activities)
 * - Active game sessions (currently running)
 * - Engagement metrics (detailed organization metrics)
 * - Real-time metrics (live session data)
 * - Event analytics (detailed event performance)
 * - Participant rankings (leaderboards)
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

/** Engagement metrics for an organization */
export interface EngagementMetrics {
  total_participants: number;
  total_events: number;
  total_sessions: number;
  avg_session_duration_minutes: number;
  session_completion_rate: number;
  active_participants_now: number;
  last_session_at: string | null;
}

/** Real-time metrics data */
export interface RealTimeMetrics {
  activeSessions: Array<{
    id: string;
    status: string;
    current_round: number;
    started_at: string;
    game_name: string;
    game_key: string;
    event_title: string;
    participant_count: number;
  }>;
  onlineParticipantsCount: number;
  recentSessions: Array<{
    id: string;
    status: string;
    ended_at: string;
    game_name: string;
    event_title: string;
    participant_count: number;
  }>;
  gameBreakdown: Array<{
    name: string;
    key: string;
    session_count: number;
    total_participants: number;
    avg_duration_minutes: number;
  }>;
  timestamp: string;
}

/** Event analytics */
export interface EventAnalytics {
  event: {
    id: string;
    title: string;
    status: string;
    event_mode: string;
    created_at: string;
    start_time: string;
    end_time: string | null;
    total_participants: number;
    active_participants: number;
    total_sessions: number;
    total_messages: number;
    duration_minutes: number;
    engagement_rate: number;
  };
  sessions: Array<{
    id: string;
    status: string;
    current_round: number;
    started_at: string;
    ended_at: string | null;
    game_name: string;
    game_key: string;
    participant_count: number;
    total_actions: number;
    duration_minutes: number;
  }>;
  participants: Array<{
    id: string;
    display_name: string;
    avatar_url: string | null;
    participant_type: string;
    joined_at: string;
    left_at: string | null;
    interaction_count: number;
    message_count: number;
    last_activity_at: string | null;
  }>;
  timeline: Array<{
    id: string;
    started_at: string;
    ended_at: string | null;
    status: string;
    game_name: string;
    participant_count: number;
  }>;
  messageActivity: Array<{
    hour: string;
    message_count: number;
    active_senders: number;
  }>;
  feedback: {
    avg_rating: number | null;
    total_feedbacks: number;
    positive_count: number;
    negative_count: number;
  };
}

/** Participant ranking */
export interface ParticipantRanking {
  id: string;
  display_name: string;
  avatar_seed: string;
  sessions_participated: number;
  events_attended: number;
  total_interactions: number;
  completion_rate: number;
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

  /** Get engagement metrics for an organization */
  getEngagementMetrics: (organizationId: string) =>
    api.get<EngagementMetrics>(`/analytics/engagement/${organizationId}`),

  /** Get real-time metrics for an organization */
  getRealTimeMetrics: (organizationId: string) =>
    api.get<RealTimeMetrics>(`/analytics/realtime/${organizationId}`),

  /** Get detailed analytics for a specific event */
  getEventAnalytics: (eventId: string) =>
    api.get<EventAnalytics>(`/analytics/event/${eventId}`),

  /** Get participant rankings/leaderboard for an organization */
  getParticipantRankings: (organizationId: string, limit = 20) =>
    api.get<ParticipantRanking[]>(`/analytics/rankings/${organizationId}`, { limit: String(limit) }),
};
