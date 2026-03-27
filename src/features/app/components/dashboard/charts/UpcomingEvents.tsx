import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Calendar, ArrowUpRight, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChartCard, EmptyState } from '../index';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/constants/routes';
import { format } from 'date-fns';

interface UpcomingEvent {
  id: string;
  title: string;
  start_time?: string;
  event_mode: 'sync' | 'async';
  participant_count: number;
  max_participants: number;
}

interface UpcomingEventsProps {
  events: UpcomingEvent[];
  stats: {
    activeSessions: number;
    totalEvents: number;
    completedSessions: number;
  };
}

export function UpcomingEvents({ events, stats }: UpcomingEventsProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const statItems = [
    { label: t('dashboard.active'), value: String(stats.activeSessions), color: 'text-success' },
    { label: t('dashboard.events'), value: String(stats.totalEvents), color: 'text-primary' },
    { label: t('dashboard.completed'), value: String(stats.completedSessions), color: 'text-muted-foreground' },
  ];

  return (
    <ChartCard
      title={t('dashboard.upcomingEvents')}
      className="lg:col-span-2"
      noPadding
      action={
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-[11px] text-muted-foreground gap-1 hover:text-primary"
          onClick={() => navigate(ROUTES.EVENTS)}
        >
          {t('common.all')} <ArrowUpRight className="h-3 w-3" />
        </Button>
      }
    >
      {events.length > 0 ? (
        <div className="divide-y divide-border/50">
          {events.map((event, i) => {
            const fillPct = Math.round((event.participant_count / event.max_participants) * 100);
            return (
              <button
                key={event.id}
                onClick={() => navigate(ROUTES.EVENT_DETAIL(event.id))}
                className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-accent/30 transition-colors group"
              >
                {/* Date pill */}
                <div className="flex flex-col items-center justify-center w-11 h-11 rounded-lg bg-muted/60 border border-border/50 shrink-0">
                  <span className="text-[10px] font-bold uppercase text-foreground leading-none">
                    {event.start_time ? format(new Date(event.start_time), 'MMM') : '—'}
                  </span>
                  <span className="text-[15px] font-bold text-foreground leading-tight">
                    {event.start_time ? format(new Date(event.start_time), 'd') : '?'}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-foreground truncate group-hover:text-primary transition-colors">
                    {event.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <Badge
                      variant="outline"
                      className={cn('text-[9px] px-1.5 py-0 h-[18px] border',
                        event.event_mode === 'sync'
                          ? 'border-primary/20 text-primary bg-primary/5'
                          : 'border-success/20 text-success bg-success/5'
                      )}
                    >
                      {event.event_mode === 'sync' ? t('events.badgeLiveShort') : t('events.badgeAsyncShort')}
                    </Badge>
                    <div className="flex items-center gap-1.5">
                      <Users className="h-3 w-3 text-muted-foreground/50" />
                      <div className="h-1.5 w-12 rounded-full bg-muted overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all',
                            fillPct >= 80 ? 'bg-warning' : 'bg-primary'
                          )}
                          style={{ width: `${fillPct}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        {event.participant_count}/{event.max_participants}
                      </span>
                    </div>
                  </div>
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/20 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
              </button>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={Calendar}
          message={t('dashboard.noUpcomingEvents')}
          description={t('dashboard.noUpcomingEventsDesc')}
        />
      )}

      {/* Footer stats */}
      <div className="grid grid-cols-3 border-t border-border/50">
        {statItems.map(s => (
          <div
            key={s.label}
            className="flex flex-col items-center py-3 gap-0.5 border-r last:border-r-0 border-border/40"
          >
            <span className={cn('text-[15px] font-bold', s.color)} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              {s.value}
            </span>
            <span className="text-[9px] text-muted-foreground uppercase tracking-wider font-medium">{s.label}</span>
          </div>
        ))}
      </div>
    </ChartCard>
  );
}
