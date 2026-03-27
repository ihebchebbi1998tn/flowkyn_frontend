import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users, Play, BarChart3, Layers, Gauge, Zap, Award, CheckCircle,
  TrendingUp, Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/context/AuthContext';
import { ROUTES } from '@/constants/routes';
import {
  PageShell, DashStat, ChartCard, RankedItem, EmptyState,
  EngagementChart, UpcomingEvents,
  chartTooltipStyle, chartAxisProps, chartGridProps,
} from '@/features/app/components/dashboard';
import { WelcomeHero } from '@/features/app/components/dashboard/WelcomeHero';
import { ActivityBreakdownSection, PerformanceSection, RecentActivitySection } from '@/features/app/components/dashboard/sections';
import { DashboardSkeleton } from '@/components/loading';
import { useDashboardStats, useAnalyticsOverview } from '@/hooks/queries/useAnalyticsQueries';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, RadialBarChart, RadialBar,
} from 'recharts';

const CATEGORY_COLORS: Record<string, string> = {
  icebreaker: 'hsl(var(--primary))',
  connection: 'hsl(var(--chart-3))',
  wellness: 'hsl(var(--chart-4))',
  competition: 'hsl(var(--chart-5))',
};

export default function Dashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [range, setRange] = useState('6');

  const months = { '1': 1, '3': 3, '6': 6, '12': 12 }[range] || 6;

  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: overview, isLoading: overviewLoading } = useAnalyticsOverview(months);

  const isLoading = statsLoading || overviewLoading;

  if (isLoading) return <DashboardSkeleton />;

  // Demo/placeholder data for empty states
  const demoEngagement = [
    { month: 'Jan', sessions: 12, completed: 9 },
    { month: 'Feb', sessions: 18, completed: 14 },
    { month: 'Mar', sessions: 24, completed: 19 },
    { month: 'Apr', sessions: 15, completed: 12 },
    { month: 'May', sessions: 28, completed: 22 },
    { month: 'Jun', sessions: 32, completed: 26 },
  ];

  const demoActivityBreakdown = [
    { name: 'Two Truths', value: 14, participants: 42, sessions: 14, category: 'icebreaker', fill: 'hsl(var(--primary))' },
    { name: 'Coffee Roulette', value: 10, participants: 30, sessions: 10, category: 'connection', fill: 'hsl(var(--chart-3))' },
    { name: 'Wins of Week', value: 8, participants: 24, sessions: 8, category: 'wellness', fill: 'hsl(var(--chart-4))' },
    { name: 'Strategic Escape', value: 6, participants: 18, sessions: 6, category: 'competition', fill: 'hsl(var(--chart-5))' },
  ];

  const demoRecentActivity = [
    { id: 'demo-1', game_type_name: 'Two Truths & a Lie', event_title: 'Friday Icebreaker', current_round: 3, status: 'active' },
    { id: 'demo-2', game_type_name: 'Coffee Roulette', event_title: 'Monday Connect', current_round: 1, status: 'finished' },
    { id: 'demo-3', game_type_name: 'Wins of the Week', event_title: 'Team Standup', current_round: 2, status: 'active' },
  ];

  const rawEngagement = (overview?.engagementTrend ?? []).map(d => ({
    month: d.month,
    sessions: parseInt(d.sessions),
    completed: parseInt(d.completed),
  }));
  const engagementData = rawEngagement.length > 0 ? rawEngagement : demoEngagement;
  const isEngagementDemo = rawEngagement.length === 0;

  const rawActivityBreakdown = (overview?.activityBreakdown ?? []).map(d => ({
    name: d.name,
    value: parseInt(d.sessions),
    participants: parseInt(d.participants),
    sessions: parseInt(d.sessions),
    category: d.category,
    fill: d.category === 'icebreaker' ? 'hsl(var(--primary))' :
          d.category === 'connection' ? 'hsl(var(--chart-3))' :
          d.category === 'wellness' ? 'hsl(var(--chart-4))' : 'hsl(var(--chart-5))',
  }));
  const activityBreakdown = rawActivityBreakdown.length > 0 ? rawActivityBreakdown : demoActivityBreakdown;
  const isActivityDemo = rawActivityBreakdown.length === 0;

  const rawRecentActivity = stats?.recentActivity ?? [];
  const recentActivity = rawRecentActivity.length > 0 ? rawRecentActivity : demoRecentActivity;
  const isRecentDemo = rawRecentActivity.length === 0;

  const categoryData = Object.entries(
    activityBreakdown.reduce((acc, d) => {
      acc[d.category] = (acc[d.category] || 0) + d.sessions;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
    fill: CATEGORY_COLORS[name] || 'hsl(var(--primary))',
  }));

  const topActivities = (overview?.topActivities ?? []).map(d => ({
    name: d.name,
    participants: parseInt(d.participants),
    sessions: parseInt(d.sessions),
    actions: parseInt(d.total_actions),
    category: d.category,
  }));

  const analyticsStats = overview?.stats ?? { totalSessions: 0, totalParticipants: 0, completionRate: 0 };
  const completionRate = analyticsStats.completionRate ?? 0;
  const hasAnalyticsData = analyticsStats.totalSessions > 0;

  const overviewStats = [
    { label: t('dashboard.activeSessions'), value: String(stats?.activeSessions ?? 0), icon: Play, gradient: 'primary' as const },
    { label: t('dashboard.teamMembers'), value: String(stats?.teamMembers ?? 0), icon: Users, gradient: 'info' as const },
    { label: t('dashboard.totalEvents'), value: String(stats?.totalEvents ?? 0), icon: Layers, gradient: 'success' as const },
    { label: t('dashboard.completion'), value: `${completionRate}%`, icon: Gauge, gradient: 'warning' as const },
  ];

  const insightsStats = [
    { label: t('analyticsPage.totalSessions'), value: String(analyticsStats.totalSessions), icon: Layers, gradient: 'primary' as const },
    { label: t('analyticsPage.participants'), value: String(analyticsStats.totalParticipants), icon: Users, gradient: 'info' as const },
    { label: t('analyticsPage.completion'), value: `${completionRate}%`, icon: CheckCircle, gradient: 'success' as const },
    { label: t('analyticsPage.activities'), value: String(topActivities.length), icon: Award, gradient: 'warning' as const },
  ];

  return (
    <PageShell>
      {/* Welcome hero with quick actions */}
      <WelcomeHero
        userName={user?.name?.split(' ')[0] || ''}
        activeSessions={stats?.activeSessions ?? 0}
        totalEvents={stats?.totalEvents ?? 0}
        teamMembers={stats?.teamMembers ?? 0}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <TabsList className="h-9 bg-muted/50 border border-border/50">
            <TabsTrigger value="overview" className="text-[12px] gap-1.5 px-3 data-[state=active]:bg-card data-[state=active]:shadow-sm">
              <Play className="h-3.5 w-3.5" />
              {t('dashboard.tabs.overview', 'Overview')}
            </TabsTrigger>
            <TabsTrigger value="insights" className="text-[12px] gap-1.5 px-3 data-[state=active]:bg-card data-[state=active]:shadow-sm">
              <BarChart3 className="h-3.5 w-3.5" />
              {t('dashboard.tabs.insights', 'Insights')}
            </TabsTrigger>
          </TabsList>

          {activeTab === 'insights' && (
            <Select value={range} onValueChange={setRange}>
              <SelectTrigger className="w-[130px] h-8 text-[12px] border-border/60">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">{t('analyticsPage.lastMonth')}</SelectItem>
                <SelectItem value="3">{t('analyticsPage.threeMonths')}</SelectItem>
                <SelectItem value="6">{t('analyticsPage.sixMonths')}</SelectItem>
                <SelectItem value="12">{t('analyticsPage.oneYear')}</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>

        {/* ═══════════════ OVERVIEW TAB ═══════════════ */}
        <TabsContent value="overview" className="mt-4 space-y-4">
          <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
            {overviewStats.map((stat, i) => (
              <motion.div key={stat.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: i * 0.04 }}>
                <DashStat {...stat} />
              </motion.div>
            ))}
          </div>

          <motion.div
            className="grid gap-3 lg:grid-cols-5"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: 0.16 }}
          >
            <EngagementChart data={engagementData} onViewDetails={() => setActiveTab('insights')} isDemo={isEngagementDemo} />
            <UpcomingEvents events={(stats?.upcomingEvents ?? []) as any} stats={{
              activeSessions: stats?.activeSessions ?? 0,
              totalEvents: stats?.totalEvents ?? 0,
              completedSessions: stats?.completedSessions ?? 0,
            }} />
          </motion.div>

          <ActivityBreakdownSection data={activityBreakdown} isDemo={isActivityDemo} />
          <PerformanceSection
            totalSessions={analyticsStats.totalSessions ?? 0}
            totalParticipants={analyticsStats.totalParticipants ?? 0}
            completionRate={completionRate}
          />
          <RecentActivitySection sessions={recentActivity as any} isDemo={isRecentDemo} />
        </TabsContent>

        {/* ═══════════════ INSIGHTS TAB ═══════════════ */}
        <TabsContent value="insights" className="mt-4 space-y-4">
          <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
            {insightsStats.map((stat, i) => (
              <motion.div key={stat.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: i * 0.04 }}>
                <DashStat {...stat} />
              </motion.div>
            ))}
          </div>

          {!hasAnalyticsData ? (
            <EmptyState
              icon={BarChart3}
              message={t('analyticsPage.noAnalyticsData')}
              description={t('analyticsPage.noAnalyticsDataDesc')}
            />
          ) : (
            <>
              <div className="grid gap-4 lg:grid-cols-5">
                <ChartCard title={t('analytics.engagement')} subtitle={t('analyticsPage.sessionsOverTime')} className="lg:col-span-3">
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={engagementData}>
                      <defs>
                        <linearGradient id="analyticsEngGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.15} />
                          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid {...chartGridProps} />
                      <XAxis dataKey="month" {...chartAxisProps} dy={8} />
                      <YAxis {...chartAxisProps} fontSize={10} width={30} />
                      <Tooltip contentStyle={chartTooltipStyle} />
                      <Area type="monotone" dataKey="sessions" stroke="hsl(var(--primary))" strokeWidth={2.5} fill="url(#analyticsEngGrad)" name={t('dashboard.started')}
                        dot={false} activeDot={{ r: 5, strokeWidth: 2, stroke: 'hsl(var(--card))', fill: 'hsl(var(--primary))' }} />
                      <Area type="monotone" dataKey="completed" stroke="hsl(var(--chart-3))" strokeWidth={2} strokeDasharray="5 5" fill="none" name={t('dashboard.completed')}
                        dot={false} activeDot={{ r: 4, strokeWidth: 2, stroke: 'hsl(var(--card))', fill: 'hsl(var(--chart-3))' }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartCard>

                <ChartCard title={t('analyticsPage.byGameType')} subtitle={t('analyticsPage.participantsPerActivity')} className="lg:col-span-2">
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={activityBreakdown} layout="vertical" barSize={18}>
                      <CartesianGrid {...chartGridProps} horizontal={false} vertical />
                      <XAxis type="number" {...chartAxisProps} fontSize={10} />
                      <YAxis dataKey="name" type="category" {...chartAxisProps} width={90} />
                      <Tooltip contentStyle={chartTooltipStyle} />
                      <Bar dataKey="participants" radius={[0, 6, 6, 0]}>
                        {activityBreakdown.map((d, i) => (
                          <Cell key={i} fill={CATEGORY_COLORS[d.category] || `hsl(var(--primary) / ${1 - i * 0.15})`} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
              </div>

              <div className="grid gap-4 lg:grid-cols-3">
                <ChartCard title={t('analyticsPage.categorySplit')} subtitle={t('analyticsPage.distribution')}>
                  <div className="flex items-center gap-6">
                    <ResponsiveContainer width={140} height={140}>
                      <PieChart>
                        <Pie data={categoryData} cx="50%" cy="50%" outerRadius={62} innerRadius={42} paddingAngle={4} dataKey="value" strokeWidth={0}>
                          {categoryData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                        </Pie>
                        <Tooltip contentStyle={chartTooltipStyle} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex-1 space-y-3">
                      {categoryData.map(item => {
                        const total = categoryData.reduce((s, d) => s + d.value, 0);
                        const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
                        return (
                          <div key={item.name}>
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: item.fill }} />
                                <span className="text-[12px] text-foreground font-medium">{item.name}</span>
                              </div>
                              <span className="text-[12px] font-semibold text-foreground">{pct}%</span>
                            </div>
                            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: item.fill }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </ChartCard>

                <ChartCard title={t('analyticsPage.completionRate')} subtitle={t('analyticsPage.sessionCompletion')}>
                  <div className="flex flex-col items-center justify-center h-[200px]">
                    <div className="relative">
                      <ResponsiveContainer width={160} height={160}>
                        <RadialBarChart cx="50%" cy="50%" innerRadius={55} outerRadius={72} startAngle={90} endAngle={-270} data={[{ value: completionRate }]}>
                          <RadialBar dataKey="value" fill="hsl(var(--primary))" cornerRadius={10} background={{ fill: 'hsl(var(--muted))' }} />
                        </RadialBarChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-[28px] font-extrabold text-foreground tracking-tight">{completionRate}%</span>
                        <span className="text-[10px] text-muted-foreground font-medium">{t('analyticsPage.completionLabel')}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 mt-1 text-success">
                      <Sparkles className="h-3 w-3" />
                      <span className="text-[11px] font-medium">
                        {completionRate >= 80 ? t('analyticsPage.excellent') : completionRate >= 60 ? t('analyticsPage.good') : t('analyticsPage.improving')}
                      </span>
                    </div>
                  </div>
                </ChartCard>

                <ChartCard title={t('analyticsPage.topActivities')} subtitle={t('analyticsPage.bestPerforming')}>
                  {topActivities.length > 0 ? (
                    <div className="space-y-1">
                      {topActivities.map((a, i) => (
                        <RankedItem key={a.name} rank={i + 1}
                          icon={<BarChart3 className="h-3.5 w-3.5 text-primary" strokeWidth={1.8} />}
                          title={a.name} subtitle={t('analyticsPage.participantsSessions', { participants: a.participants, sessions: a.sessions })}
                          right={
                            <div className="flex items-center gap-1">
                              <span className="text-[13px] font-semibold text-foreground">{a.actions}</span>
                              <span className="text-[10px] text-muted-foreground">{t('analyticsPage.actions')}</span>
                            </div>
                          }
                        />
                      ))}
                    </div>
                  ) : (
                    <EmptyState icon={Award} message={t('analyticsPage.noActivityData')} />
                  )}
                </ChartCard>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </PageShell>
  );
}
