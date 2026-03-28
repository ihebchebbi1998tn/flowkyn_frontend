import { useQuery } from '@tanstack/react-query';
import { leaderboardsApi } from '@/features/app/api/leaderboards';

export const leaderboardKeys = {
  detail: (id: string) => ['leaderboards', id] as const,
  entries: (id: string) => ['leaderboards', id, 'entries'] as const,
};

export function useLeaderboard(id: string) {
  return useQuery({
    queryKey: leaderboardKeys.detail(id),
    queryFn: () => leaderboardsApi.getById(id),
    enabled: !!id,
  });
}

export function useLeaderboardEntries(id: string) {
  return useQuery({
    queryKey: leaderboardKeys.entries(id),
    queryFn: () => leaderboardsApi.getEntries(id),
    enabled: !!id,
  });
}
