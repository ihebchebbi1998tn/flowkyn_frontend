import { useQuery, useMutation } from '@tanstack/react-query';
import { analyticsApi } from '@/features/app/api/analytics';

export const analyticsKeys = {
  dashboard: ['analytics', 'dashboard'] as const,
  overview: (months: number) => ['analytics', 'overview', months] as const,
  activeSessions: ['analytics', 'active-sessions'] as const,
  engagement: (organizationId: string) => ['analytics', 'engagement', organizationId] as const,
  realtime: (organizationId: string) => ['analytics', 'realtime', organizationId] as const,
  eventAnalytics: (eventId: string) => ['analytics', 'event', eventId] as const,
  rankings: (organizationId: string, limit: number) => ['analytics', 'rankings', organizationId, limit] as const,
};

export function useDashboardStats() {
  return useQuery({
    queryKey: analyticsKeys.dashboard,
    queryFn: () => analyticsApi.getDashboard(),
    staleTime: 60 * 1000, // 1 min
  });
}

export function useAnalyticsOverview(months = 6) {
  return useQuery({
    queryKey: analyticsKeys.overview(months),
    queryFn: () => analyticsApi.getOverview(months),
    staleTime: 2 * 60 * 1000,
  });
}

export function useActiveSessions() {
  return useQuery({
    queryKey: analyticsKeys.activeSessions,
    queryFn: () => analyticsApi.getActiveSessions(),
    refetchInterval: 30 * 1000, // Poll every 30s for live sessions
  });
}

export function useTrackEvent() {
  return useMutation({
    mutationFn: ({ eventName, properties }: { eventName: string; properties?: Record<string, unknown> }) =>
      analyticsApi.track(eventName, properties),
  });
}

export function useEngagementMetrics(organizationId: string, enabled = true) {
  return useQuery({
    queryKey: analyticsKeys.engagement(organizationId),
    queryFn: () => analyticsApi.getEngagementMetrics(organizationId),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 mins
  });
}

export function useRealTimeMetrics(organizationId: string, enabled = true) {
  return useQuery({
    queryKey: analyticsKeys.realtime(organizationId),
    queryFn: () => analyticsApi.getRealTimeMetrics(organizationId),
    enabled,
    refetchInterval: 15 * 1000, // Poll every 15s for real-time data
    staleTime: 0, // Always fresh
  });
}

export function useEventAnalytics(eventId: string, enabled = true) {
  return useQuery({
    queryKey: analyticsKeys.eventAnalytics(eventId),
    queryFn: () => analyticsApi.getEventAnalytics(eventId),
    enabled,
    staleTime: 2 * 60 * 1000, // 2 mins
  });
}

export function useParticipantRankings(organizationId: string, limit = 20, enabled = true) {
  return useQuery({
    queryKey: analyticsKeys.rankings(organizationId, limit),
    queryFn: () => analyticsApi.getParticipantRankings(organizationId, limit),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 mins
  });
}
