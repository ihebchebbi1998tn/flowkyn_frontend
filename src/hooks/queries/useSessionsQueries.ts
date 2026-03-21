/**
 * @fileoverview Game Session Details React Query Hooks
 *
 * Custom hooks for fetching and managing game session details data
 * using React Query with appropriate caching strategies.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  gameSessionsApi,
  SessionDetails,
  SessionMessage,
  ActiveSession,
} from '../../features/app/api/gameSessions';

/**
 * Query key factory for game sessions
 */
export const gameSessionsKeys = {
  all: ['gameSessions'] as const,
  details: (sessionId: string) => [...gameSessionsKeys.all, 'details', sessionId] as const,
  messages: (sessionId: string) => [...gameSessionsKeys.all, 'messages', sessionId] as const,
  active: (eventId: string) => [...gameSessionsKeys.all, 'active', eventId] as const,
};

/**
 * Hook to fetch comprehensive session details
 * Includes participants, messages, actions, and timeline
 */
export function useSessionDetails(sessionId: string | null, enabled = true) {
  return useQuery({
    queryKey: gameSessionsKeys.details(sessionId || ''),
    queryFn: async () => {
      if (!sessionId) {
        throw new Error('Session ID is required');
      }
      
      try {
        const result = await gameSessionsApi.getSessionDetails(sessionId);
        
        if (!result) {
          throw new Error('Empty response from server');
        }
        
        return result;
      } catch (err) {
        console.error(`[useSessionDetails] Failed to fetch session ${sessionId}:`, err);
        throw err;
      }
    },
    enabled: enabled && !!sessionId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      // Retry 2 times for non-404 errors
      if (error instanceof Error && error.message.includes('404')) {
        return false; // Don't retry 404s
      }
      return failureCount < 2;
    },
  });
}

/**
 * Hook to fetch paginated messages for a session
 */
export function useSessionMessages(
  sessionId: string | null,
  limit: number = 50,
  offset: number = 0,
  enabled = true
) {
  return useQuery({
    queryKey: [...gameSessionsKeys.messages(sessionId || ''), limit, offset],
    queryFn: () => gameSessionsApi.getSessionMessages(sessionId!, limit, offset),
    enabled: enabled && !!sessionId,
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 3 * 60 * 1000, // 3 minutes
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook to fetch active sessions for an event
 */
export function useActiveSessionsForEvent(eventId: string | null, enabled = true) {
  return useQuery({
    queryKey: gameSessionsKeys.active(eventId || ''),
    queryFn: () => gameSessionsApi.getActiveSessionsForEvent(eventId!),
    enabled: enabled && !!eventId,
    staleTime: 30 * 1000, // 30 seconds - live data
    gcTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 15 * 1000, // Refetch every 15 seconds for active sessions
  });
}

/**
 * Hook to close a session
 */
export function useCloseSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sessionId: string) => gameSessionsApi.closeSession(sessionId),
    onSuccess: (_, sessionId) => {
      // Invalidate session details
      queryClient.invalidateQueries({
        queryKey: gameSessionsKeys.details(sessionId),
      });
    },
  });
}

/**
 * Hook to delete a session
 */
export function useDeleteSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sessionId: string) => gameSessionsApi.deleteSession(sessionId),
    onSuccess: (_, sessionId) => {
      // Invalidate session details and remove from cache
      queryClient.removeQueries({
        queryKey: gameSessionsKeys.details(sessionId),
      });
    },
  });
}

/**
 * Hook to export session data
 */
export function useExportSessionData() {
  return useMutation({
    mutationFn: async ({ sessionId, format }: { sessionId: string; format: 'json' | 'csv' }) => {
      const response = await gameSessionsApi.exportSessionData(sessionId, format);

      // Handle file download
      if (response instanceof Blob) {
        const url = window.URL.createObjectURL(response);
        const a = document.createElement('a');
        a.href = url;
        a.download = `session-${sessionId}-${new Date().toISOString().split('T')[0]}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }

      return response;
    },
  });
}
