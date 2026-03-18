/**
 * @fileoverview Coffee Roulette Settings Component
 * 
 * Allows event organizers to configure Coffee Roulette game settings:
 * - Duration and max prompts
 * - Topic and question selection strategies (random, sequential, weighted)
 * - Whether to allow general questions as fallback
 * - Shuffle on repeat behavior
 * 
 * Handles creating and updating configurations via API.
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
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, Loader, CheckCircle2, Settings2 } from 'lucide-react';
import { coffeeRouletteConfigApi } from '../../api/coffeeRouletteConfig';
import type {
  CoffeeRouletteConfig,
  TopicSelectionStrategy,
  QuestionSelectionStrategy,
  CreateConfigRequest,
  UpdateConfigRequest,
} from '@/types';

interface CoffeeRouletteSettingsProps {
  eventId: string;
}

export function CoffeeRouletteSettings({ eventId }: CoffeeRouletteSettingsProps) {
  const { t } = useTranslation();
  const [config, setConfig] = useState<CoffeeRouletteConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form state
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [maxPrompts, setMaxPrompts] = useState(6);
  const [topicStrategy, setTopicStrategy] = useState<TopicSelectionStrategy>('random');
  const [questionStrategy, setQuestionStrategy] = useState<QuestionSelectionStrategy>('random');
  const [allowGeneral, setAllowGeneral] = useState(true);
  const [shuffleOnRepeat, setShuffleOnRepeat] = useState(true);

  // Load configuration on mount
  useEffect(() => {
    loadConfig();
  }, [eventId]);

  const loadConfig = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await coffeeRouletteConfigApi.getConfig(eventId);
      if (response) {
        setConfig(response);
        setDurationMinutes(response.duration_minutes);
        setMaxPrompts(response.max_prompts);
        setTopicStrategy(response.topic_selection_strategy as TopicSelectionStrategy);
        setQuestionStrategy(response.question_selection_strategy as QuestionSelectionStrategy);
        setAllowGeneral(response.allow_general_questions);
        setShuffleOnRepeat(response.shuffle_on_repeat);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      const data: CreateConfigRequest = {
        event_id: eventId,
        duration_minutes: durationMinutes,
        max_prompts: maxPrompts,
        topic_selection_strategy: topicStrategy,
        question_selection_strategy: questionStrategy,
        allow_general_questions: allowGeneral,
        shuffle_on_repeat: shuffleOnRepeat,
      };

      const newConfig = await coffeeRouletteConfigApi.createConfig(eventId, data);
      setConfig(newConfig);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!config) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      const data: UpdateConfigRequest = {
        duration_minutes: durationMinutes,
        max_prompts: maxPrompts,
        topic_selection_strategy: topicStrategy,
        question_selection_strategy: questionStrategy,
        allow_general_questions: allowGeneral,
        shuffle_on_repeat: shuffleOnRepeat,
      };

      const updated = await coffeeRouletteConfigApi.updateConfig(config.id, eventId, data);
      setConfig(updated);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update configuration');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Settings2 className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">Coffee Roulette Settings</h2>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Configuration saved successfully!
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Game Configuration</CardTitle>
          <CardDescription>
            Configure how Coffee Roulette matches participants and selects topics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="basic" className="space-y-4">
            <TabsList>
              <TabsTrigger value="basic">Basic Settings</TabsTrigger>
              <TabsTrigger value="strategies">Selection Strategies</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
            </TabsList>

            {/* Basic Settings Tab */}
            <TabsContent value="basic" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="duration">Chat Duration (minutes)</Label>
                  <Input
                    id="duration"
                    type="number"
                    min="5"
                    max="120"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 30)}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500">
                    How long each pair will chat (5-120 minutes)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxPrompts">Max Conversation Topics</Label>
                  <Input
                    id="maxPrompts"
                    type="number"
                    min="1"
                    max="20"
                    value={maxPrompts}
                    onChange={(e) => setMaxPrompts(parseInt(e.target.value) || 6)}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500">
                    How many topics before asking to continue or end (1-20)
                  </p>
                </div>
              </div>
            </TabsContent>

            {/* Selection Strategies Tab */}
            <TabsContent value="strategies" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="topicStrategy">Topic Selection Strategy</Label>
                  <Select value={topicStrategy} onValueChange={(val) => setTopicStrategy(val as TopicSelectionStrategy)}>
                    <SelectTrigger id="topicStrategy">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="random">
                        <div>
                          <div className="font-medium">Random</div>
                          <div className="text-xs text-gray-500">Uniformly random selection</div>
                        </div>
                      </SelectItem>
                      <SelectItem value="sequential">
                        <div>
                          <div className="font-medium">Sequential</div>
                          <div className="text-xs text-gray-500">Round-robin through topics</div>
                        </div>
                      </SelectItem>
                      <SelectItem value="weighted">
                        <div>
                          <div className="font-medium">Weighted</div>
                          <div className="text-xs text-gray-500">Based on topic weights</div>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">
                    How topics are selected for each conversation pair
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="questionStrategy">Question Selection Strategy</Label>
                  <Select value={questionStrategy} onValueChange={(val) => setQuestionStrategy(val as QuestionSelectionStrategy)}>
                    <SelectTrigger id="questionStrategy">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="random">
                        <div>
                          <div className="font-medium">Random</div>
                          <div className="text-xs text-gray-500">Random question each time</div>
                        </div>
                      </SelectItem>
                      <SelectItem value="sequential">
                        <div>
                          <div className="font-medium">Sequential</div>
                          <div className="text-xs text-gray-500">Go through all questions</div>
                        </div>
                      </SelectItem>
                      <SelectItem value="all">
                        <div>
                          <div className="font-medium">All</div>
                          <div className="text-xs text-gray-500">Show all available questions</div>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">
                    How questions are selected during conversations
                  </p>
                </div>
              </div>
            </TabsContent>

            {/* Advanced Settings Tab */}
            <TabsContent value="advanced" className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50">
                  <Checkbox
                    id="allowGeneral"
                    checked={allowGeneral}
                    onCheckedChange={(checked) => setAllowGeneral(checked as boolean)}
                  />
                  <div className="flex-1">
                    <Label htmlFor="allowGeneral" className="font-medium cursor-pointer">
                      Allow General Questions
                    </Label>
                    <p className="text-xs text-gray-500 mt-1">
                      Use general fallback questions if topic-specific questions run out
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50">
                  <Checkbox
                    id="shuffleOnRepeat"
                    checked={shuffleOnRepeat}
                    onCheckedChange={(checked) => setShuffleOnRepeat(checked as boolean)}
                  />
                  <div className="flex-1">
                    <Label htmlFor="shuffleOnRepeat" className="font-medium cursor-pointer">
                      Shuffle on Repeat
                    </Label>
                    <p className="text-xs text-gray-500 mt-1">
                      Reshuffle questions when all have been used in sequential mode
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Action Buttons */}
          <div className="flex gap-2 justify-end mt-6">
            <Button variant="outline" onClick={loadConfig} disabled={saving}>
              Reset
            </Button>
            {config ? (
              <Button onClick={handleUpdate} disabled={saving}>
                {saving ? (
                  <>
                    <Loader className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Update Settings'
                )}
              </Button>
            ) : (
              <Button onClick={handleCreate} disabled={saving}>
                {saving ? (
                  <>
                    <Loader className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Configuration'
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {config && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-base">Configuration Details</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <span className="font-medium">Configuration ID:</span>
              <span className="font-mono text-xs break-all">{config.id}</span>
              <span className="font-medium">Event ID:</span>
              <span className="font-mono text-xs break-all">{config.event_id}</span>
              <span className="font-medium">Created:</span>
              <span>{new Date(config.created_at).toLocaleString()}</span>
              <span className="font-medium">Last Updated:</span>
              <span>{new Date(config.updated_at).toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
