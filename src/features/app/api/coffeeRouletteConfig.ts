/**
 * @fileoverview Coffee Roulette Configuration API Client
 *
 * Manages dynamic Coffee Roulette configuration:
 * - Event-specific settings (duration, strategies)
 * - Custom topics (create, read, update, delete, reorder)
 * - Custom questions (create, read, update, delete, filtering)
 * - Topic-question mappings (assign, unassign, reorder)
 * - Question selection (by strategy)
 * - Session tracking and statistics
 *
 * All endpoints are mounted under /api/coffee-roulette
 * and require authentication via JWT.
 */

import { api } from './client';
import type {
  CoffeeRouletteConfig,
  CoffeeRouletteTopic,
  CoffeeRouletteQuestion,
  CoffeeRouletteTopicQuestion,
  CoffeeRoulettePairContext,
  TopicSelectionStrategy,
  QuestionSelectionStrategy,
  QuestionType,
  DifficultyLevel,
  CreateConfigRequest,
  UpdateConfigRequest,
  CreateTopicRequest,
  UpdateTopicRequest,
  CreateQuestionRequest,
  UpdateQuestionRequest,
  SelectedQuestion,
  SelectedTopic,
  ConfigStats,
  TopicStats,
} from '@/types';

export const coffeeRouletteConfigApi = {
  // ─────────────────────── CONFIGURATION ───────────────────────────────

  /**
   * Create a new Coffee Roulette configuration for an event
   */
  createConfig: (eventId: string, data: Partial<CreateConfigRequest>) =>
    api.post<CoffeeRouletteConfig>(
      '/coffee-roulette/config',
      { event_id: eventId, ...data },
      eventId
    ),

  /**
   * Get configuration for an event
   */
  getConfig: (eventId: string) =>
    api.get<CoffeeRouletteConfig>(
      `/coffee-roulette/config/${eventId}`,
      undefined,
      eventId
    ),

  /**
   * Get full configuration with topics and questions
   */
  getConfigWithDetails: (eventId: string) =>
    api.get<CoffeeRouletteConfig & {
      topics: CoffeeRouletteTopic[];
      questions: CoffeeRouletteQuestion[];
    }>(
      `/coffee-roulette/config/${eventId}/with-details`,
      undefined,
      eventId
    ),

  /**
   * Update configuration settings
   */
  updateConfig: (configId: string, eventId: string, data: UpdateConfigRequest) =>
    api.patch<CoffeeRouletteConfig>(
      `/coffee-roulette/config/${configId}`,
      data,
      eventId
    ),

  /**
   * Delete configuration
   */
  deleteConfig: (configId: string, eventId: string) =>
    api.del(
      `/coffee-roulette/config/${configId}`,
      eventId
    ),

  // ─────────────────────── TOPICS ───────────────────────────────

  /**
   * Create a new topic
   */
  createTopic: (
    configId: string,
    eventId: string,
    data: Omit<CreateTopicRequest, 'config_id'>
  ) =>
    api.post<CoffeeRouletteTopic>(
      '/coffee-roulette/topics',
      { config_id: configId, ...data },
      eventId
    ),

  /**
   * Get all topics for a configuration
   */
  getTopics: (configId: string, eventId: string, activeOnly = true) =>
    api.get<CoffeeRouletteTopic[]>(
      `/coffee-roulette/topics/${configId}`,
      { activeOnly: String(activeOnly) },
      eventId
    ),

  /**
   * Get a topic with its assigned questions
   */
  getTopicWithQuestions: (topicId: string, eventId: string) =>
    api.get<CoffeeRouletteTopic & { questions: CoffeeRouletteQuestion[] }>(
      `/coffee-roulette/topics/${topicId}/details`,
      undefined,
      eventId
    ),

  /**
   * Update a topic
   */
  updateTopic: (topicId: string, eventId: string, data: UpdateTopicRequest) =>
    api.patch<CoffeeRouletteTopic>(
      `/coffee-roulette/topics/${topicId}`,
      data,
      eventId
    ),

  /**
   * Delete a topic
   */
  deleteTopic: (topicId: string, eventId: string) =>
    api.del(
      `/coffee-roulette/topics/${topicId}`,
      eventId
    ),

  // ─────────────────────── QUESTIONS ───────────────────────────────

  /**
   * Create a new question
   */
  createQuestion: (
    configId: string,
    eventId: string,
    data: Omit<CreateQuestionRequest, 'config_id'>
  ) =>
    api.post<CoffeeRouletteQuestion>(
      '/coffee-roulette/questions',
      { config_id: configId, ...data },
      eventId
    ),

  /**
   * Get all questions for a configuration
   */
  getQuestions: (
    configId: string,
    eventId: string,
    filters?: {
      type?: QuestionType;
      activeOnly?: boolean;
    }
  ) => {
    const params: Record<string, string> = {};
    if (filters) {
      if (filters.type) params.type = filters.type;
      if (filters.activeOnly !== undefined) params.activeOnly = String(filters.activeOnly);
    }
    return api.get<CoffeeRouletteQuestion[]>(
      `/coffee-roulette/questions/${configId}`,
      Object.keys(params).length > 0 ? params : undefined,
      eventId
    );
  },

  /**
   * Update a question
   */
  updateQuestion: (
    questionId: string,
    eventId: string,
    data: UpdateQuestionRequest
  ) =>
    api.patch<CoffeeRouletteQuestion>(
      `/coffee-roulette/questions/${questionId}`,
      data,
      eventId
    ),

  /**
   * Delete a question
   */
  deleteQuestion: (questionId: string, eventId: string) =>
    api.del(
      `/coffee-roulette/questions/${questionId}`,
      eventId
    ),

  // ─────────────────────── MAPPINGS ───────────────────────────────

  /**
   * Assign a question to a topic
   */
  assignQuestionToTopic: (
    topicId: string,
    questionId: string,
    eventId: string,
    displayOrder?: number
  ) =>
    api.post<CoffeeRouletteTopicQuestion>(
      '/coffee-roulette/topic-questions/assign',
      { topic_id: topicId, question_id: questionId, display_order: displayOrder },
      eventId
    ),

  /**
   * Remove a question from a topic
   */
  unassignQuestionFromTopic: (
    topicId: string,
    questionId: string,
    eventId: string
  ) =>
    api.post(
      '/coffee-roulette/topic-questions/unassign',
      { topic_id: topicId, question_id: questionId },
      eventId
    ),

  /**
   * Reorder questions within a topic
   */
  reorderTopicQuestions: (
    topicId: string,
    questionOrder: { questionId: string; displayOrder: number }[],
    eventId: string
  ) =>
    api.post(
      '/coffee-roulette/topic-questions/reorder',
      { topic_id: topicId, question_order: questionOrder },
      eventId
    ),

  // ─────────────────────── SELECTION ───────────────────────────────

  /**
   * Select a topic based on configuration strategy
   */
  selectTopic: (configId: string, eventId: string) =>
    api.post<SelectedTopic | null>(
      '/coffee-roulette/select-topic',
      { config_id: configId },
      eventId
    ),

  /**
   * Select a single question based on configuration strategy
   */
  selectQuestion: (
    configId: string,
    eventId: string,
    topicId?: string
  ) =>
    api.post<SelectedQuestion | null>(
      '/coffee-roulette/select-question',
      { config_id: configId, topic_id: topicId },
      eventId
    ),

  /**
   * Get multiple questions for a session
   */
  getSessionQuestions: (
    configId: string,
    eventId: string,
    topicId?: string,
    count?: number
  ) =>
    api.post<SelectedQuestion[]>(
      '/coffee-roulette/session-questions',
      {
        config_id: configId,
        topic_id: topicId,
        count: count || 6,
      },
      eventId
    ),

  // ─────────────────────── STATISTICS ───────────────────────────────

  /**
   * Get comprehensive statistics for a configuration
   */
  getConfigStats: (configId: string, eventId: string) =>
    api.get<ConfigStats>(
      `/coffee-roulette/stats/config/${configId}`,
      undefined,
      eventId
    ),

  /**
   * Get statistics for a topic
   */
  getTopicStats: (topicId: string, eventId: string) =>
    api.get<TopicStats>(
      `/coffee-roulette/stats/topic/${topicId}`,
      undefined,
      eventId
    ),

  // ─────────────────────── SESSION TRACKING ───────────────────────────────

  /**
   * Start tracking a pair's chat session
   */
  startPairSession: (
    eventId: string,
    participant1Id: string,
    participant2Id: string,
    topicId?: string
  ) =>
    api.post<CoffeeRoulettePairContext>(
      '/coffee-roulette/sessions/start',
      {
        event_id: eventId,
        participant1_id: participant1Id,
        participant2_id: participant2Id,
        topic_id: topicId,
      },
      eventId
    ),

  /**
   * End a pair session
   */
  endPairSession: (sessionId: string, eventId: string) =>
    api.post(
      `/coffee-roulette/sessions/${sessionId}/end`,
      {},
      eventId
    ),

  /**
   * Record a question used in a session
   */
  addQuestionToSession: (
    sessionId: string,
    questionId: string,
    eventId: string
  ) =>
    api.post(
      `/coffee-roulette/sessions/${sessionId}/add-question`,
      { question_id: questionId },
      eventId
    ),
};
