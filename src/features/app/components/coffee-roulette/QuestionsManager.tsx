/**
 * @fileoverview Questions Manager Component
 * 
 * Allows event organizers to:
 * - Create new questions (global or event-specific)
 * - Edit existing questions
 * - Delete questions
 * - Filter questions by type and difficulty
 * - View which topics have this question assigned
 */

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Plus, Edit2, Trash2, Loader, ChevronDown, ChevronUp } from 'lucide-react';
import { coffeeRouletteConfigApi } from '../../api/coffeeRouletteConfig';
import type { CoffeeRouletteQuestion, CreateQuestionRequest, UpdateQuestionRequest, QuestionType, DifficultyLevel } from '@/types';

interface QuestionsManagerProps {
  eventId: string;
  configId: string;
}

export function QuestionsManager({ eventId, configId }: QuestionsManagerProps) {
  const { t } = useTranslation();
  const [questions, setQuestions] = useState<CoffeeRouletteQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<CoffeeRouletteQuestion | null>(null);
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);

  // Filters
  const [typeFilter, setTypeFilter] = useState<QuestionType | 'all'>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyLevel | 'all'>('all');

  // Form state
  const [formText, setFormText] = useState('');
  const [formType, setFormType] = useState<QuestionType>('general');
  const [formDifficulty, setFormDifficulty] = useState<DifficultyLevel>('moderate');
  const [formCategory, setFormCategory] = useState('');

  // Load questions on mount
  useEffect(() => {
    loadQuestions();
  }, [configId]);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await coffeeRouletteConfigApi.getQuestions(configId, eventId);
      setQuestions(response || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormText('');
    setFormType('general');
    setFormDifficulty('moderate');
    setFormCategory('');
    setEditingQuestion(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setOpenDialog(true);
  };

  const handleOpenEdit = (question: CoffeeRouletteQuestion) => {
    setEditingQuestion(question);
    setFormText(question.text);
    setFormType(question.question_type as QuestionType);
    setFormDifficulty(question.difficulty as DifficultyLevel);
    setFormCategory(question.category || '');
    setOpenDialog(true);
  };

  const handleCreate = async () => {
    try {
      setSaving(true);
      setError(null);

      const data: CreateQuestionRequest = {
        config_id: configId,
        text: formText.trim(),
        question_type: formType,
        difficulty: formDifficulty,
        category: formCategory.trim() || undefined,
      };

      await coffeeRouletteConfigApi.createQuestion(configId, eventId, data);
      await loadQuestions();
      setOpenDialog(false);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create question');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingQuestion) return;

    try {
      setSaving(true);
      setError(null);

      const data: UpdateQuestionRequest = {
        text: formText.trim(),
        question_type: formType,
        difficulty: formDifficulty,
        category: formCategory.trim() || undefined,
        is_active: editingQuestion.is_active,
      };

      await coffeeRouletteConfigApi.updateQuestion(editingQuestion.id, eventId, data);
      await loadQuestions();
      setOpenDialog(false);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update question');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (questionId: string) => {
    if (!window.confirm('Are you sure you want to delete this question?')) return;

    try {
      setSaving(true);
      setError(null);
      await coffeeRouletteConfigApi.deleteQuestion(questionId, eventId);
      await loadQuestions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete question');
    } finally {
      setSaving(false);
    }
  };

  const filteredQuestions = questions.filter((q) => {
    if (typeFilter !== 'all' && q.question_type !== typeFilter) return false;
    if (difficultyFilter !== 'all' && q.difficulty !== difficultyFilter) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold">{t('games.coffeeRoulette.admin.questions.title', { defaultValue: 'Questions & Prompts' })}</h3>
          <p className="text-sm text-gray-500">{t('games.coffeeRoulette.admin.questions.subtitle', { defaultValue: 'Manage conversation questions for this event' })}</p>
        </div>
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogTrigger asChild>
            <Button onClick={handleOpenCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Add Question
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingQuestion ? 'Edit Question' : 'Create Question'}</DialogTitle>
              <DialogDescription>
                {editingQuestion
                  ? 'Update the question details'
                  : 'Create a new conversation question or prompt'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="question-text">Question/Prompt *</Label>
                <textarea
                  id="question-text"
                  value={formText}
                  onChange={(e) => setFormText(e.target.value)}
                  placeholder="What's something you're proud of?"
                  className="w-full min-h-20 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="question-type">Type *</Label>
                  <Select value={formType} onValueChange={(val) => setFormType(val as QuestionType)}>
                    <SelectTrigger id="question-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="topic-specific">Topic-Specific</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="question-difficulty">Difficulty *</Label>
                  <Select value={formDifficulty} onValueChange={(val) => setFormDifficulty(val as DifficultyLevel)}>
                    <SelectTrigger id="question-difficulty">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="moderate">Moderate</SelectItem>
                      <SelectItem value="challenging">Challenging</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="question-category">Category</Label>
                <Input
                  id="question-category"
                  type="text"
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  placeholder="E.g., Career, Personal, Icebreaker"
                  className="w-full"
                />
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <Button variant="outline" onClick={() => setOpenDialog(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={editingQuestion ? handleUpdate : handleCreate}
                  disabled={saving || !formText.trim()}
                >
                  {saving ? (
                    <>
                      <Loader className="h-4 w-4 mr-2 animate-spin" />
                      {editingQuestion ? 'Updating...' : 'Creating...'}
                    </>
                  ) : editingQuestion ? (
                    'Update Question'
                  ) : (
                    'Create Question'
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="filter-type">Type</Label>
          <Select value={typeFilter} onValueChange={(val) => setTypeFilter(val as any)}>
            <SelectTrigger id="filter-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="general">General</SelectItem>
              <SelectItem value="topic-specific">Topic-Specific</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="filter-difficulty">Difficulty</Label>
          <Select value={difficultyFilter} onValueChange={(val) => setDifficultyFilter(val as any)}>
            <SelectTrigger id="filter-difficulty">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Difficulties</SelectItem>
              <SelectItem value="easy">Easy</SelectItem>
              <SelectItem value="moderate">Moderate</SelectItem>
              <SelectItem value="challenging">Challenging</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {filteredQuestions.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-gray-500">{t('games.coffeeRoulette.admin.questions.noMatches', { defaultValue: 'No questions match the current filters. Create one to get started!' })}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          <p className="text-sm text-gray-600">{t('games.coffeeRoulette.admin.questions.showing', { defaultValue: 'Showing {{count}} of {{total}} questions', count: filteredQuestions.length, total: questions.length })}</p>
          {filteredQuestions.map((question) => (
            <Card key={question.id} className="hover:shadow-md transition-shadow">
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium line-clamp-2">{question.text}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                        {question.question_type === 'general' ? 'General' : 'Topic-Specific'}
                      </span>
                      <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded">
                        {question.difficulty}
                      </span>
                      {question.category && (
                        <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                          {question.category}
                        </span>
                      )}
                      {question.is_active ? (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                          Active
                        </span>
                      ) : (
                        <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                          Inactive
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenEdit(question)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(question.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setExpandedQuestion(expandedQuestion === question.id ? null : question.id)
                      }
                    >
                      {expandedQuestion === question.id ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {expandedQuestion === question.id && (
                  <div className="mt-3 pt-3 border-t space-y-2">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <span className="font-medium">{t('games.coffeeRoulette.admin.questions.id', { defaultValue: 'Question ID:' })}</span>
                      <span className="font-mono text-xs break-all">{question.id}</span>
                      <span className="font-medium">{t('games.coffeeRoulette.admin.questions.createdLabel', { defaultValue: 'Created:' })}</span>
                      <span className="text-xs">{new Date(question.created_at).toLocaleString()}</span>
                      <span className="font-medium">{t('games.coffeeRoulette.admin.questions.updatedLabel', { defaultValue: 'Updated:' })}</span>
                      <span className="text-xs">{new Date(question.updated_at).toLocaleString()}</span>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
