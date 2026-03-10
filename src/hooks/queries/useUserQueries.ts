import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '@/features/app/api/users';
import { useApiError } from '@/hooks/useApiError';
import { useAuth } from '@/features/app/context/AuthContext';
import { toast } from 'sonner';
import { authKeys } from './useAuthQueries';

export const userKeys = {
  all: ['users'] as const,
  list: (page: number, limit: number) => ['users', 'list', page, limit] as const,
  detail: (id: string) => ['users', id] as const,
};

export function useUsers(page = 1, limit = 10) {
  return useQuery({
    queryKey: userKeys.list(page, limit),
    queryFn: () => usersApi.list(page, limit),
  });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn: () => usersApi.getById(id),
    enabled: !!id,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { setUser } = useAuth();
  const { showError } = useApiError();

  return useMutation({
    mutationFn: (data: { name?: string; language?: string }) => usersApi.updateProfile(data),
    onSuccess: (user) => {
      setUser(user);
      queryClient.setQueryData(authKeys.me, user);
      toast.success('Profile updated');
    },
    onError: (err) => showError(err),
  });
}

export function useUploadAvatar() {
  const queryClient = useQueryClient();
  const { showError } = useApiError();

  return useMutation({
    mutationFn: (file: File) => usersApi.uploadAvatar(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authKeys.me });
      toast.success('Avatar updated');
    },
    onError: (err) => showError(err),
  });
}
