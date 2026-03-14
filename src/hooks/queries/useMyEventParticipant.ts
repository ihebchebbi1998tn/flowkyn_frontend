import { useQuery } from '@tanstack/react-query';
import { eventsApi } from '@/features/app/api/events';

export const myParticipantKey = (eventId: string) => ['events', eventId, 'me'] as const;

/** Check if the user has any token (access or event-specific guest) for event-scoped API calls */
export function hasEventToken(eventId?: string): boolean {
  if (localStorage.getItem('access_token')) return true;
  if (localStorage.getItem('guest_token')) return true;
  if (eventId && localStorage.getItem(`guest_token_${eventId}`)) return true;
  return false;
}

export function useMyEventParticipant(eventId: string | undefined) {
  return useQuery({
    queryKey: eventId ? myParticipantKey(eventId) : ['events', 'me', 'disabled'],
    queryFn: () => eventsApi.getMyParticipant(eventId!),
    enabled: !!eventId && hasEventToken(eventId),
    retry: false,
  });
}

