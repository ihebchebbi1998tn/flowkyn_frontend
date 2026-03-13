import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { eventsApi } from '@/features/app/api/events';

export const eventProfileKey = (eventId: string) => ['events', eventId, 'profile'] as const;

export function useEventProfile(eventId: string | undefined) {
  return useQuery({
    queryKey: eventId ? eventProfileKey(eventId) : ['events', 'profile', 'disabled'],
    queryFn: () => eventsApi.getMyProfile(eventId!),
    enabled: !!eventId,
  });
}

export function useUpsertEventProfile(eventId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { display_name: string; avatar_url?: string | null }) =>
      eventsApi.upsertMyProfile(eventId!, payload),
    onSuccess: () => {
      if (eventId) {
        queryClient.invalidateQueries({ queryKey: eventProfileKey(eventId) });
      }
    },
  });
}

