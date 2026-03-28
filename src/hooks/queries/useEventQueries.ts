import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { eventsApi } from '@/features/app/api/events';
import { useApiError } from '@/hooks/useApiError';
import { toast } from 'sonner';
import type { FlowkynEvent } from '@/types';

export const eventKeys = {
  all: ['events'] as const,
  list: (page: number, limit: number, orgId?: string) => ['events', 'list', page, limit, orgId] as const,
  detail: (id: string) => ['events', id] as const,
  publicInfo: (id: string) => ['events', id, 'public'] as const,
  participants: (id: string) => ['events', id, 'participants'] as const,
  messages: (id: string) => ['events', id, 'messages'] as const,
  posts: (id: string) => ['events', id, 'posts'] as const,
};

export function useEvents(page = 1, limit = 10, orgId?: string) {
  return useQuery({
    queryKey: eventKeys.list(page, limit, orgId),
    queryFn: () => eventsApi.list(page, limit, orgId),
  });
}

export function useEvent(id: string) {
  return useQuery({
    queryKey: eventKeys.detail(id),
    queryFn: () => eventsApi.getById(id),
    enabled: !!id,
  });
}

export function useEventPublicInfo(id: string) {
  return useQuery({
    queryKey: eventKeys.publicInfo(id),
    queryFn: () => eventsApi.getPublicInfo(id),
    enabled: !!id,
  });
}

export function useEventParticipants(eventId: string, page = 1, limit = 50) {
  return useQuery({
    queryKey: eventKeys.participants(eventId),
    queryFn: () => eventsApi.getParticipants(eventId, page, limit),
    enabled: !!eventId,
  });
}

export function useEventMessages(eventId: string, page = 1, limit = 50, enabled = true) {
  return useQuery({
    queryKey: eventKeys.messages(eventId),
    queryFn: () => eventsApi.getMessages(eventId, page, limit),
    enabled: !!eventId && enabled,
  });
}

export function useEventPosts(eventId: string, page = 1, limit = 50, enabled = true) {
  return useQuery({
    queryKey: eventKeys.posts(eventId),
    queryFn: () => eventsApi.getPosts(eventId, page, limit),
    enabled: !!eventId && enabled,
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();
  const { showError } = useApiError();

  return useMutation({
    mutationFn: (data: Parameters<typeof eventsApi.create>[0]) => eventsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventKeys.all });
      toast.success('Event created');
    },
    onError: (err) => showError(err),
  });
}

export function useUpdateEvent() {
  const queryClient = useQueryClient();
  const { showError } = useApiError();

  return useMutation({
    mutationFn: ({ eventId, data }: { eventId: string; data: Partial<FlowkynEvent> }) =>
      eventsApi.update(eventId, data),
    onSuccess: (_, { eventId }) => {
      queryClient.invalidateQueries({ queryKey: eventKeys.detail(eventId) });
      toast.success('Event updated');
    },
    onError: (err) => showError(err),
  });
}

export function useDeleteEvent() {
  const queryClient = useQueryClient();
  const { showError } = useApiError();

  return useMutation({
    mutationFn: (eventId: string) => eventsApi.delete(eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventKeys.all });
      toast.success('Event deleted');
    },
    onError: (err) => showError(err),
  });
}

export function useInviteToEvent() {
  const { showError } = useApiError();

  return useMutation({
    mutationFn: ({ eventId, email, lang, gameId }: { eventId: string; email: string; lang?: string; gameId?: string }) =>
      eventsApi.invite(eventId, email, lang, gameId),
    onSuccess: () => toast.success('Invitation sent'),
    onError: (err) => showError(err),
  });
}

export function useJoinEvent() {
  const queryClient = useQueryClient();
  const { showError } = useApiError();

  return useMutation({
    mutationFn: (eventId: string) => eventsApi.join(eventId),
    onSuccess: (result, eventId) => {
      queryClient.invalidateQueries({ queryKey: eventKeys.participants(eventId) });
      // Store member participant ID for this event so real-time games and posts
      // can use the correct participant identity for authenticated users.
      if ((result as any)?.participant_id) {
        localStorage.setItem(`member_participant_id_${eventId}`, (result as any).participant_id);
      }
    },
    onError: (err) => {
      // Joining is idempotent from a UX perspective; if the backend says we're already a participant,
      // don't show an error toast. The calling code will handle 409s as a "success" case.
      if ((err as any)?.statusCode === 409 && (err as any)?.code === 'ALREADY_PARTICIPANT') {
        return;
      }
      showError(err);
    },
  });
}

