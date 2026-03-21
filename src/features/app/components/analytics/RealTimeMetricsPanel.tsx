import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Activity, Users, Zap, BarChart3 } from 'lucide-react';
import { useRealTimeMetrics } from '@/hooks/queries/useAnalyticsQueries';
import { ChartCard, DashStat } from '@/features/app/components/dashboard';
import { Badge } from '@/components/ui/badge';
import { DashboardSkeleton } from '@/components/loading/Skeletons';

interface RealTimeMetricsPanelProps {
  organizationId: string;
  enabled?: boolean;
}

export function RealTimeMetricsPanel({ organizationId, enabled = true }: RealTimeMetricsPanelProps) {
  const { t } = useTranslation();
  const { data: metrics, isLoading } = useRealTimeMetrics(organizationId, enabled);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (!metrics) return null;

  return (
    <div className="space-y-5">
      {/* Key Metrics */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <DashStat
          label={t('analytics.activeSessions')}
          value={String(metrics.activeSessions.length)}
          icon={Activity}
          gradient="primary"
        />
        <DashStat
          label={t('analytics.onlineNow')}
          value={String(metrics.onlineParticipantsCount)}
          icon={Users}
          gradient="info"
        />
        <DashStat
          label={t('analytics.recentlyCompleted')}
          value={String(metrics.recentSessions.length)}
          icon={Zap}
          gradient="success"
        />
        <DashStat
          label={t('analytics.gameTypes')}
          value={String(metrics.gameBreakdown.length)}
          icon={BarChart3}
          gradient="warning"
        />
      </div>

      {/* Active Sessions */}
      {metrics.activeSessions.length > 0 && (
        <ChartCard title={t('analytics.activeSessions')} subtitle={t('analytics.liveNow')}>
          <div className="space-y-3">
            {metrics.activeSessions.map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm truncate">{session.game_name}</p>
                  <p className="text-xs text-muted-foreground truncate">{session.event_title}</p>
                </div>
                <div className="flex items-center gap-2 ml-2">
                  <Badge variant="secondary" className="text-xs">
                    R{session.current_round}
                  </Badge>
                  <Badge className="text-xs bg-green-500/20 text-green-700 hover:bg-green-500/30">
                    {session.participant_count} {t('common.participants')}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </ChartCard>
      )}

      {/* Game Breakdown */}
      {metrics.gameBreakdown.length > 0 && (
        <ChartCard title={t('analytics.gameBreakdown')} subtitle={t('analytics.last30Days')}>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {metrics.gameBreakdown.map((game) => (
              <div
                key={game.key}
                className="flex items-center justify-between p-2 rounded border border-border/50 hover:border-border transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm truncate">{game.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {game.avg_duration_minutes}m avg
                  </p>
                </div>
                <div className="text-right text-xs">
                  <p className="font-semibold">{game.session_count} sessions</p>
                  <p className="text-muted-foreground">{game.total_participants} participants</p>
                </div>
              </div>
            ))}
          </div>
        </ChartCard>
      )}

      {/* Recently Completed */}
      {metrics.recentSessions.length > 0 && (
        <ChartCard title={t('analytics.recentlyCompleted')} subtitle={t('analytics.last24Hours')}>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {metrics.recentSessions.map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between p-2 rounded border border-border/50"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm truncate">{session.game_name}</p>
                  <p className="text-xs text-muted-foreground truncate">{session.event_title}</p>
                </div>
                <Badge variant="outline" className="text-xs ml-2">
                  {session.participant_count} attended
                </Badge>
              </div>
            ))}
          </div>
        </ChartCard>
      )}

      {/* Last Updated */}
      <div className="text-xs text-muted-foreground text-center">
        {t('analytics.lastUpdated')}: {new Date(metrics.timestamp).toLocaleTimeString()}
      </div>
    </div>
  );
}
