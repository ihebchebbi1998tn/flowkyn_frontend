import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { organizationsApi } from '@/features/app/api/organizations';
import { useApiError } from '@/hooks/useApiError';
import { toast } from 'sonner';

export const orgKeys = {
  all: ['organizations'] as const,
  detail: (id: string) => ['organizations', id] as const,
  members: (id: string) => ['organizations', id, 'members'] as const,
  people: (id: string) => ['organizations', id, 'people'] as const,
};

export function useMyOrganization() {
  return useQuery({
    queryKey: orgKeys.detail('current'),
    queryFn: () => organizationsApi.getCurrent(),
  });
}

export function useOrganization(id: string) {
  return useQuery({
    queryKey: orgKeys.detail(id),
    queryFn: () => organizationsApi.getById(id),
    enabled: !!id,
  });
}

export function useOrgMembers(orgId: string) {
  return useQuery({
    queryKey: orgKeys.members(orgId),
    queryFn: () => organizationsApi.listMembers(orgId),
    enabled: !!orgId,
  });
}

export function useOrgPeople(orgId: string) {
  return useQuery({
    queryKey: orgKeys.people(orgId),
    queryFn: () => organizationsApi.listPeople(orgId),
    enabled: !!orgId,
  });
}

export function useCreateOrg() {
  const queryClient = useQueryClient();
  const { showError } = useApiError();

  return useMutation({
    mutationFn: (data: { name: string; description?: string; industry?: string; company_size?: string; goals?: string[] }) =>
      organizationsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orgKeys.all });
      toast.success('Organization created');
    },
    onError: (err) => showError(err),
  });
}

export function useUpdateOrg() {
  const queryClient = useQueryClient();
  const { showError } = useApiError();

  return useMutation({
    mutationFn: ({ orgId, data }: { orgId: string; data: { name?: string } }) =>
      organizationsApi.update(orgId, data),
    onSuccess: (_, { orgId }) => {
      queryClient.invalidateQueries({ queryKey: orgKeys.detail(orgId) });
      toast.success('Organization updated');
    },
    onError: (err) => showError(err),
  });
}

export function useInviteOrgMember() {
  const queryClient = useQueryClient();
  const { showError } = useApiError();

  return useMutation({
    mutationFn: ({ orgId, email, roleId, lang }: { orgId: string; email: string; roleId: string; lang?: string }) =>
      organizationsApi.inviteMember(orgId, email, roleId, lang),
    onSuccess: (_, { orgId }) => {
      queryClient.invalidateQueries({ queryKey: orgKeys.members(orgId) });
      queryClient.invalidateQueries({ queryKey: orgKeys.people(orgId) });
      toast.success('Invitation sent');
    },
    onError: (err) => showError(err),
  });
}

export function useAcceptOrgInvitation() {
  const queryClient = useQueryClient();
  const { showError } = useApiError();

  return useMutation({
    mutationFn: (token: string) => organizationsApi.acceptInvitation(token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orgKeys.all });
      toast.success('Invitation accepted');
    },
    onError: (err) => showError(err),
  });
}

export function useRemoveOrgMember() {
  const queryClient = useQueryClient();
  const { showError } = useApiError();

  return useMutation({
    mutationFn: ({ orgId, memberId }: { orgId: string; memberId: string }) =>
      organizationsApi.removeMember(orgId, memberId),
    onSuccess: (_, { orgId }) => {
      queryClient.invalidateQueries({ queryKey: orgKeys.members(orgId) });
      queryClient.invalidateQueries({ queryKey: orgKeys.people(orgId) });
      toast.success('Member removed');
    },
    onError: (err) => showError(err),
  });
}

export function useUploadOrgLogo() {
  const queryClient = useQueryClient();
  const { showError } = useApiError();

  return useMutation({
    mutationFn: ({ orgId, file }: { orgId: string; file: File }) =>
      organizationsApi.uploadLogo(orgId, file),
    onSuccess: (_, { orgId }) => {
      // Org detail screens may use either /organizations/:id or /organizations/current
      // so invalidate both keys to ensure logo_url updates everywhere immediately.
      queryClient.invalidateQueries({ queryKey: orgKeys.detail(orgId) });
      queryClient.invalidateQueries({ queryKey: orgKeys.detail('current') });
      toast.success('Logo updated');
    },
    onError: (err) => showError(err),
  });
}
