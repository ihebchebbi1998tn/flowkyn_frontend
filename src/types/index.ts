/* ── Core Types ── */

export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  language: string;
  status: 'pending' | 'active' | 'suspended';
  onboarding_completed: boolean;
  // Joined from admin list
  organization_name?: string;
  organization_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  description?: string;
  industry?: string;
  company_size?: string;
  goals?: string[];
  owner_user_id: string;
  owner_name?: string;
  member_count?: number;
  event_count?: number;
  plan_name?: string;
  created_at: string;
  updated_at: string;
}

export interface OrgMember {
  id: string;
  organization_id: string;
  user_id: string;
  role_id: string;
  role_name: string;
  name: string;
  email: string;
  avatar_url?: string;
  is_subscription_manager: boolean;
  status: string;
  joined_at: string;
  created_at: string;
}

export interface FlowkynEvent {
  id: string;
  organization_id: string;
  created_by_member_id: string;
  title: string;
  description: string;
  event_mode: 'sync' | 'async';
  visibility: 'public' | 'private';
  max_participants: number;
  start_time: string | null;
  end_time: string | null;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  // Joined from organization
  organization_name?: string;
  organization_logo?: string;
  // Event settings (joined)
  allow_guests?: boolean;
  allow_chat?: boolean;
  auto_start_games?: boolean;
  max_rounds?: number;
  allow_participant_game_control?: boolean;
  created_at: string;
  updated_at: string;
}

export interface GameType {
  id: string;
  key: string;
  name: string;
  category: string;
  is_sync: boolean;
  min_players: number;
  max_players: number;
  description: string;
  created_at: string;
}

export interface GameSession {
  id: string;
  event_id: string;
  game_type_id: string;
  status: 'active' | 'paused' | 'finished';
  current_round: number;
  total_rounds?: number;
  game_duration_minutes: number;
  expires_at?: string;
  metadata?: Record<string, unknown>;
  started_at: string;
  ended_at?: string;
  active_round_id?: string | null;
  // Joined fields
  game_type_name?: string;
  game_type_key?: string;
  event_title?: string;
  organization_name?: string;
  action_count?: number;
}

export interface GameParticipant {
  id: string;
  userId: string;
  name: string;
  avatar?: string;
  score: number;
  isReady: boolean;
}

export interface GameAction {
  id: string;
  game_session_id: string;
  round_id: string;
  participant_id: string;
  action_type: string;
  payload: Record<string, unknown>;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  data: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AnalyticsData {
  labels: string[];
  datasets: { label: string; data: number[]; color?: string }[];
}

export interface MetricCard {
  label: string;
  value: string | number;
  change?: number;
  icon?: string;
}

/* ── Coffee Roulette Configuration Types ── */

export type TopicSelectionStrategy = 'random' | 'sequential' | 'weighted';
export type QuestionSelectionStrategy = 'random' | 'sequential' | 'all';
export type QuestionType = 'general' | 'topic-specific';
export type DifficultyLevel = 'easy' | 'moderate' | 'challenging';

export interface CoffeeRouletteConfig {
  id: string;
  event_id: string;
  duration_minutes: number;
  max_prompts: number;
  topic_selection_strategy: TopicSelectionStrategy;
  question_selection_strategy: QuestionSelectionStrategy;
  allow_general_questions: boolean;
  shuffle_on_repeat: boolean;
  created_by_member_id: string;
  created_at: string;
  updated_at: string;
}

export interface CoffeeRouletteTopic {
  id: string;
  config_id: string;
  title: string;
  description?: string;
  icon?: string;
  weight: number;
  display_order: number;
  is_active: boolean;
  created_by_member_id: string;
  created_at: string;
  updated_at: string;
}

export interface CoffeeRouletteQuestion {
  id: string;
  config_id: string;
  text: string;
  category?: string;
  difficulty: DifficultyLevel;
  question_type: QuestionType;
  weight: number;
  display_order: number;
  is_active: boolean;
  created_by_member_id: string;
  created_at: string;
  updated_at: string;
}

export interface CoffeeRouletteTopicQuestion {
  id: string;
  topic_id: string;
  question_id: string;
  display_order: number;
  created_at: string;
}

export interface CoffeeRoulettePairContext {
  id: string;
  event_id: string;
  participant1_id: string;
  participant2_id: string;
  session_start_time: string;
  session_end_time?: string;
  duration_seconds?: number;
  topic_id?: string;
  questions_used: string[];
  questions_count: number;
  created_at: string;
  updated_at: string;
}

export interface CreateConfigRequest {
  event_id: string;
  duration_minutes?: number;
  max_prompts?: number;
  topic_selection_strategy?: TopicSelectionStrategy;
  question_selection_strategy?: QuestionSelectionStrategy;
  allow_general_questions?: boolean;
  shuffle_on_repeat?: boolean;
}

export interface UpdateConfigRequest {
  duration_minutes?: number;
  max_prompts?: number;
  topic_selection_strategy?: TopicSelectionStrategy;
  question_selection_strategy?: QuestionSelectionStrategy;
  allow_general_questions?: boolean;
  shuffle_on_repeat?: boolean;
}

export interface CreateTopicRequest {
  config_id: string;
  title: string;
  description?: string;
  icon?: string;
  weight?: number;
  display_order?: number;
}

export interface UpdateTopicRequest {
  title?: string;
  description?: string;
  icon?: string;
  weight?: number;
  display_order?: number;
  is_active?: boolean;
}

export interface CreateQuestionRequest {
  config_id: string;
  text: string;
  category?: string;
  difficulty?: DifficultyLevel;
  question_type?: QuestionType;
  weight?: number;
  display_order?: number;
}

export interface UpdateQuestionRequest {
  text?: string;
  category?: string;
  difficulty?: DifficultyLevel;
  question_type?: QuestionType;
  weight?: number;
  display_order?: number;
  is_active?: boolean;
}

export interface SelectedQuestion {
  id: string;
  text: string;
  category?: string;
  difficulty: DifficultyLevel;
}

export interface SelectedTopic {
  id: string;
  title: string;
  description?: string;
  icon?: string;
}

export interface ConfigStats {
  config_id: string;
  event_id: string;
  total_topics: number;
  active_topics: number;
  total_questions: number;
  active_questions: number;
  general_questions: number;
  topic_specific_questions: number;
  total_pairings: number;
  average_duration_seconds: number;
  last_updated: string;
}

export interface TopicStats {
  topic_id: string;
  title: string;
  total_questions: number;
  times_selected: number;
  average_difficulty: number;
  last_used?: string;
}

