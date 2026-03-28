import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '@/features/app/api/notifications';
import { useApiError } from '@/hooks/useApiError';

export const notificationKeys = {
  all: ['notifications'] as const,
  list: (page: number, limit: number) => ['notifications', 'list', page, limit] as const,
};

export function useNotifications(page = 1, limit = 20) {
  return useQuery({
    queryKey: notificationKeys.list(page, limit),
    queryFn: () => notificationsApi.list(page, limit),
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  const { showError } = useApiError();

  return useMutation({
    mutationFn: (id: string) => notificationsApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
    onError: (err) => showError(err),
  });
}
