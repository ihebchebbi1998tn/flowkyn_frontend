/**
 * Questions Manager Component
 * 
 * Admin interface for managing Coffee Roulette questions.
 * Allows organizers to:
 * - Create new questions (global or topic-specific)
 * - Edit questions and their properties
 * - Filter by type and difficulty
 * - Activate/deactivate questions
 * - Delete questions
 * - Set difficulty levels
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, AlertCircle, CheckCircle, Plus, Edit2, Trash2, ChevronDown } from 'lucide-react';
import { coffeeRouletteConfigApi } from '../../../../api/coffeeRouletteConfig';
import type { CoffeeRouletteQuestion, QuestionType, DifficultyLevel } from '@/types';

interface QuestionsManagerProps {
  configId: string;
  eventId: string;
}

interface EditingQuestion extends Partial<CoffeeRouletteQuestion> {
  id?: string;
  text: string;
  question_type?: QuestionType;
  difficulty?: DifficultyLevel;
}

export const QuestionsManager: React.FC<QuestionsManagerProps> = ({ configId, eventId }) => {
  const { t } = useTranslation();
  const [questions, setQuestions] = useState<CoffeeRouletteQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<EditingQuestion | null>(null);
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);

  // Filters
  const [typeFilter, setTypeFilter] = useState<QuestionType | 'all'>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyLevel | 'all'>('all');

  // Load questions
  useEffect(() => {
    const loadQuestions = async () => {
      try {
        setLoading(true);
        const fetchedQuestions = await coffeeRouletteConfigApi.getQuestions(configId, eventId, {
          type: typeFilter !== 'all' ? typeFilter : undefined,
          activeOnly: false,
        });
        setQuestions(fetchedQuestions);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load questions');
      } finally {
        setLoading(false);
      }
    };

    loadQuestions();
  }, [configId, eventId, typeFilter, difficultyFilter]);

  const handleAddQuestion = () => {
    setEditingQuestion({
      text: '',
      question_type: 'general',
      difficulty: 'moderate',
      category: '',
    });
    setShowForm(true);
  };

  const handleEditQuestion = (question: CoffeeRouletteQuestion) => {
    setEditingQuestion(question);
    setShowForm(true);
  };

  const handleSaveQuestion = async () => {
    if (!editingQuestion?.text.trim()) {
      setError('Question text is required');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      let saved: CoffeeRouletteQuestion;

      if (editingQuestion.id) {
        // Update existing question
        saved = await coffeeRouletteConfigApi.updateQuestion(editingQuestion.id, eventId, {
          text: editingQuestion.text,
          question_type: editingQuestion.question_type || 'general',
          difficulty: editingQuestion.difficulty || 'moderate',
          category: editingQuestion.category || '',
        });

        setQuestions(questions.map(q => q.id === saved.id ? saved : q));
      } else {
        // Create new question
        saved = await coffeeRouletteConfigApi.createQuestion(configId, eventId, {
          text: editingQuestion.text,
          question_type: editingQuestion.question_type || 'general',
          difficulty: editingQuestion.difficulty || 'moderate',
          category: editingQuestion.category || '',
        });

        setQuestions([...questions, saved]);
      }

      setSuccess(true);
      setShowForm(false);
      setEditingQuestion(null);

      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save question');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!window.confirm('Are you sure you want to delete this question?')) {
      return;
    }

    try {
      await coffeeRouletteConfigApi.deleteQuestion(questionId, eventId);
      setQuestions(questions.filter(q => q.id !== questionId));
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete question');
    }
  };

  const handleToggleActive = async (question: CoffeeRouletteQuestion) => {
    try {
      const updated = await coffeeRouletteConfigApi.updateQuestion(question.id, eventId, {
        is_active: !question.is_active,
      });
      setQuestions(questions.map(q => q.id === updated.id ? updated : q));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update question');
    }
  };

  const filteredQuestions = questions.filter(q => {
    if (typeFilter !== 'all' && q.question_type !== typeFilter) return false;
    if (difficultyFilter !== 'all' && q.difficulty !== difficultyFilter) return false;
    return true;
  });

  const getDifficultyColor = (difficulty: DifficultyLevel) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100 text-green-800';
      case 'moderate':
        return 'bg-yellow-100 text-yellow-800';
      case 'challenging':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2">Loading questions...</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Questions</h2>
        <button
          onClick={handleAddQuestion}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Question
        </button>
      </div>

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

      {/* Filters */}
      <div className="mb-8 flex gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All</option>
            <option value="general">General</option>
            <option value="topic-specific">Topic-Specific</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
          <select
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All</option>
            <option value="easy">Easy</option>
            <option value="moderate">Moderate</option>
            <option value="challenging">Challenging</option>
          </select>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="mb-8 bg-gray-50 rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">
            {editingQuestion?.id ? 'Edit Question' : 'New Question'}
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Question Text *
              </label>
              <textarea
                value={editingQuestion?.text || ''}
                onChange={(e) => setEditingQuestion({ ...editingQuestion!, text: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter the question or prompt"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type
                </label>
                <select
                  value={editingQuestion?.question_type || 'general'}
                  onChange={(e) => setEditingQuestion({ ...editingQuestion!, question_type: e.target.value as QuestionType })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="general">General</option>
                  <option value="topic-specific">Topic-Specific</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Difficulty
                </label>
                <select
                  value={editingQuestion?.difficulty || 'moderate'}
                  onChange={(e) => setEditingQuestion({ ...editingQuestion!, difficulty: e.target.value as DifficultyLevel })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="easy">Easy</option>
                  <option value="moderate">Moderate</option>
                  <option value="challenging">Challenging</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <input
                  type="text"
                  value={editingQuestion?.category || ''}
                  onChange={(e) => setEditingQuestion({ ...editingQuestion!, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Career, Personal"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={handleSaveQuestion}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingQuestion(null);
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Questions List */}
      <div className="space-y-3">
        {filteredQuestions.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No questions match your filters.</p>
          </div>
        ) : (
          filteredQuestions.map(question => (
            <div key={question.id} className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 p-4 flex items-start gap-4 cursor-pointer hover:bg-gray-100" onClick={() => setExpandedQuestion(expandedQuestion === question.id ? null : question.id)}>
                <div className="flex-1 mt-0.5">
                  <p className="font-medium text-gray-900">{question.text}</p>
                  <div className="flex gap-2 mt-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getDifficultyColor(question.difficulty)}`}>
                      {question.difficulty}
                    </span>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                      {question.question_type}
                    </span>
                    {question.category && (
                      <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-medium">
                        {question.category}
                      </span>
                    )}
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap ${question.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                  {question.is_active ? 'Active' : 'Inactive'}
                </span>
                <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform flex-shrink-0 ${expandedQuestion === question.id ? 'rotate-180' : ''}`} />
              </div>

              {expandedQuestion === question.id && (
                <div className="bg-white p-4 border-t border-gray-200">
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleToggleActive(question)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium ${question.is_active ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' : 'bg-green-100 text-green-800 hover:bg-green-200'}`}
                    >
                      {question.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => handleEditQuestion(question)}
                      className="px-3 py-2 bg-blue-100 text-blue-800 hover:bg-blue-200 rounded-lg text-sm font-medium flex items-center gap-2"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteQuestion(question.id)}
                      className="px-3 py-2 bg-red-100 text-red-800 hover:bg-red-200 rounded-lg text-sm font-medium flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default QuestionsManager;
