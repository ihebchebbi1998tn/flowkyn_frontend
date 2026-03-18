/**
 * Coffee Roulette Administration Page
 * 
 * Complete admin interface for managing Coffee Roulette configurations.
 * Organized in tabs for easier navigation:
 * - Settings: Basic configuration (duration, strategies, etc.)
 * - Topics: Manage discussion topics
 * - Questions: Manage questions/prompts
 * - Mappings: Assign questions to topics
 */

import React, { useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Settings, BookOpen, HelpCircle, Link2 } from 'lucide-react';
import {
  CoffeeRouletteSettings,
  TopicsManager,
  QuestionsManager,
  TopicQuestionsMapper,
} from '../components/game/coffee-roulette/admin';

type TabType = 'settings' | 'topics' | 'questions' | 'mappings';

export const CoffeeRouletteAdminPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabType>('settings');
  const [configId, setConfigId] = useState<string | null>(null);

  if (!eventId) {
    return <Navigate to="/" />;
  }

  const tabs: Array<{ id: TabType; label: string; icon: React.ReactNode }> = [
    { id: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
    { id: 'topics', label: 'Topics', icon: <BookOpen className="w-5 h-5" /> },
    { id: 'questions', label: 'Questions', icon: <HelpCircle className="w-5 h-5" /> },
    { id: 'mappings', label: 'Assign Questions', icon: <Link2 className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">☕ Coffee Roulette Admin</h1>
          <p className="text-gray-600 mt-1">Configure dynamic topics and questions for your event</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-4 font-medium flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>💡 Tip:</strong> Configure basic settings like duration, selection strategies, and question options here. These settings apply to all pairs in the event.
              </p>
            </div>
            <CoffeeRouletteSettings 
              eventId={eventId}
              onSettingsUpdated={(config) => setConfigId(config.id)}
            />
          </div>
        )}

        {/* Topics Tab */}
        {activeTab === 'topics' && configId && (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>💡 Tip:</strong> Create custom discussion topics for your event. Assign questions to topics to make them topic-specific. Topics can be weighted for selection probability.
              </p>
            </div>
            <TopicsManager configId={configId} eventId={eventId} />
          </div>
        )}

        {/* Questions Tab */}
        {activeTab === 'questions' && configId && (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>💡 Tip:</strong> Create questions or prompts that participants will be asked during conversations. Mark them as "general" for all topics or "topic-specific" for particular topics. Set difficulty levels to match your event vibe.
              </p>
            </div>
            <QuestionsManager configId={configId} eventId={eventId} />
          </div>
        )}

        {/* Mappings Tab */}
        {activeTab === 'mappings' && configId && (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>💡 Tip:</strong> Assign specific questions to topics. This ensures pairs discussing a topic will see relevant questions. You can assign multiple questions per topic and reorder them.
              </p>
            </div>
            <TopicQuestionsMapper configId={configId} eventId={eventId} />
          </div>
        )}

        {/* Empty State */}
        {!configId && (activeTab === 'topics' || activeTab === 'questions' || activeTab === 'mappings') && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
            <p className="text-yellow-800 font-medium mb-4">
              Please create a configuration first in the Settings tab.
            </p>
            <button
              onClick={() => setActiveTab('settings')}
              className="px-6 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 font-medium"
            >
              Go to Settings
            </button>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="bg-gray-50 border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <p className="text-sm text-gray-600">
            <strong>Event ID:</strong> {eventId}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            All changes are automatically saved. Topics and questions are shared across all participants in this event.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CoffeeRouletteAdminPage;
