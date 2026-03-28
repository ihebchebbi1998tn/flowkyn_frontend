import { api } from '@/features/app/api/client';

export interface GameContent {
  id: string;
  game_key: string;
  content_type: 'prompt' | 'puzzle' | 'challenge' | 'scenario';
  title: string;
  content: string;
  difficulty_level: 'easy' | 'medium' | 'hard';
  usage_count: number;
  approval_status: 'pending' | 'approved' | 'rejected';
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CreateContentRequest {
  gameKey: string;
  contentType: 'prompt' | 'puzzle' | 'challenge' | 'scenario';
  title: string;
  content: string;
  difficultyLevel: 'easy' | 'medium' | 'hard';
  category?: string;
  tags?: string[];
}

export const gameContentApi = {
  list: (gameKey?: string, contentType?: string, difficulty?: string, approval?: string, page = 1, limit = 20) =>
    api.get<{ data: GameContent[]; total: number }>('/admin/game-content', {
      gameKey: gameKey || '',
      contentType: contentType || '',
      difficulty: difficulty || '',
      approvalStatus: approval || '',
      page: String(page),
      limit: String(limit),
    }),

  get: (id: string) =>
    api.get<GameContent>(`/admin/game-content/${id}`),

  create: (data: CreateContentRequest) =>
    api.post<GameContent>('/admin/game-content', data),

  update: (id: string, data: Partial<CreateContentRequest>) =>
    api.put<GameContent>(`/admin/game-content/${id}`, data),

  delete: (id: string) =>
    api.del(`/admin/game-content/${id}`),

  approve: (id: string) =>
    api.post<GameContent>(`/admin/game-content/${id}/approve`),

  reject: (id: string, reason: string) =>
    api.post<GameContent>(`/admin/game-content/${id}/reject`, { reason }),

  getGameStats: (gameKey: string) =>
    api.get(`/admin/game-content/game/${gameKey}/stats`),

  getTrending: (limit = 10, timeframeHours = 24) =>
    api.get<GameContent[]>('/admin/game-content/trending', {
      limit: String(limit),
      timeframeHours: String(timeframeHours),
    }),
};
