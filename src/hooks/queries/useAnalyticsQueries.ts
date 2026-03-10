import { useQuery, useMutation } from '@tanstack/react-query';
import { analyticsApi } from '@/features/app/api/analytics';

export const analyticsKeys = {
  dashboard: ['analytics', 'dashboard'] as const,
  overview: (months: number) => ['analytics', 'overview', months] as const,
  activeSessions: ['analytics', 'active-sessions'] as const,
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
