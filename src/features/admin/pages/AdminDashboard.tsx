/**
 * Admin Dashboard — displays platform-wide stats and recent activity.
 */

import { useEffect, useState } from 'react';
import { Users, Building2, Gamepad2, Activity, TrendingUp, UserPlus } from 'lucide-react';
import { StatCard, InfoCard } from '@/components/cards/StatCard';
import { PageHeader } from '@/components/common/PageHeader';
import { LogoLoader } from '@/components/loading/LogoLoader';
import { adminApi, type AdminStats, type AuditLogEntry } from '@/api/admin';

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recentLogs, setRecentLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const [statsData, logsData] = await Promise.all([
          adminApi.getStats(),
          adminApi.listAuditLogs(1, 5),
        ]);
        setStats(statsData);
        setRecentLogs(logsData.data);
      } catch (err: any) {
        setError(err?.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Admin Dashboard" subtitle="Loading platform data..." />
        <div className="py-20 flex justify-center"><LogoLoader size="md" /></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="Admin Dashboard" subtitle={error} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Admin Dashboard" subtitle="Flowkyn platform overview" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Users" value={(stats?.totalUsers ?? 0).toLocaleString()} icon={<Users className="h-4 w-4" />} gradient="primary" />
        <StatCard title="Organizations" value={(stats?.totalOrganizations ?? 0).toLocaleString()} icon={<Building2 className="h-4 w-4" />} gradient="info" />
        <StatCard title="Game Sessions" value={(stats?.totalGameSessions ?? 0).toLocaleString()} icon={<Gamepad2 className="h-4 w-4" />} gradient="success" />
        <StatCard title="Active Users (30d)" value={(stats?.activeUsers30d ?? 0).toLocaleString()} icon={<Activity className="h-4 w-4" />} gradient="warning" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Total Events" value={(stats?.totalEvents ?? 0).toLocaleString()} icon={<TrendingUp className="h-4 w-4" />} />
        <StatCard title="New Users Today" value={stats?.newUsersToday ?? 0} icon={<UserPlus className="h-4 w-4" />} />
        <StatCard title="New Orgs Today" value={stats?.newOrgsToday ?? 0} icon={<Building2 className="h-4 w-4" />} />
      </div>

      <InfoCard title="Recent Platform Activity">
        <div className="space-y-0">
          {recentLogs.length === 0 ? (
            <p className="py-6 text-center text-body-sm text-muted-foreground">No recent activity</p>
          ) : (
            recentLogs.map((log) => (
              <div key={log.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                <div className="min-w-0">
                  <p className="text-body-sm font-medium text-foreground">{log.action}</p>
                  <p className="text-label text-muted-foreground truncate">
                    {log.user_name || log.user_email || 'System'}
                    {log.organization_name ? ` — ${log.organization_name}` : ''}
                  </p>
                </div>
                <span className="text-label text-muted-foreground shrink-0 ml-4">
                  {new Date(log.created_at).toLocaleString()}
                </span>
              </div>
            ))
          )}
        </div>
      </InfoCard>
    </div>
  );
}
