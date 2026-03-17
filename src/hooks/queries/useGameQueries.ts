import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { gamesApi } from '@/features/app/api/games';
import { useApiError } from '@/hooks/useApiError';
import { toast } from 'sonner';

export const gameKeys = {
  types: ['game-types'] as const,
};

export function useGameTypes() {
  return useQuery({
    queryKey: gameKeys.types,
    queryFn: () => gamesApi.listTypes(),
    staleTime: 30 * 60 * 1000, // game types rarely change
  });
}

export function useStartGameSession() {
  const { showError } = useApiError();

  return useMutation({
    mutationFn: ({ eventId, gameTypeId, totalRounds }: { eventId: string; gameTypeId: string; totalRounds?: number }) =>
      gamesApi.startSession(eventId, gameTypeId, totalRounds),
    onError: (err) => showError(err),
  });
}

export function useStartRound() {
  const { showError } = useApiError();

  return useMutation({
    mutationFn: (sessionId: string) => gamesApi.startRound(sessionId),
    onError: (err) => showError(err),
  });
}

export function useSubmitGameAction() {
  const { showError } = useApiError();

  return useMutation({
    mutationFn: (data: Parameters<typeof gamesApi.submitAction>[0]) => gamesApi.submitAction(data),
    onError: (err) => showError(err),
  });
}

export function useFinishGameSession() {
  const { showError } = useApiError();

  return useMutation({
    mutationFn: (sessionId: string) => gamesApi.finishSession(sessionId),
    onSuccess: () => toast.success('Game finished'),
    onError: (err) => showError(err),
  });
}
