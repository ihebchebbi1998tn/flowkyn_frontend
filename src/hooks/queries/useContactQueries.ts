import { useMutation } from '@tanstack/react-query';
import { contactApi } from '@/features/app/api/contact';
import { useApiError } from '@/hooks/useApiError';
import { toast } from 'sonner';

export function useSubmitContact() {
  const { showError } = useApiError();

  return useMutation({
    mutationFn: (data: { name: string; email: string; subject?: string; message: string }) =>
      contactApi.submit(data),
    onSuccess: () => toast.success('Message sent successfully'),
    onError: (err) => showError(err),
  });
}
