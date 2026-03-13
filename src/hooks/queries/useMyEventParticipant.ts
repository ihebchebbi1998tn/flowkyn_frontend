import { useQuery } from '@tanstack/react-query';
import { eventsApi } from '@/features/app/api/events';

export const myParticipantKey = (eventId: string) => ['events', eventId, 'me'] as const;

export function useMyEventParticipant(eventId: string | undefined) {
  return useQuery({
    queryKey: eventId ? myParticipantKey(eventId) : ['events', 'me', 'disabled'],
    queryFn: () => eventsApi.getMyParticipant(eventId!),
    enabled: !!eventId,
  });
}

