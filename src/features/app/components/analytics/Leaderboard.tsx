import { useTranslation } from 'react-i18next';
import { Trophy, Medal, Award } from 'lucide-react';
import { useParticipantRankings } from '@/hooks/queries/useAnalyticsQueries';
import { ChartCard } from '@/features/app/components/dashboard';
import { Badge } from '@/components/ui/badge';
import { DashboardSkeleton } from '@/components/loading/Skeletons';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface LeaderboardProps {
  organizationId: string;
  limit?: number;
  enabled?: boolean;
}

const MEDAL_ICONS = [Trophy, Medal, Award];

export function Leaderboard({ organizationId, limit = 10, enabled = true }: LeaderboardProps) {
  const { t } = useTranslation();
  const { data: rankings, isLoading } = useParticipantRankings(organizationId, limit, enabled);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (!rankings || rankings.length === 0) {
    return (
      <ChartCard title={t('analytics.leaderboard')} subtitle={t('analytics.topParticipants')}>
        <div className="flex items-center justify-center py-8 text-muted-foreground">
          {t('analytics.noLeaderboardData')}
        </div>
      </ChartCard>
    );
  }

  return (
    <ChartCard title={t('analytics.leaderboard')} subtitle={t('analytics.topParticipants')}>
      <div className="space-y-1">
        {rankings.map((participant, index) => {
          const Icon = MEDAL_ICONS[index] || Award;
          const isTopThree = index < 3;

          return (
            <div
              key={participant.id}
              className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                isTopThree ? 'bg-muted/70 hover:bg-muted' : 'hover:bg-muted/50'
              }`}
            >
              {/* Rank/Medal */}
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-background border-2 border-muted">
                {isTopThree ? (
                  <Icon
                    size={16}
                    className={`${
                      index === 0
                        ? 'text-yellow-500'
                        : index === 1
                          ? 'text-gray-400'
                          : 'text-orange-500'
                    }`}
                  />
                ) : (
                  <span className="text-xs font-bold text-muted-foreground">{index + 1}</span>
                )}
              </div>

              {/* Avatar */}
              <Avatar className="h-8 w-8">
                <AvatarFallback>{participant.display_name[0]}</AvatarFallback>
              </Avatar>

              {/* Name & Stats */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{participant.display_name}</p>
                <p className="text-xs text-muted-foreground">
                  {participant.total_interactions} interactions
                </p>
              </div>

              {/* Metrics */}
              <div className="flex items-center gap-2 ml-2">
                <Badge variant="secondary" className="text-xs">
                  {participant.events_attended} events
                </Badge>
                <Badge className="text-xs bg-blue-500/20 text-blue-700 hover:bg-blue-500/30">
                  {participant.completion_rate.toFixed(0)}%
                </Badge>
              </div>
            </div>
          );
        })}
      </div>
    </ChartCard>
  );
}
