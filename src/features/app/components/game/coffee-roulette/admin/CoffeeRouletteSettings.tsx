/**
 * Coffee Roulette Settings Component
 * 
 * Main admin interface for configuring Coffee Roulette for an event.
 * Allows organizers to:
 * - Set duration and number of prompts
 * - Choose topic and question selection strategies
 * - Enable/disable general questions
 * - Configure behavior on repeat
 * 
 * Integrates with CoffeeRouletteConfigService via API client.
 */

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { coffeeRouletteConfigApi } from '../../../../api/coffeeRouletteConfig';
import { TopicSelectionStrategy, QuestionSelectionStrategy } from '@/types';
import type { CoffeeRouletteConfig } from '@/types';

type SettingsFormData = {
  duration_minutes: number;
  max_prompts: number;
  topic_selection_strategy: TopicSelectionStrategy;
  question_selection_strategy: QuestionSelectionStrategy;
  allow_general_questions: boolean;
  shuffle_on_repeat: boolean;
};

interface CoffeeRouletteSettingsProps {
  eventId: string;
  onSettingsUpdated?: (config: CoffeeRouletteConfig) => void;
}

export const CoffeeRouletteSettings: React.FC<CoffeeRouletteSettingsProps> = ({
  eventId,
  onSettingsUpdated,
}) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [config, setConfig] = useState<CoffeeRouletteConfig | null>(null);
  const [formData, setFormData] = useState<SettingsFormData>({
    duration_minutes: 30,
    max_prompts: 6,
    topic_selection_strategy: 'random',
    question_selection_strategy: 'random',
    allow_general_questions: true,
    shuffle_on_repeat: true,
  });

  // Load existing configuration
  useEffect(() => {
    const loadConfig = async () => {
      try {
        setLoading(true);
        const existingConfig = await coffeeRouletteConfigApi.getConfig(eventId);
        if (existingConfig) {
          setConfig(existingConfig);
          setFormData({
            duration_minutes: existingConfig.duration_minutes || 30,
            max_prompts: existingConfig.max_prompts || 6,
            topic_selection_strategy: existingConfig.topic_selection_strategy || 'random',
            question_selection_strategy: existingConfig.question_selection_strategy || 'random',
            allow_general_questions: existingConfig.allow_general_questions !== false,
            shuffle_on_repeat: existingConfig.shuffle_on_repeat !== false,
          });
        } else {
          // Create new configuration
          const newConfig = await coffeeRouletteConfigApi.createConfig(eventId, {
            event_id: eventId,
          });
          setConfig(newConfig);
          setFormData({
            duration_minutes: newConfig.duration_minutes || 30,
            max_prompts: newConfig.max_prompts || 6,
            topic_selection_strategy: newConfig.topic_selection_strategy || 'random',
            question_selection_strategy: newConfig.question_selection_strategy || 'random',
            allow_general_questions: newConfig.allow_general_questions !== false,
            shuffle_on_repeat: newConfig.shuffle_on_repeat !== false,
          });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load configuration');
      } finally {
        setLoading(false);
      }
    };

    loadConfig();
  }, [eventId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
              name.includes('_') && name !== 'topic_selection_strategy' && name !== 'question_selection_strategy'
              ? parseInt(value, 10) : value,
    }));
    setError(null);
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: checked,
    }));
    setError(null);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      if (!config) {
        setError('Configuration not found');
        return;
      }

      const updated = await coffeeRouletteConfigApi.updateConfig(config.id, eventId, formData);
      setConfig(updated);
      setSuccess(true);
      onSettingsUpdated?.(updated);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2">Loading configuration...</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-8">
      <h2 className="text-2xl font-bold mb-6">
        {t('gamePlay.coffeeRoulette.settingsTitle') || 'Coffee Roulette Settings'}
      </h2>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="text-red-800">{error}</div>
        </div>
      )}

      {/* Success Alert */}
      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div className="text-green-800">Settings saved successfully!</div>
        </div>
      )}

      <form className="space-y-8">
        {/* Basic Settings Section */}
        <div className="border-b pb-8">
          <h3 className="text-lg font-semibold mb-4">Basic Settings</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Duration */}
            <div>
              <label htmlFor="duration_minutes" className="block text-sm font-medium text-gray-700 mb-2">
                Duration (minutes)
              </label>
              <input
                id="duration_minutes"
                name="duration_minutes"
                type="number"
                min="5"
                max="120"
                value={formData.duration_minutes}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-sm text-gray-500 mt-1">How long each pair will chat</p>
            </div>

            {/* Max Prompts */}
            <div>
              <label htmlFor="max_prompts" className="block text-sm font-medium text-gray-700 mb-2">
                Maximum Prompts
              </label>
              <input
                id="max_prompts"
                name="max_prompts"
                type="number"
                min="1"
                max="20"
                value={formData.max_prompts}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-sm text-gray-500 mt-1">Number of discussion topics before asking to continue</p>
            </div>
          </div>
        </div>

        {/* Selection Strategies Section */}
        <div className="border-b pb-8">
          <h3 className="text-lg font-semibold mb-4">Selection Strategies</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Topic Selection Strategy */}
            <div>
              <label htmlFor="topic_selection_strategy" className="block text-sm font-medium text-gray-700 mb-2">
                Topic Selection
              </label>
              <select
                id="topic_selection_strategy"
                name="topic_selection_strategy"
                value={formData.topic_selection_strategy}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="random">Random</option>
                <option value="sequential">Sequential (Round-robin)</option>
                <option value="weighted">Weighted (By preference)</option>
              </select>
              <p className="text-sm text-gray-500 mt-1">How to select discussion topics</p>
            </div>

            {/* Question Selection Strategy */}
            <div>
              <label htmlFor="question_selection_strategy" className="block text-sm font-medium text-gray-700 mb-2">
                Question Selection
              </label>
              <select
                id="question_selection_strategy"
                name="question_selection_strategy"
                value={formData.question_selection_strategy}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="random">Random</option>
                <option value="sequential">Sequential</option>
                <option value="all">All (Show all available)</option>
              </select>
              <p className="text-sm text-gray-500 mt-1">How to select prompts within topics</p>
            </div>
          </div>
        </div>

        {/* Question Options Section */}
        <div className="border-b pb-8">
          <h3 className="text-lg font-semibold mb-4">Question Options</h3>
          
          <div className="space-y-4">
            {/* Allow General Questions */}
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="allow_general_questions"
                checked={formData.allow_general_questions}
                onChange={handleCheckboxChange}
                className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
              />
              <div>
                <p className="font-medium text-gray-700">Allow General Questions</p>
                <p className="text-sm text-gray-500">Use default questions if topic-specific ones aren't available</p>
              </div>
            </label>

            {/* Shuffle on Repeat */}
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="shuffle_on_repeat"
                checked={formData.shuffle_on_repeat}
                onChange={handleCheckboxChange}
                className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
              />
              <div>
                <p className="font-medium text-gray-700">Shuffle on Repeat</p>
                <p className="text-sm text-gray-500">Reset question pool when all have been used</p>
              </div>
            </label>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Settings'
            )}
          </button>
          
          <button
            type="button"
            onClick={() => {
              if (config) {
                setFormData({
                  duration_minutes: config.duration_minutes || 30,
                  max_prompts: config.max_prompts || 6,
                  topic_selection_strategy: config.topic_selection_strategy || 'random',
                  question_selection_strategy: config.question_selection_strategy || 'random',
                  allow_general_questions: config.allow_general_questions !== false,
                  shuffle_on_repeat: config.shuffle_on_repeat !== false,
                });
              }
              setError(null);
            }}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
          >
            Reset
          </button>
        </div>
      </form>
    </div>
  );
};

export default CoffeeRouletteSettings;
