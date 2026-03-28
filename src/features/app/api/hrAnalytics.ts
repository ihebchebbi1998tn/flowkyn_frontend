/**
 * @fileoverview HR Analytics API
 * 
 * Provides game-specific insights for HR teams:
 * - Connection quality from Coffee Roulette
 * - Team sentiment from Wins of the Week
 * - Collaboration patterns from Strategic Escape
 * - Cross-game participation trends
 */

import { api } from './client';

/** Per-game HR insights */
export interface GameInsight {
  gameKey: string;
  gameName: string;
  totalSessions: number;
  totalParticipants: number;
  avgCompletionRate: number;
  avgDurationMinutes: number;
}

/** Coffee Roulette connection insights */
export interface ConnectionInsight {
  totalPairings: number;
  uniqueParticipants: number;
  avgChatDurationMinutes: number;
  connectionDensity: number; // % of possible pairings made
  topConnectors: Array<{ name: string; pairings: number }>;
}

/** Wins of the Week sentiment insights */
export interface SentimentInsight {
  totalPosts: number;
  totalReactions: number;
  avgReactionsPerPost: number;
  participationRate: number;
  topCategories: Array<{ name: string; count: number }>;
  weeklyTrend: Array<{ week: string; posts: number; reactions: number }>;
}

/** Strategic Escape collaboration insights */
export interface CollaborationInsight {
  totalGames: number;
  avgTeamSize: number;
  avgDiscussionMinutes: number;
  completionRate: number;
  difficultyBreakdown: Array<{ difficulty: string; count: number; completionRate: number }>;
}

/** Full HR analytics dashboard */
export interface HRAnalyticsDashboard {
  overview: {
    totalActiveSessions: number;
    totalParticipantsThisMonth: number;
    engagementScore: number; // 0-100
    monthOverMonthGrowth: number;
  };
  gameInsights: GameInsight[];
  connectionInsights: ConnectionInsight;
  sentimentInsights: SentimentInsight;
  collaborationInsights: CollaborationInsight;
  participationTrend: Array<{ month: string; participants: number; sessions: number }>;
}

export const hrAnalyticsApi = {
  /** Get full HR analytics dashboard for an organization */
  getDashboard: (organizationId: string) =>
    api.get<HRAnalyticsDashboard>(`/analytics/hr/${organizationId}`),

  /** Export HR analytics as CSV */
  exportCSV: (organizationId: string, dateRange?: { from: string; to: string }) =>
    api.get<{ url: string }>(`/analytics/hr/${organizationId}/export`, {
      ...(dateRange?.from ? { from: dateRange.from } : {}),
      ...(dateRange?.to ? { to: dateRange.to } : {}),
      format: 'csv',
    }),
};
