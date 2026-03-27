import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Gamepad2, Clock, CheckCircle2, Pause } from 'lucide-react';
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

const statusConfig: Record<string, { icon: typeof CheckCircle2; class: string; dot: string }> = {
  active: { icon: Clock, class: 'bg-success/8 text-success border-success/20', dot: 'bg-success animate-pulse' },
  finished: { icon: CheckCircle2, class: 'bg-muted text-muted-foreground border-border', dot: 'bg-muted-foreground/40' },
  paused: { icon: Pause, class: 'bg-warning/8 text-warning border-warning/20', dot: 'bg-warning' },
};

export function RecentActivitySection({ sessions, delay = 0.8 }: RecentActivitySectionProps) {
  const { t } = useTranslation();

  if (sessions.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      <ChartCard title={t('dashboard.recentActivity')} subtitle={t('dashboard.latestGameSessions')} noPadding>
        <div className="divide-y divide-border/60">
          {sessions.map((session, i) => {
            const config = statusConfig[session.status] || statusConfig.active;
            return (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: delay + i * 0.04 }}
                className="flex items-center gap-3 px-4 py-3 hover:bg-accent/30 transition-colors group cursor-default"
              >
                {/* Game icon */}
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/8 text-primary shrink-0 transition-transform group-hover:scale-105">
                  <Gamepad2 className="h-4 w-4" strokeWidth={1.8} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-foreground truncate group-hover:text-primary transition-colors">
                    {session.game_type_name}
                  </p>
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                    <span className="truncate">{session.event_title}</span>
                    <span className="text-border">·</span>
                    <span className="shrink-0">{t('dashboard.round', 'Round')} {session.current_round}</span>
                  </p>
                </div>

                {/* Status */}
                <div className="flex items-center gap-2 shrink-0">
                  <span className={cn('inline-flex h-1.5 w-1.5 rounded-full', config.dot)} />
                  <Badge variant="outline" className={cn('text-[10px] border capitalize px-2 py-0 h-5', config.class)}>
                    {session.status}
                  </Badge>
                </div>
              </motion.div>
            );
          })}
        </div>
      </ChartCard>
    </motion.div>
  );
}
