import { useTranslation } from 'react-i18next';
import { Users, Zap, Clock, TrendingUp, MessageSquare, Star, BarChart3 } from 'lucide-react';
import { useEventAnalytics } from '@/hooks/queries/useAnalyticsQueries';
import { ChartCard, DashStat } from '@/features/app/components/dashboard';
import { Badge } from '@/components/ui/badge';
import { DashboardSkeleton } from '@/components/loading/Skeletons';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area,
} from 'recharts';

interface EventAnalyticsProps {
  eventId: string;
  enabled?: boolean;
}

export function EventAnalytics({ eventId, enabled = true }: EventAnalyticsProps) {
  const { t } = useTranslation();
  const { data: analytics, isLoading } = useEventAnalytics(eventId, enabled);

  if (isLoading) return <DashboardSkeleton />;
  if (!analytics) return null;

  const event = analytics.event;
  const sessions = analytics.sessions || [];
  const participants = analytics.participants || [];
  const timeline = analytics.timeline || [];
  const messageActivity = analytics.messageActivity || [];
  const feedback = analytics.feedback || { avg_rating: null, total_feedbacks: 0, positive_count: 0, negative_count: 0 };

  // Timeline data
  const timelineData = timeline.map((t: any) => ({
    time: new Date(t.started_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    game: t.game_name,
    participants: parseInt(t.participant_count) || 0,
  }));

  // Message activity chart data
  const messageChartData = messageActivity.map((m: any) => ({
    hour: new Date(m.hour).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    messages: parseInt(m.message_count) || 0,
    senders: parseInt(m.active_senders) || 0,
  }));

  // Top engaged participants
  const topEngaged = participants
    .sort((a: any, b: any) => (parseInt(b.interaction_count) || 0) - (parseInt(a.interaction_count) || 0))
    .slice(0, 5);

  const avgRating = feedback.avg_rating ? parseFloat(String(feedback.avg_rating)) : null;

  return (
    <div className="space-y-5">
      {/* Key Metrics */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
        <DashStat
          label={t('analytics.totalParticipants', { defaultValue: 'Participants' })}
          value={String(event.total_participants || 0)}
          icon={Users}
          gradient="info"
        />
        <DashStat
          label={t('analytics.activeNow', { defaultValue: 'Active' })}
          value={String(event.active_participants || 0)}
          icon={Zap}
          gradient="success"
        />
        <DashStat
          label={t('analytics.totalSessions', { defaultValue: 'Sessions' })}
          value={String(event.total_sessions || 0)}
          icon={Clock}
          gradient="primary"
        />
        <DashStat
          label={t('analytics.engagementRate', { defaultValue: 'Engagement' })}
          value={`${event.engagement_rate || 0}%`}
          icon={TrendingUp}
          gradient="warning"
        />
        <DashStat
          label={t('analytics.totalMessages', { defaultValue: 'Messages' })}
          value={String(event.total_messages || 0)}
          icon={MessageSquare}
          gradient="info"
        />
        {avgRating !== null && (
          <DashStat
            label={t('analytics.avgRating', { defaultValue: 'Avg Rating' })}
            value={`${avgRating}/5`}
            icon={Star}
            gradient="success"
          />
        )}
      </div>

      {/* Charts row */}
      <div className="grid gap-5 lg:grid-cols-2">
        {/* Session Timeline */}
        {timelineData.length > 0 && (
          <ChartCard title={t('analytics.sessionTimeline', { defaultValue: 'Activity Timeline' })} subtitle={t('analytics.participantFlow', { defaultValue: 'Participants per session' })}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="time" fontSize={11} />
                <YAxis fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="participants" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {/* Message Activity */}
        {messageChartData.length > 0 && (
          <ChartCard title={t('analytics.chatActivity', { defaultValue: 'Chat Activity' })} subtitle={t('analytics.messagesOverTime', { defaultValue: 'Messages over time' })}>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={messageChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="hour" fontSize={11} />
                <YAxis fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                    fontSize: '12px',
                  }}
                />
                <Area type="monotone" dataKey="messages" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.15)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        )}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Top Engaged Participants */}
        {topEngaged.length > 0 && (
          <ChartCard title={t('analytics.topParticipants', { defaultValue: 'Top Participants' })} subtitle={t('analytics.byEngagement', { defaultValue: 'By engagement' })}>
            <div className="space-y-2">
              {topEngaged.map((participant: any, index: number) => {
                const interactions = parseInt(participant.interaction_count) || 0;
                const messages = parseInt(participant.message_count) || 0;
                return (
                  <div key={participant.id} className="flex items-center justify-between p-2.5 rounded-lg border border-border/50 bg-muted/10">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{participant.display_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {interactions} actions · {messages} messages
                      </p>
                    </div>
                    <Badge variant="outline" className="text-[10px] shrink-0">
                      #{index + 1}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </ChartCard>
        )}

        {/* Sessions Overview */}
        {sessions.length > 0 && (
          <ChartCard title={t('analytics.activitySessions', { defaultValue: 'Activity Sessions' })} subtitle={`${sessions.length} total`}>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {sessions.map((session: any) => {
                const duration = parseInt(session.duration_minutes) || 0;
                const actions = parseInt(session.total_actions) || 0;
                return (
                  <div key={session.id} className="flex items-center justify-between p-2.5 rounded-lg border border-border/50 bg-muted/10">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{session.game_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {session.participant_count} participants · {duration}min · {actions} actions
                      </p>
                    </div>
                    <Badge
                      variant={session.status === 'finished' ? 'outline' : 'default'}
                      className="text-[10px] ml-2 shrink-0"
                    >
                      {session.status}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </ChartCard>
        )}
      </div>

      {/* Feedback summary */}
      {feedback.total_feedbacks > 0 && (
        <ChartCard title={t('analytics.feedbackSummary', { defaultValue: 'Feedback Summary' })}>
          <div className="grid gap-3 grid-cols-3">
            <div className="text-center p-3 rounded-lg bg-muted/20">
              <p className="text-2xl font-bold text-foreground">{avgRating || '—'}</p>
              <p className="text-xs text-muted-foreground mt-1">Avg Rating</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-success/10">
              <p className="text-2xl font-bold text-success">{feedback.positive_count || 0}</p>
              <p className="text-xs text-muted-foreground mt-1">Positive (4-5★)</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-destructive/10">
              <p className="text-2xl font-bold text-destructive">{feedback.negative_count || 0}</p>
              <p className="text-xs text-muted-foreground mt-1">Negative (1-2★)</p>
            </div>
          </div>
        </ChartCard>
      )}
    </div>
  );
}
