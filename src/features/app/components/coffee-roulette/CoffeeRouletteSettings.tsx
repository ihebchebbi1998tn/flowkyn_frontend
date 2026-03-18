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
      setError(err instanceof Error ? err.message : t('games.coffeeRoulette.admin.settings.failedToLoad'));
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
      setError(err instanceof Error ? err.message : t('games.coffeeRoulette.admin.settings.failedToCreate'));
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
      setError(err instanceof Error ? err.message : t('games.coffeeRoulette.admin.settings.failedToUpdate'));
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
        <h2 className="text-2xl font-bold">{t('games.coffeeRoulette.admin.settings.title')}</h2>
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
            {t('games.coffeeRoulette.admin.settings.savedSuccessfully')}
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t('games.coffeeRoulette.admin.settings.gameConfiguration')}</CardTitle>
          <CardDescription>
            {t('games.coffeeRoulette.admin.settings.configureDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="basic" className="space-y-4">
            <TabsList>
              <TabsTrigger value="basic">{t('games.coffeeRoulette.admin.settings.basicSettings')}</TabsTrigger>
              <TabsTrigger value="strategies">{t('games.coffeeRoulette.admin.settings.selectionStrategies')}</TabsTrigger>
              <TabsTrigger value="advanced">{t('games.coffeeRoulette.admin.settings.advanced')}</TabsTrigger>
            </TabsList>

            {/* Basic Settings Tab */}
            <TabsContent value="basic" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="duration">{t('games.coffeeRoulette.admin.settings.chatDuration')}</Label>
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
                    {t('games.coffeeRoulette.admin.settings.allowGeneral')}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxPrompts">{t('games.coffeeRoulette.admin.settings.maxPrompts')}</Label>
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
                    {t('games.coffeeRoulette.admin.settings.allowGeneral')}
                  </p>
                </div>
              </div>
            </TabsContent>

            {/* Selection Strategies Tab */}
            <TabsContent value="strategies" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="topicStrategy">{t('games.coffeeRoulette.admin.settings.topicStrategy')}</Label>
                  <Select value={topicStrategy} onValueChange={(val) => setTopicStrategy(val as TopicSelectionStrategy)}>
                    <SelectTrigger id="topicStrategy">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="random">
                        <div>
                          <div className="font-medium">{t('games.coffeeRoulette.admin.settings.random')}</div>
                          <div className="text-xs text-gray-500">{t('games.coffeeRoulette.admin.settings.random')}</div>
                        </div>
                      </SelectItem>
                      <SelectItem value="sequential">
                        <div>
                          <div className="font-medium">{t('games.coffeeRoulette.admin.settings.sequential')}</div>
                          <div className="text-xs text-gray-500">{t('games.coffeeRoulette.admin.settings.sequential')}</div>
                        </div>
                      </SelectItem>
                      <SelectItem value="weighted">
                        <div>
                          <div className="font-medium">{t('games.coffeeRoulette.admin.settings.weighted')}</div>
                          <div className="text-xs text-gray-500">{t('games.coffeeRoulette.admin.settings.weighted')}</div>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">
                    {t('games.coffeeRoulette.admin.settings.topicStrategy')}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="questionStrategy">{t('games.coffeeRoulette.admin.settings.questionStrategy')}</Label>
                  <Select value={questionStrategy} onValueChange={(val) => setQuestionStrategy(val as QuestionSelectionStrategy)}>
                    <SelectTrigger id="questionStrategy">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="random">
                        <div>
                          <div className="font-medium">{t('games.coffeeRoulette.admin.settings.random')}</div>
                          <div className="text-xs text-gray-500">{t('games.coffeeRoulette.admin.settings.random')}</div>
                        </div>
                      </SelectItem>
                      <SelectItem value="sequential">
                        <div>
                          <div className="font-medium">{t('games.coffeeRoulette.admin.settings.sequential')}</div>
                          <div className="text-xs text-gray-500">{t('games.coffeeRoulette.admin.settings.sequential')}</div>
                        </div>
                      </SelectItem>
                      <SelectItem value="all">
                        <div>
                          <div className="font-medium">{t('common.all')}</div>
                          <div className="text-xs text-gray-500">{t('common.all')}</div>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">
                    {t('games.coffeeRoulette.admin.settings.questionStrategy')}
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
                      {t('games.coffeeRoulette.admin.settings.allowGeneral')}
                    </Label>
                    <p className="text-xs text-gray-500 mt-1">
                      {t('games.coffeeRoulette.admin.settings.allowGeneral')}
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
                      {t('games.coffeeRoulette.admin.settings.shuffleOnRepeat')}
                    </Label>
                    <p className="text-xs text-gray-500 mt-1">
                      {t('games.coffeeRoulette.admin.settings.shuffleOnRepeat')}
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Action Buttons */}
          <div className="flex gap-2 justify-end mt-6">
            <Button variant="outline" onClick={loadConfig} disabled={saving}>
              {t('games.coffeeRoulette.admin.settings.reset')}
            </Button>
            {config ? (
              <Button onClick={handleUpdate} disabled={saving}>
                {saving ? (
                  <>
                    <Loader className="h-4 w-4 mr-2 animate-spin" />
                    {t('common.loading')}
                  </>
                ) : (
                  t('games.coffeeRoulette.admin.settings.update')
                )}
              </Button>
            ) : (
              <Button onClick={handleCreate} disabled={saving}>
                {saving ? (
                  <>
                    <Loader className="h-4 w-4 mr-2 animate-spin" />
                    {t('common.loading')}
                  </>
                ) : (
                  t('games.coffeeRoulette.admin.settings.create')
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {config && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-base">{t('games.coffeeRoulette.admin.settings.configurationDetails')}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <span className="font-medium">{t('games.coffeeRoulette.admin.settings.configurationId')}:</span>
              <span className="font-mono text-xs break-all">{config.id}</span>
              <span className="font-medium">{t('games.coffeeRoulette.admin.settings.eventId')}:</span>
              <span className="font-mono text-xs break-all">{config.event_id}</span>
              <span className="font-medium">{t('games.coffeeRoulette.admin.settings.createdAt')}:</span>
              <span>{new Date(config.created_at).toLocaleString()}</span>
              <span className="font-medium">{t('games.coffeeRoulette.admin.settings.updatedAt')}:</span>
              <span>{new Date(config.updated_at).toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
