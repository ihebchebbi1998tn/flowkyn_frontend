import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userEngagementApi } from '@/api/userEngagement';

const ENGAGEMENT_KEY = ['user-engagement'];

export function useUserEngagementMetrics(userId: string) {
  return useQuery({
    queryKey: [...ENGAGEMENT_KEY, userId],
    queryFn: () => userEngagementApi.getUserMetrics(userId),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useRecordActivity(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (activityType: 'session_started' | 'game_completed' | 'message_sent' | 'interaction') =>
      userEngagementApi.recordActivity(userId, activityType),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [...ENGAGEMENT_KEY, userId] }),
  });
}

export function useAddUserTag(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (tag: string) => userEngagementApi.addTag(userId, tag),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [...ENGAGEMENT_KEY, userId] }),
  });
}

export function useRemoveUserTag(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (tag: string) => userEngagementApi.removeTag(userId, tag),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [...ENGAGEMENT_KEY, userId] }),
  });
}

export function useUpdateSessionDuration(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (durationMinutes: number) => userEngagementApi.updateSessionDuration(userId, durationMinutes),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [...ENGAGEMENT_KEY, userId] }),
  });
}

export function useUpdateUserStreak(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => userEngagementApi.updateStreak(userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [...ENGAGEMENT_KEY, userId] }),
  });
}

export function useTopUsers(limit = 10) {
  return useQuery({
    queryKey: [...ENGAGEMENT_KEY, 'top', limit],
    queryFn: () => userEngagementApi.getTopUsers(limit),
    staleTime: 10 * 60 * 1000,
  });
}

export function useUsersByTag(tag: string, page = 1, limit = 20) {
  return useQuery({
    queryKey: [...ENGAGEMENT_KEY, 'tag', tag, page, limit],
    queryFn: () => userEngagementApi.getUsersByTag(tag, page, limit),
    enabled: !!tag,
    staleTime: 5 * 60 * 1000,
  });
}

export function useEngagementTimeline(userId: string, days = 30, interval: 'hour' | 'day' | 'week' = 'day') {
  return useQuery({
    queryKey: [...ENGAGEMENT_KEY, 'timeline', userId, days, interval],
    queryFn: () => userEngagementApi.getTimeline(userId, days, interval),
    enabled: !!userId,
    staleTime: 10 * 60 * 1000,
  });
}

export function useEngagementStats() {
  return useQuery({
    queryKey: [...ENGAGEMENT_KEY, 'stats'],
    queryFn: () => userEngagementApi.getStats(),
    staleTime: 10 * 60 * 1000,
  });
}
