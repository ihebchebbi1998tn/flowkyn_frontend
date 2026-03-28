import { useState } from 'react';
import { useGameContent, useCreateGameContent, useUpdateGameContent, useDeleteGameContent, useApproveGameContent, useRejectGameContent } from '@/hooks/useGameContent';
import { CreateContentRequest } from '@/api/gameContent';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Plus, Edit2, Trash2, CheckCircle2, XCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface GameContentFormData extends CreateContentRequest {
  category?: string;
  tags?: string[];
}

export function GameContentPage() {
  const { t } = useTranslation('admin');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterApproved, setFilterApproved] = useState<'all' | 'approved' | 'pending'>('all');
  const [formData, setFormData] = useState<GameContentFormData>({
    gameKey: '',
    contentType: 'prompt',
    title: '',
    content: '',
    difficultyLevel: 'medium',
  });

  const { data: contentData, isLoading: isLoadingContent } = useGameContent(undefined, undefined, undefined, undefined, page, limit);
  const createMutation = useCreateGameContent();
  const updateMutation = useUpdateGameContent(editingId || '');
  const deleteMutation = useDeleteGameContent(editingId || '');
  const [approveTargetId, setApproveTargetId] = useState<string | null>(null);
  const [rejectTargetId, setRejectTargetId] = useState<string | null>(null);
  const approveMutation = useApproveGameContent(approveTargetId || '');
  const rejectMutation = useRejectGameContent(rejectTargetId || '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload: CreateContentRequest = {
      gameKey: formData.gameKey,
      contentType: formData.contentType,
      title: formData.title,
      content: formData.content,
      difficultyLevel: formData.difficultyLevel,
      category: formData.category,
      tags: formData.tags,
    };

    if (editingId) {
      await updateMutation.mutateAsync(payload);
    } else {
      await createMutation.mutateAsync(payload);
    }

    setShowForm(false);
    setEditingId(null);
    setFormData({
      gameKey: '',
      contentType: 'prompt',
      title: '',
      content: '',
      difficultyLevel: 'medium',
    });
  };

  const handleEdit = (content: any) => {
    setFormData({
      gameKey: content.game_key,
      contentType: content.content_type,
      title: content.title,
      content: content.content,
      difficultyLevel: content.difficulty_level,
    });
    setEditingId(content.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm(t('confirmDelete'))) {
      setEditingId(id);
      await deleteMutation.mutateAsync();
    }
  };

  const handleApprove = async (id: string) => {
    setApproveTargetId(id);
    await approveMutation.mutateAsync();
  };

  const handleReject = async (id: string) => {
    const reason = prompt(t('gameContent.rejectReason'));
    if (reason) {
      setRejectTargetId(id);
      await rejectMutation.mutateAsync(reason);
    }
  };

  const filteredContent = contentData?.data?.filter((item: any) => {
    if (filterApproved === 'approved') return item.is_approved;
    if (filterApproved === 'pending') return !item.is_approved;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('gameContent.title')}</h1>
          <p className="text-muted-foreground mt-2">{t('gameContent.description')}</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          {t('gameContent.createNew')}
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {(['all', 'approved', 'pending'] as const).map((status) => (
          <Button
            key={status}
            variant={filterApproved === status ? 'default' : 'outline'}
            onClick={() => setFilterApproved(status)}
          >
            {t(`gameContent.filter.${status}`)}
          </Button>
        ))}
      </div>

      {/* Form Modal */}
      {showForm && (
        <Card className="bg-slate-50 border-slate-200">
          <CardHeader>
            <CardTitle>{editingId ? t('gameContent.editContent') : t('gameContent.createContent')}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">{t('gameContent.gameKey')}</label>
                  <Input
                    value={formData.gameKey}
                    onChange={(e) => setFormData({ ...formData, gameKey: e.target.value })}
                    placeholder="coffee_roulette"
                    disabled={!!editingId}
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">{t('gameContent.contentType')}</label>
                  <select
                    value={formData.contentType}
                    onChange={(e) => setFormData({ ...formData, contentType: e.target.value as any })}
                    className="mt-1 w-full px-3 py-2 border rounded-md text-sm"
                    required
                  >
                    <option value="prompt">Prompt</option>
                    <option value="puzzle">Puzzle</option>
                    <option value="statement">Statement</option>
                    <option value="challenge">Challenge</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">{t('gameContent.title')}</label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Content title"
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">{t('gameContent.difficulty')}</label>
                  <select
                    value={formData.difficultyLevel}
                    onChange={(e) => setFormData({ ...formData, difficultyLevel: e.target.value as any })}
                    className="mt-1 w-full px-3 py-2 border rounded-md text-sm"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">{t('gameContent.content')}</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Content text"
                  className="mt-1 w-full px-3 py-2 border rounded-md text-sm"
                  rows={5}
                  required
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {createMutation.isPending || updateMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : null}
                  {t('gameContent.save')}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                    setFormData({
                      gameKey: '',
                      contentType: 'prompt',
                      title: '',
                      content: '',
                      difficultyLevel: 'medium',
                    });
                  }}
                >
                  {t('common.cancel')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Content List */}
      <div className="space-y-4">
        {isLoadingContent ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredContent?.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">{t('gameContent.noContent')}</p>
            </CardContent>
          </Card>
        ) : (
          filteredContent?.map((content: any) => (
            <Card key={content.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {content.title && <h3 className="text-lg font-semibold">{content.title}</h3>}
                      <Badge variant={content.is_approved ? 'default' : 'secondary'}>
                        {content.is_approved ? t('gameContent.approved') : t('gameContent.pending')}
                      </Badge>
                      <Badge variant="outline">{content.content_type}</Badge>
                      <Badge variant="outline">{content.difficulty_level}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground font-mono mb-2">{content.game_key}</p>
                    <p className="text-sm line-clamp-2 mb-3">{content.content}</p>
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      <span>{t('gameContent.uses')}: <span className="font-medium">{content.usage_count}</span></span>
                      {content.average_rating && (
                        <span>⭐ <span className="font-medium">{content.average_rating.toFixed(1)}</span></span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {!content.is_approved && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleApprove(content.id)}
                        className="gap-2 text-green-600"
                        disabled={approveMutation.isPending}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        {t('gameContent.approve')}
                      </Button>
                    )}
                    {!content.is_approved && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReject(content.id)}
                        className="gap-2 text-red-600"
                        disabled={rejectMutation.isPending}
                      >
                        <XCircle className="w-4 h-4" />
                        {t('gameContent.reject')}
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(content)}
                    >
                      <Edit2 className="w-4 h-4" />
                      {t('common.edit')}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(content.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                      {t('common.delete')}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {contentData && (
        <div className="flex justify-between items-center py-4">
          <Button
            variant="outline"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            {t('common.previous')}
          </Button>
          <span className="text-sm text-muted-foreground">
            {t('common.page')} {page}
          </span>
          <Button
            variant="outline"
            disabled={!contentData.data || contentData.data.length < limit}
            onClick={() => setPage(page + 1)}
          >
            {t('common.next')}
          </Button>
        </div>
      )}
    </div>
  );
}
