import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, MessageSquare, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageShell, PageHeader, ChartCard, EmptyState } from '@/features/app/components/dashboard';
import { CardGridSkeleton } from '@/components/loading/Skeletons';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/constants/routes';
import { ActivityCard } from '@/features/app/components/activities/ActivityCard';
import { ActivityFilters, type ActivityFilterState } from '@/features/app/components/activities/ActivityFilters';
import { ACTIVITIES } from '@/features/app/data/activities';
import { useActiveSessions } from '@/hooks/queries/useAnalyticsQueries';

const statusStyle = (s: string) => {
  switch (s) {
    case 'active': return 'bg-success/10 text-success border-success/20';
    case 'paused': return 'bg-warning/10 text-warning border-warning/20';
    default: return 'bg-muted text-muted-foreground border-border';
  }
};

const defaultFilters: ActivityFilterState = {
  search: '', category: 'all', type: 'all', teamSize: 'all',
};

export default function GameList() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [filters, setFilters] = useState<ActivityFilterState>(defaultFilters);

  const { data: activeSessions, isLoading: sessionsLoading } = useActiveSessions();

  const filtered = useMemo(() => {
    return ACTIVITIES.filter(a => {
      if (filters.category !== 'all' && a.category !== filters.category) return false;
      if (filters.type !== 'all' && a.type !== filters.type) return false;
      if (filters.teamSize !== 'all' && a.teamSizeTag !== filters.teamSize) return false;
      if (filters.search) {
        const q = filters.search.toLowerCase();
        const name = a.i18nKey ? t(`${a.i18nKey}.name`, { defaultValue: a.name }) : a.name;
        const description = a.i18nKey ? t(`${a.i18nKey}.description`, { defaultValue: a.description }) : a.description;
        if (!name.toLowerCase().includes(q) && !description.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [filters, t]);

  const liveSessionsList = activeSessions ?? [];

  return (
    <PageShell>
      <PageHeader title={t('games.title')} subtitle={t('games.subtitle')}
        actions={
          <Button className="h-8 text-caption gap-1.5 shadow-sm rounded-lg">
            <Plus className="h-3.5 w-3.5" /> {t('games.createSession')}
          </Button>
        }
      />

      {/* Live active sessions from backend */}
      {liveSessionsList.length > 0 && (
        <ChartCard title={t('games.activeSessions')} subtitle={t('games.activeCount', { count: liveSessionsList.length })} noPadding
          action={
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
            </span>
          }>
          <div className="divide-y divide-border">
            {liveSessionsList.map(session => (
              <button key={session.id} onClick={() => navigate(ROUTES.PLAY(session.id) + `?game=${session.game_type_id}`)}
                className="flex items-center justify-between gap-3 w-full px-5 py-3 hover:bg-accent/50 transition-colors group text-left">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                    <MessageSquare className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-body-sm font-medium text-foreground truncate">{session.game_type_name}</p>
                    <p className="text-caption text-muted-foreground">{session.event_title} · {t('games.round')} {session.current_round}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant="outline" className={cn('text-label-xs border', statusStyle(session.status))}>
                    {t(`games.statuses.${session.status}`, { defaultValue: session.status })}
                  </Badge>
                  <ChevronRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary transition-colors" />
                </div>
              </button>
            ))}
          </div>
        </ChartCard>
      )}

      <Tabs value={filters.category} onValueChange={v => setFilters(f => ({ ...f, category: v }))}>
        <TabsList className="h-9">
          <TabsTrigger value="all" className="text-caption h-7">{t('common.all')}</TabsTrigger>
          <TabsTrigger value="icebreaker" className="text-caption h-7">{t('games.categories.icebreaker')}</TabsTrigger>
          <TabsTrigger value="connection" className="text-caption h-7">{t('games.categories.connection')}</TabsTrigger>
          <TabsTrigger value="wellness" className="text-caption h-7">{t('games.categories.wellness')}</TabsTrigger>
          <TabsTrigger value="competition" className="text-caption h-7">{t('games.categories.competition')}</TabsTrigger>
        </TabsList>
      </Tabs>

      <ActivityFilters filters={filters} onChange={setFilters} resultCount={filtered.length} totalCount={ACTIVITIES.length} />

      {sessionsLoading ? (
        <CardGridSkeleton count={6} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          message={t('games.filters.noResults')}
          description={t('games.filters.noResultsHint')}
          action={
            <Button variant="outline" size="sm" onClick={() => setFilters(defaultFilters)}>
              {t('games.filters.clearAll')}
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((activity, i) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: Math.min(i * 0.06, 0.6), ease: [0.22, 1, 0.36, 1] }}
            >
              <ActivityCard activity={activity} />
            </motion.div>
          ))}
        </div>
      )}
    </PageShell>
  );
}