export function useLeaveEvent() {
  const queryClient = useQueryClient();
  const { showError } = useApiError();

  return useMutation({
    mutationFn: (eventId: string) => eventsApi.leave(eventId),
    onSuccess: (_, eventId) => {
      queryClient.invalidateQueries({ queryKey: eventKeys.participants(eventId) });
    },
    onError: (err) => showError(err),
  });
}

export function useAcceptEventInvitation() {
  const queryClient = useQueryClient();
  const { showError } = useApiError();

  return useMutation({
    mutationFn: ({ eventId, token }: { eventId: string; token: string }) =>
      eventsApi.acceptInvitation(eventId, token),
    onSuccess: (result, { eventId }) => {
      queryClient.invalidateQueries({ queryKey: eventKeys.participants(eventId) });
      // Store participant ID so invited users have proper identity for game actions + posts
      if ((result as any)?.participant_id) {
        localStorage.setItem(`member_participant_id_${eventId}`, (result as any).participant_id);
      }
    },
    onError: (err) => showError(err),
  });
}

export function useJoinAsGuest() {
  const queryClient = useQueryClient();
  const { showError } = useApiError();

  return useMutation({
    mutationFn: ({ eventId, data }: { eventId: string; data: Parameters<typeof eventsApi.joinAsGuest>[1] }) =>
      eventsApi.joinAsGuest(eventId, data),
    onSuccess: (_, { eventId }) => {
      queryClient.invalidateQueries({ queryKey: eventKeys.participants(eventId) });
    },
    onError: (err) => {
      // Don't show toast for NAME_TAKEN — EventLobby/GamePlay show it in the banner
      const code = (err as any)?.code ?? (err as any)?.response?.data?.code;
      if (code === 'NAME_TAKEN') return;
      showError(err);
    },
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  const { showError } = useApiError();

  return useMutation({
    mutationFn: ({ eventId, participantId, message }: { eventId: string; participantId: string; message: string }) =>
      eventsApi.sendMessage(eventId, participantId, message),
    onSuccess: (_, { eventId }) => {
      queryClient.invalidateQueries({ queryKey: eventKeys.messages(eventId) });
    },
    onError: (err) => showError(err),
  });
}

export function useValidateEventToken(eventId: string, token: string) {
  return useQuery({
    queryKey: ['events', eventId, 'validate-token', token],
    queryFn: () => eventsApi.validateToken(eventId, token),
    enabled: !!eventId && !!token,
  });
}

export function usePauseEvent() {
  const queryClient = useQueryClient();
  const { showError } = useApiError();

  return useMutation({
    mutationFn: (eventId: string) => eventsApi.update(eventId, { status: 'paused' as any }),
    onSuccess: (_, eventId) => {
      queryClient.invalidateQueries({ queryKey: eventKeys.detail(eventId) });
      toast.success('Event paused');
    },
    onError: (err) => showError(err),
  });
}

export function useStopEvent() {
  const queryClient = useQueryClient();
  const { showError } = useApiError();

  return useMutation({
    mutationFn: (eventId: string) => eventsApi.update(eventId, { status: 'completed' }),
    onSuccess: (_, eventId) => {
      queryClient.invalidateQueries({ queryKey: eventKeys.detail(eventId) });
      toast.success('Event stopped');
    },
    onError: (err) => showError(err),
  });
}

export function useCancelEvent() {
  const queryClient = useQueryClient();
  const { showError } = useApiError();

  return useMutation({
    mutationFn: (eventId: string) => eventsApi.update(eventId, { status: 'cancelled' }),
    onSuccess: (_, eventId) => {
      queryClient.invalidateQueries({ queryKey: eventKeys.detail(eventId) });
      toast.success('Event cancelled');
    },
    onError: (err) => showError(err),
  });
}
