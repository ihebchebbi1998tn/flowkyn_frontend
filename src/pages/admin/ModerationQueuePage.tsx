import { useState } from 'react';
import { useModerationQueue, useApproveModerationItem, useRejectModerationItem, useArchiveModerationItem, useFlagContent, useBulkApproveModerationItems, useBulkRejectModerationItems } from '@/hooks/useContentModeration';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, CheckCircle2, XCircle, Archive, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function ModerationQueuePage() {
  const { t } = useTranslation('admin');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [filterStatus, setFilterStatus] = useState<'pending' | 'approved' | 'rejected' | 'archived' | undefined>(undefined);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const { data: queueData, isLoading: isLoadingQueue } = useModerationQueue(filterStatus, undefined, page, limit);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [archivingId, setArchivingId] = useState<string | null>(null);
  const approveMutation = useApproveModerationItem(approvingId || '');
  const rejectMutation = useRejectModerationItem(rejectingId || '');
  const archiveMutation = useArchiveModerationItem(archivingId || '');
  const bulkApproveMutation = useBulkApproveModerationItems();
  const bulkRejectMutation = useBulkRejectModerationItems();

  const handleSelectAll = (checked: boolean) => {
    if (checked && queueData?.data) {
      setSelectedIds(new Set(queueData.data.map((item: any) => item.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleToggleSelect = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedIds);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedIds(newSelected);
  };

  const handleApprove = async (id: string, notes?: string) => {
    setApprovingId(id);
    await approveMutation.mutateAsync(notes);
  };

  const handleReject = async (id: string, notes?: string) => {
    if (!notes) {
      const reason = prompt(t('moderation.rejectReason'));
      if (!reason) return;
      notes = reason;
    }
    setRejectingId(id);
    await rejectMutation.mutateAsync(notes);
  };

  const handleArchive = async (id: string) => {
    setArchivingId(id);
    await archiveMutation.mutateAsync();
  };

  const handleBulkApprove = async () => {
    if (selectedIds.size === 0) {
      alert(t('moderation.selectItems'));
      return;
    }
    await bulkApproveMutation.mutateAsync(Array.from(selectedIds));
    setSelectedIds(new Set());
  };

  const handleBulkReject = async () => {
    if (selectedIds.size === 0) {
      alert(t('moderation.selectItems'));
      return;
    }
    const reason = prompt(t('moderation.bulkRejectReason'));
    if (reason) {
      await bulkRejectMutation.mutateAsync(Array.from(selectedIds));
      setSelectedIds(new Set());
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'archived':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('moderation.title')}</h1>
          <p className="text-muted-foreground mt-2">{t('moderation.description')}</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={filterStatus === undefined ? 'default' : 'outline'}
          onClick={() => {
            setFilterStatus(undefined);
            setPage(1);
          }}
        >
          {t('moderation.status.all')}
        </Button>
        {(['pending', 'approved', 'rejected', 'archived'] as const).map((status) => (
          <Button
            key={status}
            variant={filterStatus === status ? 'default' : 'outline'}
            onClick={() => {
              setFilterStatus(status);
              setPage(1);
            }}
          >
            {t(`moderation.status.${status}`)}
          </Button>
        ))}
      </div>

      {/* Bulk Actions */}
      {selectedIds.size > 0 && (
        <Card className="bg-slate-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <p className="text-sm font-medium">
                {t('moderation.selected', { count: selectedIds.size })}
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleBulkApprove}
                  disabled={bulkApproveMutation.isPending}
                  className="gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {t('moderation.approveSelected')}
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleBulkReject}
                  disabled={bulkRejectMutation.isPending}
                  className="gap-2"
                >
                  <XCircle className="w-4 h-4" />
                  {t('moderation.rejectSelected')}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedIds(new Set())}
                >
                  {t('common.clear')}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Queue List */}
      <div className="space-y-4">
        {/* Header Row with Select All */}
        <div className="flex items-center gap-4 px-4 py-2 border-b bg-slate-50">
          <Checkbox
            checked={selectedIds.size === queueData?.data?.length && queueData?.data?.length > 0}
            onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
            id="selectAll"
          />
          <label htmlFor="selectAll" className="text-sm font-medium cursor-pointer flex-1">
            {t('moderation.selectAll')}
          </label>
          <span className="text-sm text-muted-foreground">{queueData?.data?.length || 0} items</span>
        </div>

        {isLoadingQueue ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : queueData?.data?.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">{t('moderation.noItems')}</p>
            </CardContent>
          </Card>
        ) : (
          queueData?.data?.map((item: any) => (
            <Card key={item.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex gap-4">
                  <Checkbox
                    checked={selectedIds.has(item.id)}
                    onCheckedChange={(checked) => handleToggleSelect(item.id, checked as boolean)}
                    id={`select-${item.id}`}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                        {t(`moderation.status.${item.status}`)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {t('moderation.flaggedBy')}: {item.flagged_by || 'System'}
                      </span>
                    </div>
                    <p className="text-sm text-foreground mb-2">{item.reason_for_flag}</p>
                    {item.moderation_notes && (
                      <p className="text-sm text-muted-foreground mb-2">
                        {t('moderation.notes')}: {item.moderation_notes}
                      </p>
                    )}
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      <span>{t('moderation.flaggedAt')}: {new Date(item.flagged_at).toLocaleString()}</span>
                      {item.moderated_at && (
                        <span>{t('moderation.moderatedAt')}: {new Date(item.moderated_at).toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {item.status === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleApprove(item.id)}
                          disabled={approveMutation.isPending}
                          className="gap-2 text-green-600"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          {t('moderation.approve')}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReject(item.id)}
                          disabled={rejectMutation.isPending}
                          className="gap-2 text-red-600"
                        >
                          <XCircle className="w-4 h-4" />
                          {t('moderation.reject')}
                        </Button>
                      </>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleArchive(item.id)}
                      disabled={archiveMutation.isPending}
                      className="gap-2"
                    >
                      <Archive className="w-4 h-4" />
                      {t('moderation.archive')}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {queueData && (
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
            disabled={!queueData.data || queueData.data.length < limit}
            onClick={() => setPage(page + 1)}
          >
            {t('common.next')}
          </Button>
        </div>
      )}
    </div>
  );
}
