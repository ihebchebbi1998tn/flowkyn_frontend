import { useState } from 'react';
import { useFeatureFlags, useCreateFeatureFlag, useUpdateFeatureFlag, useDeleteFeatureFlag, useFeatureFlagStats } from '@/hooks/useFeatureFlags';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Plus, Edit2, Trash2, BarChart3 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface FeatureFlagFormData {
  key: string;
  name: string;
  description?: string;
  enabled: boolean;
  rolloutPercentage: number;
  isMultivariant: boolean;
}

export function FeatureFlagsPage() {
  const { t } = useTranslation('admin');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FeatureFlagFormData>({
    key: '',
    name: '',
    description: '',
    enabled: false,
    rolloutPercentage: 0,
    isMultivariant: false,
  });

  const { data: flagsData, isLoading: isLoadingFlags } = useFeatureFlags(page, limit);
  const { data: statsData, isLoading: isLoadingStats } = useFeatureFlagStats(editingId || '');
  const createMutation = useCreateFeatureFlag();
  const updateMutation = useUpdateFeatureFlag(editingId || '');
  const deleteMutation = useDeleteFeatureFlag(editingId || '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload = {
      key: formData.key,
      name: formData.name,
      description: formData.description,
      enabled: formData.enabled,
      rollout_percentage: formData.rolloutPercentage,
      is_multivariant: formData.isMultivariant,
    };

    if (editingId) {
      await updateMutation.mutateAsync(payload);
    } else {
      await createMutation.mutateAsync(payload);
    }

    setShowForm(false);
    setEditingId(null);
    setFormData({
      key: '',
      name: '',
      description: '',
      enabled: false,
      rolloutPercentage: 0,
      isMultivariant: false,
    });
  };

  const handleEdit = (flag: any) => {
    setFormData({
      key: flag.key,
      name: flag.name,
      description: flag.description,
      enabled: flag.enabled,
      rolloutPercentage: flag.rollout_percentage,
      isMultivariant: flag.is_multivariant,
    });
    setEditingId(flag.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm(t('confirmDelete'))) {
      setEditingId(id);
      await deleteMutation.mutateAsync();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('featureFlags.title')}</h1>
          <p className="text-muted-foreground mt-2">{t('featureFlags.description')}</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          {t('featureFlags.createNew')}
        </Button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <Card className="bg-slate-50 border-slate-200">
          <CardHeader>
            <CardTitle>{editingId ? t('featureFlags.editFlag') : t('featureFlags.createFlag')}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">{t('featureFlags.key')}</label>
                  <Input
                    value={formData.key}
                    onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                    placeholder="my_feature_flag"
                    disabled={!!editingId}
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">{t('featureFlags.name')}</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="My Feature Flag"
                    required
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">{t('featureFlags.description')}</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Flag description"
                  className="mt-1 w-full px-3 py-2 border rounded-md text-sm"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={formData.enabled}
                    onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked as boolean })}
                    id="enabled"
                  />
                  <label htmlFor="enabled" className="text-sm font-medium cursor-pointer">
                    {t('featureFlags.enabled')}
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={formData.isMultivariant}
                    onCheckedChange={(checked) => setFormData({ ...formData, isMultivariant: checked as boolean })}
                    id="multivariant"
                  />
                  <label htmlFor="multivariant" className="text-sm font-medium cursor-pointer">
                    {t('featureFlags.multivariant')}
                  </label>
                </div>

                <div>
                  <label className="text-sm font-medium">{t('featureFlags.rolloutPercentage')}</label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.rolloutPercentage}
                    onChange={(e) => setFormData({ ...formData, rolloutPercentage: parseInt(e.target.value) })}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {createMutation.isPending || updateMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : null}
                  {t('featureFlags.save')}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                    setFormData({
                      key: '',
                      name: '',
                      description: '',
                      enabled: false,
                      rolloutPercentage: 0,
                      isMultivariant: false,
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

      {/* Flags List */}
      <div className="space-y-4">
        {isLoadingFlags ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : flagsData?.data?.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">{t('featureFlags.noFlags')}</p>
            </CardContent>
          </Card>
        ) : (
          flagsData?.data?.map((flag: any) => (
            <Card key={flag.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold">{flag.name}</h3>
                      <Badge variant={flag.enabled ? 'default' : 'secondary'}>
                        {flag.enabled ? t('featureFlags.active') : t('featureFlags.inactive')}
                      </Badge>
                      {flag.is_multivariant && <Badge variant="outline">{t('featureFlags.multivariant')}</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground font-mono">{flag.key}</p>
                    {flag.description && <p className="text-sm mt-2">{flag.description}</p>}
                    <div className="mt-3 flex gap-4 text-sm">
                      <span className="text-muted-foreground">
                        {t('featureFlags.rollout')}: <span className="font-medium text-foreground">{flag.rollout_percentage}%</span>
                      </span>
                      <span className="text-muted-foreground">
                        {t('featureFlags.created')}: <span className="font-medium text-foreground">{new Date(flag.created_at).toLocaleDateString()}</span>
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(flag)}
                      className="gap-2"
                    >
                      <Edit2 className="w-4 h-4" />
                      {t('common.edit')}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(flag.id)}
                      className="gap-2"
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
      {flagsData && (
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
            disabled={!flagsData.data || flagsData.data.length < limit}
            onClick={() => setPage(page + 1)}
          >
            {t('common.next')}
          </Button>
        </div>
      )}
    </div>
  );
}
