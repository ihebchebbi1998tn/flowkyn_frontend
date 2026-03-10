/**
 * @fileoverview Event List page — premium card grid with status filters.
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Plus, CalendarDays, Users, Clock, Radio, Timer, Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageShell, PageHeader, EmptyState } from '@/features/app/components/dashboard';
import { CardGridSkeleton } from '@/components/loading/Skeletons';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/constants/routes';
import { useEvents } from '@/hooks/queries';

const statusStyles: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground border-border',
  active: 'bg-success/10 text-success border-success/25',
  completed: 'bg-muted text-muted-foreground border-border',
};

const statusDots: Record<string, string> = {
  draft: 'bg-muted-foreground/40',
  active: 'bg-success animate-pulse',
  completed: 'bg-muted-foreground/30',
};

export default function EventList() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');
  const [page] = useState(1);

  const { data, isLoading } = useEvents(page, 50);
  const events = data?.data || [];
  const filtered = filter === 'all' ? events : events.filter(e => e.status === filter);

  return (
    <PageShell>
      <PageHeader title={t('events.title')} subtitle={t('events.subtitle')}
        actions={
          <Button onClick={() => navigate(ROUTES.EVENT_NEW)} className="gap-1.5 shadow-sm">
            <Plus className="h-3.5 w-3.5" /> {t('events.createEvent')}
          </Button>
        }
      />

      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList className="h-9 bg-muted/50 p-0.5 rounded-xl">
          <TabsTrigger value="all" className="text-body-sm h-8 rounded-lg data-[state=active]:shadow-sm">{t('events.filters.all')}</TabsTrigger>
          <TabsTrigger value="draft" className="text-body-sm h-8 rounded-lg data-[state=active]:shadow-sm">{t('events.filters.draft')}</TabsTrigger>
          <TabsTrigger value="active" className="text-body-sm h-8 rounded-lg data-[state=active]:shadow-sm">{t('events.filters.active')}</TabsTrigger>
          <TabsTrigger value="completed" className="text-body-sm h-8 rounded-lg data-[state=active]:shadow-sm">{t('events.filters.completed')}</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <CardGridSkeleton count={6} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          message={t('events.noEvents')}
          description={t('events.noEventsDescription')}
          action={
            <Button onClick={() => navigate(ROUTES.EVENT_NEW)} className="gap-1.5">
              <Sparkles className="h-3.5 w-3.5" /> {t('events.createEvent')}
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((event, i) => (
            <motion.div key={event.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: Math.min(i * 0.06, 0.5), ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
            >
            <div onClick={() => navigate(ROUTES.EVENT_DETAIL(event.id))}
              className="group rounded-2xl border border-border bg-card overflow-hidden transition-all duration-300 cursor-pointer hover:border-primary/25 hover:shadow-xl hover:shadow-primary/[0.06] hover:-translate-y-1">
              
              {/* Status accent bar */}
              <div className={cn("h-0.5 w-full bg-gradient-to-r",
                event.status === 'active' ? 'from-success to-success/50' : event.status === 'draft' ? 'from-muted-foreground/20 to-transparent' : 'from-muted-foreground/10 to-transparent'
              )} />

              <div className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="outline" className={cn('text-label border gap-1', statusStyles[event.status] || statusStyles.draft)}>
                    <div className={cn("h-1.5 w-1.5 rounded-full", statusDots[event.status] || statusDots.draft)} />
                    {event.status}
                  </Badge>
                  <Badge variant="outline" className={cn('text-label border gap-0.5',
                    event.event_mode === 'sync' ? 'bg-primary/5 text-primary border-primary/20' : 'bg-success/5 text-success border-success/20')}>
                    {event.event_mode === 'sync' ? <><Radio className="h-2.5 w-2.5" /> Live</> : <><Clock className="h-2.5 w-2.5" /> Async</>}
                  </Badge>
                </div>

                <h3 className="text-[15px] font-bold text-card-foreground group-hover:text-primary transition-colors leading-tight truncate mb-1.5">
                  {event.title}
                </h3>
                <p className="text-body-sm text-muted-foreground line-clamp-2 leading-relaxed mb-4">
                  {event.description}
                </p>

                <div className="flex items-center justify-between">
                  <span className="text-label text-muted-foreground flex items-center gap-1.5">
                    <Users className="h-3 w-3" /> Max {event.max_participants}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between px-5 py-3 border-t border-border/40 bg-muted/20 text-label text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="h-3 w-3" />
                  {event.start_time ? new Date(event.start_time).toLocaleDateString() : '—'}
                </span>
                <span className="flex items-center gap-1.5">
                  <Timer className="h-3 w-3" />
                  {event.event_mode === 'async' ? t('events.ongoing') : (event.end_time && event.start_time ? `${Math.round((new Date(event.end_time).getTime() - new Date(event.start_time).getTime()) / 60000)} min` : '—')}
                </span>
              </div>
            </div>
            </motion.div>
          ))}
        </div>
      )}
    </PageShell>
  );
}
