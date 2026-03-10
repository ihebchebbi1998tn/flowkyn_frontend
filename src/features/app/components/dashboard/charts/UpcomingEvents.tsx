/**
 * @fileoverview Upcoming events card — extracted from Dashboard.
 */

import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Calendar, ArrowUpRight } from 'lucide-react';
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

  return (
    <ChartCard 
      title={t('dashboard.upcomingEvents')} 
      className="lg:col-span-2" 
      noPadding
      action={
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-7 text-[11px] text-muted-foreground gap-1" 
          onClick={() => navigate(ROUTES.EVENTS)}
        >
          {t('common.all')} <ArrowUpRight className="h-3 w-3" />
        </Button>
      }
    >
      {events.length > 0 ? (
        <div className="divide-y divide-border">
          {events.map(event => (
            <button 
              key={event.id} 
              onClick={() => navigate(ROUTES.EVENT_DETAIL(event.id))}
              className="flex items-center gap-3 w-full px-5 py-3.5 text-left hover:bg-accent/40 transition-colors group"
            >
              <div className="flex flex-col items-center justify-center w-11 shrink-0">
                <span className="text-[10px] font-semibold uppercase text-muted-foreground leading-none">
                  {event.start_time ? format(new Date(event.start_time), 'MMM d') : 'TBD'}
                </span>
                <span className="text-[10px] text-muted-foreground/70 mt-0.5">
                  {event.start_time ? format(new Date(event.start_time), 'h:mm a') : '—'}
                </span>
              </div>
              <div className="h-8 w-px bg-border shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-foreground truncate group-hover:text-primary transition-colors">
                  {event.title}
                </p>
                <div className="flex items-center gap-2.5 mt-1">
                  <Badge 
                    variant="outline" 
                    className={cn('text-[9px] px-1.5 py-0 h-[18px] border',
                      event.event_mode === 'sync' 
                        ? 'border-primary/20 text-primary bg-primary/5' 
                        : 'border-success/20 text-success bg-success/5'
                    )}
                  >
                    {event.event_mode === 'sync' ? '● Live' : '○ Async'}
                  </Badge>
                  <div className="flex items-center gap-1">
                    <div className="h-1 w-12 rounded-full bg-muted overflow-hidden">
                      <div 
                        className="h-full rounded-full bg-primary transition-all" 
                        style={{ width: `${(event.participant_count / event.max_participants) * 100}%` }} 
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      {event.participant_count}/{event.max_participants}
                    </span>
                  </div>
                </div>
              </div>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/30 group-hover:text-primary transition-colors shrink-0" />
            </button>
          ))}
        </div>
      ) : (
        <EmptyState 
          icon={Calendar} 
          message={t('dashboard.noUpcomingEvents')} 
          description={t('dashboard.noUpcomingEventsDesc')} 
        />
      )}
      
      <div className="grid grid-cols-3 border-t border-border">
        {[
          { label: t('dashboard.active'), value: String(stats.activeSessions), icon: () => null },
          { label: t('dashboard.events'), value: String(stats.totalEvents), icon: () => null },
          { label: t('dashboard.completed'), value: String(stats.completedSessions), icon: () => null },
        ].map(s => (
          <div key={s.label} className="flex flex-col items-center py-3 gap-0.5 border-r last:border-r-0 border-border">
            <span className="text-[14px] font-bold text-foreground">{s.value}</span>
            <span className="text-[9px] text-muted-foreground">{s.label}</span>
          </div>
        ))}
      </div>
    </ChartCard>
  );
}