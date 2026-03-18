import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ChartCard } from '../index';

interface RecentSession {
  id: string;
  game_type_name: string;
  event_title: string;
  current_round: number;
  status: string;
}

interface RecentActivitySectionProps {
  sessions: RecentSession[];
  delay?: number;
}

export function RecentActivitySection({ sessions, delay = 0.8 }: RecentActivitySectionProps) {
  const { t } = useTranslation();

  if (sessions.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      <ChartCard title={t('dashboard.recentActivity')} subtitle={t('dashboard.latestGameSessions')} noPadding>
        <div className="divide-y divide-border">
          {sessions.map(session => (
            <div key={session.id} className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 hover:bg-accent/40 transition-colors">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-foreground truncate">{session.game_type_name}</p>
                <p className="text-[11px] text-muted-foreground">{session.event_title} · Round {session.current_round}</p>
              </div>
              <Badge variant="outline" className={cn('text-[10px] border',
                session.status === 'active' ? 'bg-success/10 text-success border-success/20' :
                session.status === 'finished' ? 'bg-muted text-muted-foreground border-border' :
                'bg-warning/10 text-warning border-warning/20')}>
                {session.status}
              </Badge>
            </div>
          ))}
        </div>
      </ChartCard>
    </motion.div>
  );
}
