/**
 * Topic-Questions Mapper Component
 * 
 * Admin interface for assigning questions to topics.
 * Features:
 * - Drag-drop assignments
 * - Reorder questions within topics
 * - View all topics and available questions
 * - Quick assign/unassign functionality
 * - Display order management
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, AlertCircle, CheckCircle, Plus, Trash2, GripVertical } from 'lucide-react';
import { coffeeRouletteConfigApi } from '../../../../api/coffeeRouletteConfig';
import type { CoffeeRouletteTopic, CoffeeRouletteQuestion } from '@/types';

interface TopicQuestionsMappperProps {
  configId: string;
  eventId: string;
}

export const TopicQuestionsMapper: React.FC<TopicQuestionsMappperProps> = ({ configId, eventId }) => {
  const { t } = useTranslation();
  const [topics, setTopics] = useState<CoffeeRouletteTopic[]>([]);
  const [questions, setQuestions] = useState<CoffeeRouletteQuestion[]>([]);
  const [topicQuestions, setTopicQuestions] = useState<Record<string, CoffeeRouletteQuestion[]>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [draggedQuestion, setDraggedQuestion] = useState<CoffeeRouletteQuestion | null>(null);

  // Load topics and questions
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [fetchedTopics, fetchedQuestions] = await Promise.all([
          coffeeRouletteConfigApi.getTopics(configId, eventId),
          coffeeRouletteConfigApi.getQuestions(configId, eventId),
        ]);

        setTopics(fetchedTopics);
        setQuestions(fetchedQuestions);

        // Load questions for each topic
        const topicQuestionsMap: Record<string, CoffeeRouletteQuestion[]> = {};
        for (const topic of fetchedTopics) {
          const topicWithQuestions = await coffeeRouletteConfigApi.getTopicWithQuestions(topic.id, eventId);
          topicQuestionsMap[topic.id] = topicWithQuestions?.questions || [];
        }
        setTopicQuestions(topicQuestionsMap);

        if (fetchedTopics.length > 0) {
          setSelectedTopic(fetchedTopics[0].id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [configId, eventId]);

  const handleAssignQuestion = async (questionId: string, topicId: string) => {
    try {
      setSaving(true);
      setError(null);

      const currentTopicQuestions = topicQuestions[topicId] || [];
      const displayOrder = currentTopicQuestions.length + 1;

      await coffeeRouletteConfigApi.assignQuestionToTopic(topicId, questionId, eventId, displayOrder);

      // Update local state
      const assignedQuestion = questions.find(q => q.id === questionId);
      if (assignedQuestion) {
        setTopicQuestions(prev => ({
          ...prev,
          [topicId]: [...(prev[topicId] || []), assignedQuestion],
        }));
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign question');
    } finally {
      setSaving(false);
    }
  };

  const handleUnassignQuestion = async (questionId: string, topicId: string) => {
    try {
      setSaving(true);
      setError(null);

      await coffeeRouletteConfigApi.unassignQuestionFromTopic(topicId, questionId, eventId);

      // Update local state
      setTopicQuestions(prev => ({
        ...prev,
        [topicId]: (prev[topicId] || []).filter(q => q.id !== questionId),
      }));

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unassign question');
    } finally {
      setSaving(false);
    }
  };

  const handleReorderQuestions = async (topicId: string, reorderedQuestions: CoffeeRouletteQuestion[]) => {
    try {
      setSaving(true);
      setError(null);

      const order = reorderedQuestions.map((q, idx) => ({
        questionId: q.id,
        displayOrder: idx + 1,
      }));

      await coffeeRouletteConfigApi.reorderTopicQuestions(topicId, order, eventId);

      // Update local state
      setTopicQuestions(prev => ({
        ...prev,
        [topicId]: reorderedQuestions,
      }));

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reorder questions');
    } finally {
      setSaving(false);
    }
  };

  const getAssignedQuestionIds = (topicId: string): Set<string> => {
    return new Set((topicQuestions[topicId] || []).map(q => q.id));
  };

  const getAvailableQuestions = (topicId: string): CoffeeRouletteQuestion[] => {
    const assignedIds = getAssignedQuestionIds(topicId);
    return questions.filter(q => !assignedIds.has(q.id) && q.is_active);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2">Loading...</span>
      </div>
    );
  }

  const currentTopic = selectedTopic ? topics.find(t => t.id === selectedTopic) : null;
  const currentTopicQuestions = selectedTopic ? topicQuestions[selectedTopic] || [] : [];
  const availableQuestions = selectedTopic ? getAvailableQuestions(selectedTopic) : [];

  return (
    <div className="bg-white rounded-lg shadow-md p-8">
      <h2 className="text-2xl font-bold mb-6">Assign Questions to Topics</h2>

      {/* Alerts */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="text-red-800">{error}</div>
        </div>
      )}

      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div className="text-green-800">Operation successful!</div>
        </div>
      )}

      {topics.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No topics available. Create topics first!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Topics List */}
          <div className="lg:col-span-1">
            <h3 className="text-lg font-semibold mb-4">Topics</h3>
            <div className="space-y-2">
              {topics.map(topic => (
                <button
                  key={topic.id}
                  onClick={() => setSelectedTopic(topic.id)}
                  className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors ${
                    selectedTopic === topic.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  <span className="text-lg mr-2">{topic.icon || '💬'}</span>
                  {topic.title}
                </button>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            {currentTopic ? (
              <div className="space-y-8">
                {/* Topic Details */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h4 className="text-lg font-semibold flex items-center gap-2 mb-2">
                    <span className="text-2xl">{currentTopic.icon || '💬'}</span>
                    {currentTopic.title}
                  </h4>
                  {currentTopic.description && (
                    <p className="text-gray-700 mb-2">{currentTopic.description}</p>
                  )}
                  <p className="text-sm text-gray-600">
                    <strong>Weight:</strong> {currentTopic.weight || 1} | <strong>Status:</strong> {currentTopic.is_active ? '✅ Active' : '❌ Inactive'}
                  </p>
                </div>

                {/* Assigned Questions */}
                <div>
                  <h5 className="font-semibold text-gray-900 mb-3">
                    Assigned Questions ({currentTopicQuestions.length})
                  </h5>
                  <div className="space-y-2 mb-4 min-h-24 bg-blue-50 rounded-lg p-4 border-2 border-dashed border-blue-300">
                    {currentTopicQuestions.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">No questions assigned yet. Drag questions here or select from the list below.</p>
                    ) : (
                      currentTopicQuestions.map((question, idx) => (
                        <div
                          key={question.id}
                          className="bg-white border border-gray-200 rounded-lg p-3 flex items-start gap-3 hover:shadow-md transition-shadow"
                        >
                          <span className="text-gray-400 mt-0.5">{idx + 1}.</span>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{question.text}</p>
                            <div className="flex gap-1 mt-1">
                              <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                                {question.difficulty}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleUnassignQuestion(question.id, selectedTopic!)}
                            disabled={saving}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Available Questions */}
                <div>
                  <h5 className="font-semibold text-gray-900 mb-3">
                    Available Questions ({availableQuestions.length})
                  </h5>
                  <div className="space-y-2">
                    {availableQuestions.length === 0 ? (
                      <p className="text-gray-500 text-center py-8 bg-gray-50 rounded-lg">
                        All questions are already assigned to this topic.
                      </p>
                    ) : (
                      availableQuestions.map(question => (
                        <div
                          key={question.id}
                          className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex items-start gap-3 hover:shadow-md transition-shadow"
                        >
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 text-sm">{question.text}</p>
                            <div className="flex gap-1 mt-1">
                              <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded">
                                {question.difficulty}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleAssignQuestion(question.id, selectedTopic!)}
                            disabled={saving}
                            className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1 whitespace-nowrap"
                          >
                            <Plus className="w-4 h-4" />
                            Assign
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <p className="text-gray-500">Select a topic to manage its questions</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TopicQuestionsMapper;
