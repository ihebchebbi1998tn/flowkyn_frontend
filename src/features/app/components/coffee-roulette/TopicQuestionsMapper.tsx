/**
 * @fileoverview Topic-Questions Mapper Component
 * 
 * Allows organizers to:
 * - Assign questions to topics
 * - Remove questions from topics
 * - Reorder questions within each topic
 * - View all topic-question relationships
 */

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Plus, Trash2, Loader, ChevronUp, ChevronDown } from 'lucide-react';
import { coffeeRouletteConfigApi } from '../../api/coffeeRouletteConfig';
import type { CoffeeRouletteTopic, CoffeeRouletteQuestion } from '@/types';

interface TopicQuestionsMapperProps {
  eventId: string;
  configId: string;
}

export function TopicQuestionsMapper({ eventId, configId }: TopicQuestionsMapperProps) {
  const [topics, setTopics] = useState<CoffeeRouletteTopic[]>([]);
  const [questions, setQuestions] = useState<CoffeeRouletteQuestion[]>([]);
  const [topicQuestions, setTopicQuestions] = useState<Map<string, CoffeeRouletteQuestion[]>>(new Map());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const [selectedQuestion, setSelectedQuestion] = useState<string>('');
  const [expandedTopic, setExpandedTopic] = useState<string | null>(null);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, [configId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [topicsRes, questionsRes] = await Promise.all([
        coffeeRouletteConfigApi.getTopics(configId, eventId),
        coffeeRouletteConfigApi.getQuestions(configId, eventId),
      ]);

      setTopics(topicsRes || []);
      setQuestions(questionsRes || []);

      // Load topic-questions mappings
      const mappings = new Map<string, CoffeeRouletteQuestion[]>();
      for (const topic of topicsRes || []) {
        const topicWithQuestions = await coffeeRouletteConfigApi.getTopicWithQuestions(topic.id, eventId);
        if (topicWithQuestions?.questions) {
          mappings.set(topic.id, topicWithQuestions.questions);
        }
      }
      setTopicQuestions(mappings);

      // Set first topic as selected
      if (topicsRes && topicsRes.length > 0) {
        setSelectedTopic(topicsRes[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignQuestion = async () => {
    if (!selectedTopic || !selectedQuestion) {
      setError('Please select both a topic and a question');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      // Get current questions for this topic
      const currentQuestions = topicQuestions.get(selectedTopic) || [];
      const nextOrder = currentQuestions.length + 1;

      await coffeeRouletteConfigApi.assignQuestionToTopic(
        selectedTopic,
        selectedQuestion,
        eventId,
        nextOrder
      );

      // Reload data
      await loadData();
      setSelectedQuestion('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign question');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveQuestion = async (topicId: string, questionId: string) => {
    if (!window.confirm('Remove this question from the topic?')) return;

    try {
      setSaving(true);
      setError(null);

      await coffeeRouletteConfigApi.unassignQuestionFromTopic(topicId, questionId, eventId);

      // Update local state
      const updated = topicQuestions.get(topicId)?.filter((q) => q.id !== questionId) || [];
      setTopicQuestions(new Map(topicQuestions.set(topicId, updated)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove question');
    } finally {
      setSaving(false);
    }
  };

  const handleReorder = async (topicId: string, questions: CoffeeRouletteQuestion[], questionId: string, direction: 'up' | 'down') => {
    const index = questions.findIndex((q) => q.id === questionId);
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === questions.length - 1)) {
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const newQuestions = [...questions];
      if (direction === 'up') {
        [newQuestions[index - 1], newQuestions[index]] = [newQuestions[index], newQuestions[index - 1]];
      } else {
        [newQuestions[index], newQuestions[index + 1]] = [newQuestions[index + 1], newQuestions[index]];
      }

      const questionOrder = newQuestions.map((q, i) => ({
        questionId: q.id,
        displayOrder: i + 1,
      }));

      await coffeeRouletteConfigApi.reorderTopicQuestions(topicId, questionOrder, eventId);

      // Update local state
      setTopicQuestions(new Map(topicQuestions.set(topicId, newQuestions)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reorder questions');
    } finally {
      setSaving(false);
    }
  };

  const availableQuestions = questions.filter(
    (q) =>
      !topicQuestions
        .get(selectedTopic || '')
        ?.some((assigned) => assigned.id === q.id)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold">{t('games.coffeeRoulette.admin.mapping.title', { defaultValue: 'Topic-Questions Mapping' })}</h3>
        <p className="text-sm text-gray-500">{t('games.coffeeRoulette.admin.mapping.subtitle', { defaultValue: 'Assign questions to topics and manage their order' })}</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('games.coffeeRoulette.admin.mapping.assignTitle', { defaultValue: 'Assign Questions to Topics' })}</CardTitle>
          <CardDescription>{t('games.coffeeRoulette.admin.mapping.assignDesc', { defaultValue: 'Select a topic and add questions to it' })}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('games.coffeeRoulette.admin.mapping.selectTopic', { defaultValue: 'Select Topic' })}</label>
              <Select value={selectedTopic} onValueChange={setSelectedTopic}>
                <SelectTrigger>
                  <SelectValue placeholder={t('games.coffeeRoulette.admin.mapping.chooseTopic', { defaultValue: 'Choose a topic...' })} />
                </SelectTrigger>
                <SelectContent>
                  {topics.map((topic) => (
                    <SelectItem key={topic.id} value={topic.id}>
                      {topic.icon} {topic.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{t('games.coffeeRoulette.admin.mapping.selectQuestion', { defaultValue: 'Select Question' })}</label>
              <Select value={selectedQuestion} onValueChange={setSelectedQuestion}>
                <SelectTrigger>
                  <SelectValue placeholder={t('games.coffeeRoulette.admin.mapping.chooseQuestion', { defaultValue: 'Choose a question...' })} />
                </SelectTrigger>
                <SelectContent>
                  {availableQuestions.length > 0 ? (
                    availableQuestions.map((question) => (
                      <SelectItem key={question.id} value={question.id}>
                        {question.text.substring(0, 50)}...
                      </SelectItem>
                    ))
                  ) : (
                    <div className="p-2 text-sm text-gray-500">
                      All questions already assigned or no questions available
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                onClick={handleAssignQuestion}
                disabled={saving || !selectedTopic || !selectedQuestion}
                className="w-full"
              >
                {saving ? (
                  <>
                    <Loader className="h-4 w-4 mr-2 animate-spin" />
                    Assigning...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Assign Question
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Topics with their assigned questions */}
      <div className="space-y-3">
        {topics.map((topic) => {
          const assignedQuestions = topicQuestions.get(topic.id) || [];

          return (
            <Card key={topic.id} className="hover:shadow-md transition-shadow">
              <div
                className="p-4 cursor-pointer"
                onClick={() => setExpandedTopic(expandedTopic === topic.id ? null : topic.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{topic.icon}</span>
                    <div>
                      <h4 className="font-semibold">{topic.title}</h4>
                      <p className="text-sm text-gray-500">
                        {assignedQuestions.length} question{assignedQuestions.length !== 1 ? 's' : ''} assigned
                      </p>
                    </div>
                  </div>
                  {expandedTopic === topic.id ? (
                    <ChevronUp className="h-5 w-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  )}
                </div>
              </div>

              {expandedTopic === topic.id && (
                <div className="border-t p-4 space-y-2 bg-gray-50">
                  {assignedQuestions.length === 0 ? (
                    <p className="text-sm text-gray-500 italic">{t('games.coffeeRoulette.admin.mapping.noQuestionsAssigned', { defaultValue: 'No questions assigned yet' })}</p>
                  ) : (
                    <div className="space-y-2">
                      {assignedQuestions.map((question, index) => (
                        <div key={question.id} className="p-3 bg-white border rounded-lg flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm line-clamp-2">{question.text}</p>
                            <div className="flex gap-2 mt-1">
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                                {question.difficulty}
                              </span>
                              {question.category && (
                                <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                                  {question.category}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-1 flex-shrink-0">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleReorder(topic.id, assignedQuestions, question.id, 'up')}
                              disabled={index === 0 || saving}
                              title="Move up"
                            >
                              <ChevronUp className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleReorder(topic.id, assignedQuestions, question.id, 'down')}
                              disabled={index === assignedQuestions.length - 1 || saving}
                              title="Move down"
                            >
                              <ChevronDown className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveQuestion(topic.id, question.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              disabled={saving}
                              title="Remove from topic"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
