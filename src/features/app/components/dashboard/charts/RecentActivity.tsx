/**
 * @fileoverview Recent activity list — extracted from Dashboard.
 */

import { useTranslation } from 'react-i18next';
import { Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ChartCard } from '../index';
import { cn } from '@/lib/utils';

interface RecentSession {
  id: string;
  game_type_name: string;
  event_title: string;
  current_round: number;
  status: string;
}

interface RecentActivityProps {
  sessions: RecentSession[];
}

const statusStyles: Record<string, string> = {
  active: 'border-primary/20 text-primary bg-primary/5',
  paused: 'border-warning/20 text-warning bg-warning/5', 
  finished: 'border-success/20 text-success bg-success/5',
};

export function RecentActivity({ sessions }: RecentActivityProps) {
  const { t } = useTranslation();

  return (
    <ChartCard 
      title={t('dashboard.recentActivity')} 
      subtitle={t('dashboard.latestGameSessions')} 
      noPadding
    >
      <div className="divide-y divide-border">
        {sessions.map(session => (
          <div 
            key={session.id} 
            className="flex items-center gap-3 px-5 py-3 hover:bg-accent/40 transition-colors"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium text-foreground truncate">
                {session.game_type_name}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {session.event_title} · Round {session.current_round}
              </p>
            </div>
            <Badge 
              variant="outline" 
              className={cn(
                'text-[10px] border capitalize',
                statusStyles[session.status] || 'border-border text-muted-foreground'
              )}
            >
              {session.status}
            </Badge>
          </div>
        ))}
      </div>
    </ChartCard>
  );
}