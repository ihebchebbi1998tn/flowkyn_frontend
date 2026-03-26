import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, Play, BarChart3, Layers, Gauge, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { ROUTES } from '@/constants/routes';
import { PageShell, PageHeader, DashStat, EngagementChart, UpcomingEvents } from '@/features/app/components/dashboard';
import { ActivityBreakdownSection, PerformanceSection, RecentActivitySection } from '@/features/app/components/dashboard/sections';
import { DashboardSkeleton } from '@/components/loading';
import { useDashboardStats, useAnalyticsOverview } from '@/hooks/queries/useAnalyticsQueries';

export default function Dashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: overview, isLoading: overviewLoading } = useAnalyticsOverview(6);

  const isLoading = statsLoading || overviewLoading;

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return t('dashboard.goodMorning', 'Good morning');
    if (h < 18) return t('dashboard.goodAfternoon', 'Good afternoon');
    return t('dashboard.goodEvening', 'Good evening');
  };

  if (isLoading) return <DashboardSkeleton />;

  const engagementData = (overview?.engagementTrend ?? []).map(d => ({
    month: d.month,
    sessions: parseInt(d.sessions),
    completed: parseInt(d.completed),
  }));

  const activityBreakdown = (overview?.activityBreakdown ?? []).map(d => ({
    name: d.name,
    value: parseInt(d.sessions),
    fill: d.category === 'icebreaker' ? 'hsl(var(--primary))' :
          d.category === 'connection' ? 'hsl(var(--chart-3))' :
          d.category === 'wellness' ? 'hsl(var(--chart-4))' : 'hsl(var(--chart-5))',
  }));

  const completionRate = overview?.stats?.completionRate ?? 0;

  const statItems = [
    { label: t('dashboard.activeSessions'), value: String(stats?.activeSessions ?? 0), icon: Play, gradient: 'primary' as const },
    { label: t('dashboard.teamMembers'), value: String(stats?.teamMembers ?? 0), icon: Users, gradient: 'info' as const },
    { label: t('dashboard.totalEvents'), value: String(stats?.totalEvents ?? 0), icon: Layers, gradient: 'success' as const },
    { label: t('dashboard.completion'), value: `${completionRate}%`, icon: Gauge, gradient: 'warning' as const },
  ];

  return (
    <PageShell>
      <PageHeader
        title={`${greeting()}, ${user?.name?.split(' ')[0] || ''}`}
        subtitle=""
        actions={
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={() => navigate(ROUTES.GAMES)} className="h-8 px-3 text-xs gap-1.5">
              <Zap className="h-3.5 w-3.5" /> {t('dashboard.launchActivity')}
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate(ROUTES.ANALYTICS)} className="h-8 px-3 text-xs gap-1.5">
              <BarChart3 className="h-3.5 w-3.5" /> {t('dashboard.analytics')}
            </Button>
          </div>
        }
      />

      {/* Stat cards — tighter */}
      <div className="grid gap-2.5 grid-cols-2 lg:grid-cols-4">
        {statItems.map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15, delay: i * 0.03 }}>
            <DashStat {...stat} />
          </motion.div>
        ))}
      </div>

      <motion.div
        className="grid gap-3 lg:grid-cols-5"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: 0.12 }}
      >
        <EngagementChart data={engagementData} onViewDetails={() => navigate(ROUTES.ANALYTICS)} />
        <UpcomingEvents events={(stats?.upcomingEvents ?? []) as any} stats={{
          activeSessions: stats?.activeSessions ?? 0,
          totalEvents: stats?.totalEvents ?? 0,
          completedSessions: stats?.completedSessions ?? 0
        }} />
      </motion.div>

      <ActivityBreakdownSection data={activityBreakdown} />

      <PerformanceSection
        totalSessions={overview?.stats?.totalSessions ?? 0}
        totalParticipants={overview?.stats?.totalParticipants ?? 0}
        completionRate={completionRate}
      />

      <RecentActivitySection sessions={stats?.recentActivity ?? []} />
    </PageShell>
  );
}
