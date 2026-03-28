import { api } from '@/features/app/api/client';

export interface FeatureFlag {
  id: string;
  key: string;
  name: string;
  description?: string;
  enabled: boolean;
  rollout_percentage: number;
  is_multivariant: boolean;
  variants?: Record<string, { percentage: number; config: unknown }>;
  targeting_rules?: { org_ids?: string[]; user_ids?: string[]; user_tags?: string[] };
  created_by: string;
  created_at: string;
  updated_at: string;
  updated_by?: string;
  deleted_at?: string;
}

export interface CreateFlagRequest {
  key: string;
  name: string;
  description?: string;
  enabled?: boolean;
  rollout_percentage?: number;
  is_multivariant?: boolean;
  variants?: Record<string, { percentage: number; config: unknown }>;
  targeting_rules?: { org_ids?: string[]; user_ids?: string[]; user_tags?: string[] };
}

export interface UpdateFlagRequest {
  name?: string;
  description?: string;
  enabled?: boolean;
  rollout_percentage?: number;
  is_multivariant?: boolean;
  variants?: Record<string, { percentage: number; config: unknown }>;
  targeting_rules?: { org_ids?: string[]; user_ids?: string[]; user_tags?: string[] };
}

export interface FlagEvaluationResult {
  enabled: boolean;
  variant?: string;
}

export interface FlagStats {
  total_evaluations: number;
  enabled_count: number;
  variant_distribution: Record<string, number>;
}

export const featureFlagsApi = {
  list: (page = 1, limit = 20) =>
    api.get<{ data: FeatureFlag[]; pagination: any }>('/admin/feature-flags', {
      page: String(page),
      limit: String(limit),
    }),

  get: (key: string) =>
    api.get<FeatureFlag>(`/admin/feature-flags/${key}`),

  create: (data: CreateFlagRequest) =>
    api.post<FeatureFlag>('/admin/feature-flags', data),

  update: (key: string, data: UpdateFlagRequest) =>
    api.put<FeatureFlag>(`/admin/feature-flags/${key}`, data),

  delete: (key: string) =>
    api.del(`/admin/feature-flags/${key}`),

  evaluate: (key: string, userId?: string, orgId?: string) =>
    api.post<FlagEvaluationResult>(`/admin/feature-flags/${key}/evaluate`, {
      userId,
      orgId,
    }),

  getStats: (key: string) =>
    api.get<FlagStats>(`/admin/feature-flags/${key}/stats`),
};
