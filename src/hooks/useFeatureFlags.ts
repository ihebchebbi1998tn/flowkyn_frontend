import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { featureFlagsApi, FeatureFlag, CreateFlagRequest, UpdateFlagRequest } from '@/api/featureFlags';

const FEATURE_FLAGS_QUERY_KEY = ['feature-flags'];

export function useFeatureFlags(page = 1, limit = 20) {
  return useQuery({
    queryKey: [...FEATURE_FLAGS_QUERY_KEY, page, limit],
    queryFn: () => featureFlagsApi.list(page, limit),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useFeatureFlag(key: string) {
  return useQuery({
    queryKey: [...FEATURE_FLAGS_QUERY_KEY, key],
    queryFn: () => featureFlagsApi.get(key),
    staleTime: 5 * 60 * 1000,
    enabled: !!key,
  });
}

export function useCreateFeatureFlag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateFlagRequest) => featureFlagsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FEATURE_FLAGS_QUERY_KEY });
    },
  });
}

export function useUpdateFeatureFlag(key: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateFlagRequest) => featureFlagsApi.update(key, data),
    onSuccess: (updatedFlag) => {
      queryClient.setQueryData([...FEATURE_FLAGS_QUERY_KEY, key], updatedFlag);
      queryClient.invalidateQueries({ queryKey: FEATURE_FLAGS_QUERY_KEY });
    },
  });
}

export function useDeleteFeatureFlag(key: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => featureFlagsApi.delete(key),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FEATURE_FLAGS_QUERY_KEY });
    },
  });
}

export function useEvaluateFeatureFlag(flagKey: string, userId?: string, orgId?: string) {
  return useQuery({
    queryKey: [...FEATURE_FLAGS_QUERY_KEY, 'evaluate', flagKey, userId, orgId],
    queryFn: () => featureFlagsApi.evaluate(flagKey, userId, orgId),
    enabled: !!flagKey,
    staleTime: 1 * 60 * 1000, // 1 minute for evaluation
  });
}

export function useFeatureFlagStats(flagKey: string) {
  return useQuery({
    queryKey: [...FEATURE_FLAGS_QUERY_KEY, 'stats', flagKey],
    queryFn: () => featureFlagsApi.getStats(flagKey),
    enabled: !!flagKey,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}
