import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi } from '@/features/app/api/auth';
import { useAuth } from '@/features/app/context/AuthContext';
import { useApiError } from '@/hooks/useApiError';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export const authKeys = {
  me: ['auth', 'me'] as const,
};

export function useCurrentUser() {
  return useQuery({
    queryKey: authKeys.me,
    queryFn: () => authApi.me(),
    staleTime: 5 * 60 * 1000,
    enabled: !!localStorage.getItem('access_token'),
  });
}

export function useLogin() {
  const { login } = useAuth();
  const { showError } = useApiError();

  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) => login(email, password),
    onError: (err) => showError(err),
  });
}

export function useRegister() {
  const { register } = useAuth();
  const { showError } = useApiError();

  return useMutation({
    mutationFn: (data: { email: string; password: string; name: string; lang?: string }) => register(data),
    onError: (err) => showError(err),
  });
}

export function useForgotPassword() {
  const { showError } = useApiError();

  return useMutation({
    mutationFn: ({ email, lang }: { email: string; lang?: string }) => authApi.forgotPassword(email, lang),
    onSuccess: () => toast.success('Password reset email sent'),
    onError: (err) => showError(err),
  });
}

export function useResetPassword() {
  const { showError } = useApiError();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: ({ token, password }: { token: string; password: string }) => authApi.resetPassword(token, password),
    onSuccess: () => {
      toast.success('Password reset successfully');
      navigate('/login');
    },
    onError: (err) => showError(err),
  });
}

export function useVerifyEmail() {
  const { showError } = useApiError();

  return useMutation({
    mutationFn: (token: string) => authApi.verifyEmail(token),
    onError: (err) => showError(err),
  });
}

export function useCompleteOnboarding() {
  const queryClient = useQueryClient();
  const { setUser } = useAuth();
  const { showError } = useApiError();

  return useMutation({
    mutationFn: () => authApi.completeOnboarding(),
    onSuccess: (user) => {
      setUser(user);
      queryClient.setQueryData(authKeys.me, user);
    },
    onError: (err) => showError(err),
  });
}
