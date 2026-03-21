import { useTranslation } from 'react-i18next';
import { Users, Zap, Clock, TrendingUp } from 'lucide-react';
import { useEventAnalytics } from '@/hooks/queries/useAnalyticsQueries';
import { ChartCard, DashStat } from '@/features/app/components/dashboard';
import { Badge } from '@/components/ui/badge';
import { DashboardSkeleton } from '@/components/loading/Skeletons';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, ComposedChart,
} from 'recharts';

interface EventAnalyticsProps {
  eventId: string;
  enabled?: boolean;
}

export function EventAnalytics({ eventId, enabled = true }: EventAnalyticsProps) {
  const { t } = useTranslation();
  const { data: analytics, isLoading } = useEventAnalytics(eventId, enabled);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (!analytics) return null;

  const event = analytics.event;
  const sessions = analytics.sessions || [];
  const participants = analytics.participants || [];
  const timeline = analytics.timeline || [];

  // Prepare timeline data for chart
  const timelineData = timeline.map((t) => ({
    time: new Date(t.started_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    game: t.game_name,
    participants: t.participant_count,
  }));

  // Prepare participant engagement data
  const topEngagedParticipants = participants
    .sort((a, b) => b.interaction_count - a.interaction_count)
    .slice(0, 5);

  return (
    <div className="space-y-5">
      {/* Event Header */}
      <ChartCard title={event.title} subtitle={`${event.status} - ${event.event_mode}`}>
        <div className="space-y-4">
          <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
            <DashStat
              label={t('analytics.totalParticipants')}
              value={String(event.total_participants)}
              icon={Users}
              gradient="info"
            />
            <DashStat
              label={t('analytics.activeNow')}
              value={String(event.active_participants)}
              icon={Zap}
              gradient="success"
            />
            <DashStat
              label={t('analytics.totalSessions')}
              value={String(event.total_sessions)}
              icon={Clock}
              gradient="primary"
            />
            <DashStat
              label={t('analytics.avgEngagement')}
              value={`${(
                participants.reduce((sum, p) => sum + p.interaction_count, 0) / Math.max(1, participants.length)
              ).toFixed(0)}`}
              icon={TrendingUp}
              gradient="warning"
            />
          </div>
        </div>
      </ChartCard>

      {/* Session Timeline */}
      {timelineData.length > 0 && (
        <ChartCard title={t('analytics.sessionTimeline')} subtitle={t('analytics.participantFlow')}>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="time" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                }}
              />
              <Bar dataKey="participants" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Top Engaged Participants */}
        {topEngagedParticipants.length > 0 && (
          <ChartCard title={t('analytics.topParticipants')} subtitle={t('analytics.byEngagement')}>
            <div className="space-y-2">
              {topEngagedParticipants.map((participant, index) => (
                <div key={participant.id} className="flex items-center justify-between p-2 rounded border border-border/50">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{participant.display_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {participant.interaction_count} interactions
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    #{index + 1}
                  </Badge>
                </div>
              ))}
            </div>
          </ChartCard>
        )}

        {/* Sessions Overview */}
        {sessions.length > 0 && (
          <ChartCard title={t('analytics.gameSessions')} subtitle={t('analytics.total', { count: sessions.length })}>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {sessions.map((session) => (
                <div key={session.id} className="flex items-center justify-between p-2 rounded border border-border/50">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{session.game_name}</p>
                    <p className="text-xs text-muted-foreground">
                      Round {session.current_round} · {session.participant_count} participants
                    </p>
                  </div>
                  <Badge
                    variant={session.status === 'finished' ? 'outline' : 'default'}
                    className="text-xs ml-2"
                  >
                    {session.status}
                  </Badge>
                </div>
              ))}
            </div>
          </ChartCard>
        )}
      </div>

      {/* All Participants */}
      {participants.length > 0 && (
        <ChartCard
          title={t('analytics.allParticipants')}
          subtitle={t('analytics.total', { count: participants.length })}
        >
          <div className="grid gap-2 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 max-h-96 overflow-y-auto">
            {participants.map((participant) => (
              <div key={participant.id} className="p-2 rounded border border-border/50">
                <p className="font-medium text-sm truncate">{participant.display_name}</p>
                <div className="flex gap-2 mt-1 text-xs text-muted-foreground">
                  <span>{participant.interaction_count} interactions</span>
                  {participant.left_at && <span className="text-red-500">Left</span>}
                </div>
              </div>
            ))}
          </div>
        </ChartCard>
      )}
    </div>
  );
}
