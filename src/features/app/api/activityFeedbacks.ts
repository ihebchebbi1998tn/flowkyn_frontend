import { api } from './client';
import type { PaginatedResponse } from '@/types';

export type ActivityFeedbackCategory = 'experience' | 'ui' | 'gameplay' | 'voice_audio' | 'other';
export type ActivityFeedbackSource = 'end_clicked' | 'back_to_events' | 'activity_completed' | 'end_and_close';

export interface ActivityFeedback {
  id: string;
  event_id: string;
  game_session_id: string | null;
  game_type_key: string;
  participant_id: string;
  reporter_name: string;
  reporter_avatar_url: string | null;
  rating: number;
  category: string | null;
  comment: string;
  source: string;
  ip_address: string | null;
  created_at: string;
}

export interface CreateActivityFeedbackPayload {
  eventId: string;
  gameSessionId: string | null;
  gameTypeKey: string;
  participantId: string;
  rating: number;
  category: ActivityFeedbackCategory;
  comment: string;
  source: ActivityFeedbackSource;
}

export interface ActivityFeedbackStats {
  totalCount: number;
  avgRating: string | null;
  ratingCounts: Record<string, number>;
  categoryCounts: Array<{ category: string; count: number }>;
}

export interface ActivityFeedbackListFilters {
  eventId?: string;
  gameTypeKey?: string;
  rating?: number;
  category?: string;
  search?: string;
}

export interface ActivityFeedbackListResponse {
  data: ActivityFeedback[];
  pagination: PaginatedResponse<ActivityFeedback>['pagination'];
}

export const activityFeedbacksApi = {
  create: (data: CreateActivityFeedbackPayload) =>
    api.post<{ message: string; data: ActivityFeedback }>('/activity-feedbacks', data),
};

