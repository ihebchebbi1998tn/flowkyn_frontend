import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { gameContentApi, GameContent, CreateContentRequest } from '@/api/gameContent';

const GAME_CONTENT_KEY = ['game-content'];

export function useGameContent(gameKey?: string, contentType?: string, difficulty?: string, approval?: string, page = 1, limit = 20) {
  return useQuery({
    queryKey: [...GAME_CONTENT_KEY, gameKey, contentType, difficulty, approval, page, limit],
    queryFn: () => gameContentApi.list(gameKey, contentType, difficulty, approval, page, limit),
    staleTime: 5 * 60 * 1000,
  });
}

export function useGameContentItem(id: string) {
  return useQuery({
    queryKey: [...GAME_CONTENT_KEY, id],
    queryFn: () => gameContentApi.get(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateGameContent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateContentRequest) => gameContentApi.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: GAME_CONTENT_KEY }),
  });
}

export function useUpdateGameContent(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<CreateContentRequest>) => gameContentApi.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: GAME_CONTENT_KEY }),
  });
}

export function useDeleteGameContent(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => gameContentApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: GAME_CONTENT_KEY }),
  });
}

export function useApproveGameContent(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => gameContentApi.approve(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: GAME_CONTENT_KEY }),
  });
}

export function useRejectGameContent(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (reason: string) => gameContentApi.reject(id, reason),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: GAME_CONTENT_KEY }),
  });
}

export function useGameContentStats(gameKey: string) {
  return useQuery({
    queryKey: [...GAME_CONTENT_KEY, 'stats', gameKey],
    queryFn: () => gameContentApi.getGameStats(gameKey),
    enabled: !!gameKey,
    staleTime: 10 * 60 * 1000,
  });
}

export function useTrendingGameContent(limit?: number, timeframe?: number) {
  return useQuery({
    queryKey: [...GAME_CONTENT_KEY, 'trending', limit, timeframe],
    queryFn: () => gameContentApi.getTrending(limit, timeframe),
    staleTime: 10 * 60 * 1000,
  });
}
