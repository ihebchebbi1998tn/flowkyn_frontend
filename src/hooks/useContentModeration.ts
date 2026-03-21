import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contentModerationApi, ContentModerationItem } from '@/api/contentModeration';

const MODERATION_KEY = ['content-moderation'];

export function useModerationQueue(status?: string, contentType?: string, page = 1, limit = 20) {
  return useQuery({
    queryKey: [...MODERATION_KEY, status, contentType, page, limit],
    queryFn: () => contentModerationApi.list(status, contentType, page, limit),
    staleTime: 3 * 60 * 1000,
  });
}

export function useModerationItem(id: string) {
  return useQuery({
    queryKey: [...MODERATION_KEY, id],
    queryFn: () => contentModerationApi.get(id),
    enabled: !!id,
    staleTime: 3 * 60 * 1000,
  });
}

export function useFlagContent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { contentId: string; contentType: string; reason: string; description?: string }) =>
      contentModerationApi.flag(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: MODERATION_KEY }),
  });
}

export function useApproveModerationItem(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (notes?: string) => contentModerationApi.approve(id, notes),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: MODERATION_KEY }),
  });
}

export function useRejectModerationItem(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (notes?: string) => contentModerationApi.reject(id, notes),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: MODERATION_KEY }),
  });
}

export function useArchiveModerationItem(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => contentModerationApi.archive(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: MODERATION_KEY }),
  });
}

export function useModerationStats() {
  return useQuery({
    queryKey: [...MODERATION_KEY, 'stats'],
    queryFn: () => contentModerationApi.getStats(),
    staleTime: 10 * 60 * 1000,
  });
}

export function useOverdueModerationItems(hours = 24) {
  return useQuery({
    queryKey: [...MODERATION_KEY, 'overdue', hours],
    queryFn: () => contentModerationApi.getOverdue(hours),
    staleTime: 5 * 60 * 1000,
  });
}

export function useBulkApproveModerationItems() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (itemIds: string[]) => contentModerationApi.bulkApprove(itemIds),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: MODERATION_KEY }),
  });
}

export function useBulkRejectModerationItems() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (itemIds: string[]) => contentModerationApi.bulkReject(itemIds),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: MODERATION_KEY }),
  });
}
