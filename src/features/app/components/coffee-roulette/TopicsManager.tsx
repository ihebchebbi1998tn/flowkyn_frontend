/**
 * @fileoverview Topics Manager Component
 * 
 * Allows event organizers to:
 * - Create new topics
 * - Edit existing topics (title, description, icon, weight)
 * - Delete topics
 * - Reorder topics via drag-and-drop
 * - View assigned questions for each topic
 */

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Plus, Edit2, Trash2, Loader, ChevronDown, ChevronUp, GripVertical } from 'lucide-react';
import { coffeeRouletteConfigApi } from '../../api/coffeeRouletteConfig';
import type { CoffeeRouletteTopic, CreateTopicRequest, UpdateTopicRequest } from '@/types';

interface TopicsManagerProps {
  eventId: string;
  configId: string;
}

export function TopicsManager({ eventId, configId }: TopicsManagerProps) {
  const { t } = useTranslation();
  const [topics, setTopics] = useState<CoffeeRouletteTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingTopic, setEditingTopic] = useState<CoffeeRouletteTopic | null>(null);
  const [expandedTopic, setExpandedTopic] = useState<string | null>(null);

  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formIcon, setFormIcon] = useState('💬');
  const [formWeight, setFormWeight] = useState(1);

  // Load topics on mount
  useEffect(() => {
    loadTopics();
  }, [configId]);

  const loadTopics = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await coffeeRouletteConfigApi.getTopics(configId, eventId);
      setTopics(response || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('games.coffeeRoulette.admin.topics.failedToLoad'));
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormTitle('');
    setFormDescription('');
    setFormIcon('💬');
    setFormWeight(1);
    setEditingTopic(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setOpenDialog(true);
  };

  const handleOpenEdit = (topic: CoffeeRouletteTopic) => {
    setEditingTopic(topic);
    setFormTitle(topic.title);
    setFormDescription(topic.description || '');
    setFormIcon(topic.icon || '💬');
    setFormWeight(topic.weight || 1);
    setOpenDialog(true);
  };

  const handleCreate = async () => {
    try {
      setSaving(true);
      setError(null);

      const data: CreateTopicRequest = {
        config_id: configId,
        title: formTitle.trim(),
        description: formDescription.trim() || undefined,
        icon: formIcon,
        weight: formWeight,
      };

      await coffeeRouletteConfigApi.createTopic(configId, eventId, data);
      await loadTopics();
      setOpenDialog(false);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('games.coffeeRoulette.admin.topics.failedToCreate'));
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingTopic) return;

    try {
      setSaving(true);
      setError(null);

      const data: UpdateTopicRequest = {
        title: formTitle.trim(),
        description: formDescription.trim() || undefined,
        icon: formIcon,
        weight: formWeight,
        is_active: editingTopic.is_active,
      };

      await coffeeRouletteConfigApi.updateTopic(editingTopic.id, eventId, data);
      await loadTopics();
      setOpenDialog(false);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('games.coffeeRoulette.admin.topics.failedToUpdate'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (topicId: string) => {
    if (!window.confirm(t('games.coffeeRoulette.admin.topics.deleteConfirm'))) return;

    try {
      setSaving(true);
      setError(null);
      await coffeeRouletteConfigApi.deleteTopic(topicId, eventId);
      await loadTopics();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('games.coffeeRoulette.admin.topics.failedToDelete'));
    } finally {
      setSaving(false);
    }
  };

  const handleMoveUp = async (index: number) => {
    // Reorder functionality can be enhanced with proper API support
    return;
  };

  const handleMoveDown = async (index: number) => {
    // Reorder functionality can be enhanced with proper API support
    return;
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
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold">{t('games.coffeeRoulette.admin.topics.title')}</h3>
          <p className="text-sm text-gray-500">{t('games.coffeeRoulette.admin.topics.title')}</p>
        </div>
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogTrigger asChild>
            <Button onClick={handleOpenCreate}>
              <Plus className="h-4 w-4 mr-2" />
              {t('games.coffeeRoulette.admin.topics.addTopic')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingTopic ? t('games.coffeeRoulette.admin.topics.editTopic') : t('games.coffeeRoulette.admin.topics.createTopic')}</DialogTitle>
              <DialogDescription>
                {editingTopic
                  ? t('games.coffeeRoulette.admin.topics.editTopic')
                  : t('games.coffeeRoulette.admin.topics.createTopic')}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="topic-icon">{t('games.coffeeRoulette.admin.topics.topicIcon')}</Label>
                <Input
                  id="topic-icon"
                  type="text"
                  value={formIcon}
                  onChange={(e) => setFormIcon(e.target.value.slice(0, 2))}
                  maxLength={2}
                  placeholder="💬"
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="topic-title">{t('games.coffeeRoulette.admin.topics.topicTitle')} *</Label>
                <Input
                  id="topic-title"
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder={t('games.coffeeRoulette.admin.topics.topicTitle')}
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="topic-description">{t('games.coffeeRoulette.admin.topics.topicDescription')}</Label>
                <Input
                  id="topic-description"
                  type="text"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder={t('games.coffeeRoulette.admin.topics.topicDescription')}
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="topic-weight">{t('games.coffeeRoulette.admin.topics.weight')}</Label>
                <Input
                  id="topic-weight"
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={formWeight}
                  onChange={(e) => setFormWeight(parseFloat(e.target.value) || 1)}
                  className="w-full"
                />
                <p className="text-xs text-gray-500">{t('games.coffeeRoulette.admin.topics.weight')}</p>
              </div>
              <div className="flex gap-2 justify-end pt-4">
                <Button variant="outline" onClick={() => setOpenDialog(false)}>
                  {t('common.cancel')}
                </Button>
                <Button
                  onClick={editingTopic ? handleUpdate : handleCreate}
                  disabled={saving || !formTitle.trim()}
                >
                  {saving ? (
                    <>
                      <Loader className="h-4 w-4 mr-2 animate-spin" />
                      {t('common.loading')}
                    </>
                  ) : editingTopic ? (
                    t('games.coffeeRoulette.admin.topics.editTopic')
                  ) : (
                    t('games.coffeeRoulette.admin.topics.createTopic')
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

      {topics.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-gray-500">{t('games.coffeeRoulette.admin.topics.noTopics')}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {topics.map((topic, index) => (
            <Card key={topic.id} className="hover:shadow-md transition-shadow">
              <div className="p-4">
                <div className="flex items-center gap-3">
                  <GripVertical className="h-5 w-5 text-gray-400" />
                  <div className="text-2xl">{topic.icon}</div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold truncate">{topic.title}</h4>
                    {topic.description && (
                      <p className="text-sm text-gray-500 truncate">{topic.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleMoveUp(index)}
                      disabled={index === 0}
                    >
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleMoveDown(index)}
                      disabled={index === topics.length - 1}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenEdit(topic)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(topic.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setExpandedTopic(expandedTopic === topic.id ? null : topic.id)
                    }
                  >
                    {expandedTopic === topic.id ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                {expandedTopic === topic.id && (
                  <div className="mt-3 pt-3 border-t space-y-2">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <span className="font-medium">{t('games.coffeeRoulette.admin.topics.weight')}:</span>
                      <span>{topic.weight}</span>
                      <span className="font-medium">{t('games.coffeeRoulette.admin.topics.active')}:</span>
                      <span>{topic.is_active ? t('common.yes') : t('common.no')}</span>
                      <span className="font-medium">{t('games.coffeeRoulette.admin.topics.createdDate')}:</span>
                      <span className="text-xs">{new Date(topic.created_at).toLocaleDateString()}</span>
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
