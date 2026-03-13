import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { eventsApi } from '@/features/app/api/events';

export const eventProfileKey = (eventId: string) => ['events', eventId, 'profile'] as const;

/** Check if the user has any token (access or event-specific guest) */
function hasToken(eventId?: string): boolean {
  if (localStorage.getItem('access_token')) return true;
  if (localStorage.getItem('guest_token')) return true;
  if (eventId && localStorage.getItem(`guest_token_${eventId}`)) return true;
  return false;
}

export function useEventProfile(eventId: string | undefined) {
  return useQuery({
    queryKey: eventId ? eventProfileKey(eventId) : ['events', 'profile', 'disabled'],
    queryFn: () => eventsApi.getMyProfile(eventId!),
    enabled: !!eventId && hasToken(eventId),
    retry: false,
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

