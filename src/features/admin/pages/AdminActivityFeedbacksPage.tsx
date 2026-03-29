import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Eye, Search, Star } from 'lucide-react';
import { adminApi, type ActivityFeedbackEntry, type ActivityFeedbackStats } from '@/api/admin';
import { PageHeader } from '@/components/common/PageHeader';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TableSkeleton } from '@/components/loading/Skeletons';

type RatingFilter = 'all' | 1 | 2 | 3 | 4 | 5;
type CategoryFilter = 'all' | 'experience' | 'ui' | 'gameplay' | 'voice_audio' | 'other';

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, idx) => {
        const v = idx + 1;
        const active = v <= rating;
        return (
          <Star
            key={v}
            className={active ? 'h-4 w-4 text-warning' : 'h-4 w-4 text-muted-foreground'}
            style={{ fill: active ? 'currentColor' : 'none' }}
          />
        );
      })}
    </div>
  );
}

export default function AdminActivityFeedbacksPage() {
  const { t } = useTranslation();
  const [stats, setStats] = useState<ActivityFeedbackStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedbacks, setFeedbacks] = useState<ActivityFeedbackEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [rating, setRating] = useState<RatingFilter>('all');
  const [category, setCategory] = useState<CategoryFilter>('all');

  const [page, setPage] = useState(1);
  const limit = 15;
  const [totalPages, setTotalPages] = useState(1);
  const [selected, setSelected] = useState<ActivityFeedbackEntry | null>(null);

  const categoryOptions = useMemo(
    () =>
      [
        { key: 'experience' as const, label: t('activityFeedback.categories.experience', { defaultValue: 'Overall experience' }) },
        { key: 'ui' as const, label: t('activityFeedback.categories.ui', { defaultValue: 'UI / design' }) },
        { key: 'gameplay' as const, label: t('activityFeedback.categories.gameplay', { defaultValue: 'Experience' }) },
        { key: 'voice_audio' as const, label: t('activityFeedback.categories.voice_audio', { defaultValue: 'Voice / audio' }) },
        { key: 'other' as const, label: t('activityFeedback.categories.other', { defaultValue: 'Other' }) },
      ] as const,
    [t],
  );

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, listRes] = await Promise.all([
        adminApi.getActivityFeedbackStats(),
        adminApi.listActivityFeedbacks(page, limit, {
          rating: rating === 'all' ? undefined : rating,
          category: category === 'all' ? undefined : category,
          search: search.trim() ? search.trim() : undefined,
        }),
      ]);
      setStats(statsRes.data);
      setFeedbacks(listRes.data);
      setTotalPages(listRes.pagination.totalPages || 1);
    } catch (e: any) {
      setError(e?.message || 'Failed to load activity feedback');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, rating, category, search]);

  const clearFilters = () => {
    setSearch('');
    setRating('all');
    setCategory('all');
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('activityFeedback.admin.title', { defaultValue: 'Activity Feedback' })}
        subtitle={t('activityFeedback.admin.subtitle', { defaultValue: 'Ratings and comments submitted by users' })}
        actions={
          <div className="flex items-center gap-2">
            {stats && (
              <>
                <Badge variant="outline" className="text-[12px]">
                  {t('activityFeedback.admin.stats.total', { defaultValue: 'Total feedback' })}: {stats.totalCount}
                </Badge>
                <Badge variant="outline" className="text-[12px]">
                  {t('activityFeedback.admin.stats.avgRating', { defaultValue: 'Average rating' })}: {stats.avgRating ?? '—'}
                </Badge>
              </>
            )}
          </div>
        }
      />

      {/* Filters */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3 flex-1">
            <div className="relative max-w-md w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('activityFeedback.admin.searchPlaceholder', { defaultValue: 'Search by name, game type, or comment...' })}
                className="pl-10"
              />
            </div>

            <Select value={rating as any} onValueChange={(v) => setRating(v === 'all' ? 'all' : (Number(v) as any))}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('activityFeedback.admin.filters.all', { defaultValue: 'All' })}</SelectItem>
                {[1, 2, 3, 4, 5].map((r) => (
                  <SelectItem key={r} value={String(r)}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={category} onValueChange={(v) => setCategory(v as CategoryFilter)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('activityFeedback.admin.filters.all', { defaultValue: 'All' })}</SelectItem>
                {categoryOptions.map((c) => (
                  <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={clearFilters}>
              {t('activityFeedback.admin.buttons.clearFilters', { defaultValue: 'Clear filters' })}
            </Button>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-900">
          {error}
        </div>
      )}

      <div className="rounded-xl border border-border overflow-hidden bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left font-semibold px-4 py-3 text-muted-foreground">{t('activityFeedback.admin.table.reporter')}</th>
                <th className="text-left font-semibold px-4 py-3 text-muted-foreground w-[110px]">{t('activityFeedback.admin.table.rating')}</th>
                <th className="text-left font-semibold px-4 py-3 text-muted-foreground w-[140px]">{t('activityFeedback.admin.table.category')}</th>
                <th className="text-left font-semibold px-4 py-3 text-muted-foreground">{t('activityFeedback.admin.table.comment')}</th>
                <th className="text-left font-semibold px-4 py-3 text-muted-foreground w-[140px]">{t('activityFeedback.admin.table.game')}</th>
                <th className="text-left font-semibold px-4 py-3 text-muted-foreground w-[120px]">{t('activityFeedback.admin.table.source')}</th>
                <th className="text-left font-semibold px-4 py-3 text-muted-foreground w-[160px]">{t('activityFeedback.admin.table.createdAt')}</th>
                <th className="text-right font-semibold px-4 py-3 text-muted-foreground w-[90px]">{t('activityFeedback.admin.table.actions')}</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8}>
                    <TableSkeleton rows={6} cols={8} />
                  </td>
                </tr>
              ) : (
                feedbacks.map((fb) => (
                  <tr
                    key={fb.id}
                    className="border-b border-border/50 hover:bg-muted/20 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">{fb.reporter_name}</div>
                    </td>

                    <td className="px-4 py-3">
                      <Stars rating={fb.rating} />
                    </td>

                    <td className="px-4 py-3">
                      {fb.category ? (
                        <Badge variant="outline" className="text-[12px]">{fb.category}</Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-muted-foreground">
                      {fb.comment.length > 120 ? fb.comment.slice(0, 120) + '…' : fb.comment}
                    </td>

                    <td className="px-4 py-3 text-muted-foreground">
                      <div className="truncate">{fb.game_type_key}</div>
                      <div className="text-[11px] opacity-70 truncate">{fb.game_session_id ? `session: ${fb.game_session_id}` : 'session: —'}</div>
                    </td>

                    <td className="px-4 py-3">
                      <span className="text-muted-foreground">{fb.source}</span>
                    </td>

                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(fb.created_at).toLocaleString()}
                    </td>

                    <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1.5"
                        onClick={() => setSelected(fb)}
                      >
                        <Eye className="h-3.5 w-3.5" />
                        {t('activityFeedback.admin.table.viewDetails', { defaultValue: 'View details' })}
                      </Button>
                    </td>
                  </tr>
                ))
              )}

              {!loading && feedbacks.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-muted-foreground">
                    {t('activityFeedback.admin.noResults', { defaultValue: 'No feedback found' })}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <Button variant="outline" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
          {t('activityFeedback.admin.buttons.prev', { defaultValue: 'Prev' })}
        </Button>
        <div className="text-sm text-muted-foreground tabular-nums">
          Page {page} / {totalPages}
        </div>
        <Button variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
          {t('activityFeedback.admin.buttons.next', { defaultValue: 'Next' })}
        </Button>
      </div>

      <Dialog open={!!selected} onOpenChange={(v) => setSelected(v ? selected : null)}>
        <DialogContent className="max-w-2xl">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>
                  {selected.reporter_name} — {selected.rating}/5
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline">{selected.category ?? 'Other'}</Badge>
                  <Badge variant="outline">{selected.game_type_key}</Badge>
                  <Badge variant="outline">{selected.source}</Badge>
                  <span className="text-sm text-muted-foreground">{new Date(selected.created_at).toLocaleString()}</span>
                </div>

                <div className="rounded-xl border border-border bg-muted/30 p-4 whitespace-pre-wrap text-sm">
                  {selected.comment}
                </div>

                <div className="text-xs text-muted-foreground">
                  participantId: {selected.participant_id}
                  {selected.game_session_id ? ` • gameSessionId: ${selected.game_session_id}` : ''}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

