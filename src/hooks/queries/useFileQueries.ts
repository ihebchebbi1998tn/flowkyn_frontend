import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { filesApi } from '@/features/app/api/files';
import { useApiError } from '@/hooks/useApiError';
import { toast } from 'sonner';

export const fileKeys = {
  myFiles: (page: number, limit: number) => ['files', 'me', page, limit] as const,
};

export function useMyFiles(page = 1, limit = 20) {
  return useQuery({
    queryKey: fileKeys.myFiles(page, limit),
    queryFn: () => filesApi.listMyFiles(page, limit),
  });
}

export function useUploadFile() {
  const queryClient = useQueryClient();
  const { showError } = useApiError();

  return useMutation({
    mutationFn: (file: File) => filesApi.upload(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] });
      toast.success('File uploaded');
    },
    onError: (err) => showError(err),
  });
}
