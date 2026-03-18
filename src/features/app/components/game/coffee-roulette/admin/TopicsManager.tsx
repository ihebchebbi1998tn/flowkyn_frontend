/**
 * Topics Manager Component
 * 
 * Admin interface for managing Coffee Roulette topics.
 * Allows organizers to:
 * - Create new topics
 * - Edit topic title, description, and icon
 * - Activate/deactivate topics
 * - Reorder topics
 * - Delete topics
 * - Assign questions to topics
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, AlertCircle, CheckCircle, Plus, Edit2, Trash2, GripVertical, ChevronDown } from 'lucide-react';
import { coffeeRouletteConfigApi } from '../../../../api/coffeeRouletteConfig';
import type { CoffeeRouletteConfig, CoffeeRouletteTopic } from '@/types';

interface TopicsManagerProps {
  configId: string;
  eventId: string;
}

interface EditingTopic extends Partial<CoffeeRouletteTopic> {
  id?: string;
  title: string;
  description?: string;
  icon?: string;
}

export const TopicsManager: React.FC<TopicsManagerProps> = ({ configId, eventId }) => {
  const { t } = useTranslation();
  const [topics, setTopics] = useState<CoffeeRouletteTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingTopic, setEditingTopic] = useState<EditingTopic | null>(null);
  const [expandedTopic, setExpandedTopic] = useState<string | null>(null);

  // Load topics
  useEffect(() => {
    const loadTopics = async () => {
      try {
        setLoading(true);
        const fetchedTopics = await coffeeRouletteConfigApi.getTopics(configId, eventId);
        setTopics(fetchedTopics);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load topics');
      } finally {
        setLoading(false);
      }
    };

    loadTopics();
  }, [configId, eventId]);

  const handleAddTopic = () => {
    setEditingTopic({ title: '', description: '', icon: '💬', weight: 1 });
    setShowForm(true);
  };

  const handleEditTopic = (topic: CoffeeRouletteTopic) => {
    setEditingTopic(topic);
    setShowForm(true);
  };

  const handleSaveTopic = async () => {
    if (!editingTopic?.title.trim()) {
      setError('Topic title is required');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      let saved: CoffeeRouletteTopic;

      if (editingTopic.id) {
        // Update existing topic
        saved = await coffeeRouletteConfigApi.updateTopic(editingTopic.id, eventId, {
          title: editingTopic.title,
          description: editingTopic.description || '',
          icon: editingTopic.icon || '💬',
          weight: editingTopic.weight || 1,
        });

        setTopics(topics.map(t => t.id === saved.id ? saved : t));
      } else {
        // Create new topic
        saved = await coffeeRouletteConfigApi.createTopic(configId, eventId, {
          title: editingTopic.title,
          description: editingTopic.description || '',
          icon: editingTopic.icon || '💬',
          weight: editingTopic.weight || 1,
        });

        setTopics([...topics, saved]);
      }

      setSuccess(true);
      setShowForm(false);
      setEditingTopic(null);

      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save topic');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTopic = async (topicId: string) => {
    if (!window.confirm('Are you sure you want to delete this topic? All associated questions will be unassigned.')) {
      return;
    }

    try {
      await coffeeRouletteConfigApi.deleteTopic(topicId, eventId);
      setTopics(topics.filter(t => t.id !== topicId));
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete topic');
    }
  };

  const handleToggleActive = async (topic: CoffeeRouletteTopic) => {
    try {
      const updated = await coffeeRouletteConfigApi.updateTopic(topic.id, eventId, {
        is_active: !topic.is_active,
      });
      setTopics(topics.map(t => t.id === updated.id ? updated : t));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update topic');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2">Loading topics...</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Topics</h2>
        <button
          onClick={handleAddTopic}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Topic
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

      {/* Form */}
      {showForm && (
        <div className="mb-8 bg-gray-50 rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">
            {editingTopic?.id ? 'Edit Topic' : 'New Topic'}
          </h3>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Icon
                </label>
                <input
                  type="text"
                  maxLength={3}
                  value={editingTopic?.icon || ''}
                  onChange={(e) => setEditingTopic({ ...editingTopic!, icon: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="💬"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={editingTopic?.title || ''}
                  onChange={(e) => setEditingTopic({ ...editingTopic!, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Career Growth"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={editingTopic?.description || ''}
                onChange={(e) => setEditingTopic({ ...editingTopic!, description: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Optional description"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Weight (for weighted selection)
              </label>
              <input
                type="number"
                min="0.1"
                step="0.1"
                value={editingTopic?.weight || 1}
                onChange={(e) => setEditingTopic({ ...editingTopic!, weight: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-sm text-gray-500 mt-1">Higher weight = more likely to be selected</p>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={handleSaveTopic}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingTopic(null);
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Topics List */}
      <div className="space-y-3">
        {topics.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No topics yet. Create one to get started!</p>
          </div>
        ) : (
          topics.map(topic => (
            <div key={topic.id} className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 p-4 flex items-center gap-4 cursor-pointer hover:bg-gray-100" onClick={() => setExpandedTopic(expandedTopic === topic.id ? null : topic.id)}>
                <GripVertical className="w-5 h-5 text-gray-400" />
                <span className="text-2xl">{topic.icon || '💬'}</span>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">{topic.title}</h4>
                  {topic.description && (
                    <p className="text-sm text-gray-600">{topic.description}</p>
                  )}
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${topic.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                  {topic.is_active ? 'Active' : 'Inactive'}
                </span>
                <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${expandedTopic === topic.id ? 'rotate-180' : ''}`} />
              </div>

              {expandedTopic === topic.id && (
                <div className="bg-white p-4 border-t border-gray-200">
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-2">
                        <strong>Weight:</strong> {topic.weight || 1}
                      </p>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => handleToggleActive(topic)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium ${topic.is_active ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' : 'bg-green-100 text-green-800 hover:bg-green-200'}`}
                      >
                        {topic.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleEditTopic(topic)}
                        className="px-3 py-2 bg-blue-100 text-blue-800 hover:bg-blue-200 rounded-lg text-sm font-medium flex items-center gap-2"
                      >
                        <Edit2 className="w-4 h-4" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteTopic(topic.id)}
                        className="px-3 py-2 bg-red-100 text-red-800 hover:bg-red-200 rounded-lg text-sm font-medium flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
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

export default TopicsManager;
