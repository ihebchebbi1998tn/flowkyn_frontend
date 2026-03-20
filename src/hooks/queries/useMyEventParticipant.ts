import { useQuery } from '@tanstack/react-query';
import { eventsApi } from '@/features/app/api/events';
import { getGuestToken } from '@/lib/guestTokenPersistence';

export const myParticipantKey = (eventId: string) => ['events', eventId, 'me'] as const;

/** Check if the user has any token (access or event-specific guest) for event-scoped API calls */
export function hasEventToken(eventId?: string): boolean {
  if (localStorage.getItem('access_token')) return true;
  // For guests, check localStorage + cookie backup
  if (eventId && getGuestToken(eventId)) return true;
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

