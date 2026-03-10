/**
 * Admin Settings — platform configuration and system health.
 */

import { useEffect, useState } from 'react';
import { Shield, Server, Database, Globe } from 'lucide-react';
import { InfoCard } from '@/components/cards/StatCard';
import { PageHeader } from '@/components/common/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { adminApi } from '@/api/admin';

export default function AdminSettings() {
  const [health, setHealth] = useState<{ status: string; database: string; timestamp: string } | null>(null);
  const [healthLoading, setHealthLoading] = useState(true);

  useEffect(() => {
    adminApi.getSystemHealth()
      .then(setHealth)
      .catch(() => setHealth(null))
      .finally(() => setHealthLoading(false));
  }, []);

  const isHealthy = health?.status === 'ok' || health?.status === 'healthy';
  const isDbConnected = health?.database === 'connected' || health?.database === 'ok';

  return (
    <div className="space-y-6">
      <PageHeader title="Admin Settings" subtitle="Platform configuration and system info" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <InfoCard title="System Status">
          <div className="space-y-4">
            {healthLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-4 w-4" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                ))}
              </div>
            ) : (
              [
                { label: 'API Server', status: isHealthy ? 'Healthy' : 'Unreachable', ok: isHealthy, icon: Server },
                { label: 'Database', status: isDbConnected ? 'Connected' : 'Disconnected', ok: isDbConnected, icon: Database },
                { label: 'CDN', status: 'Active', ok: true, icon: Globe },
                { label: 'Auth Service', status: isHealthy ? 'Healthy' : 'Unknown', ok: isHealthy, icon: Shield },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <item.icon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-body-sm text-foreground">{item.label}</span>
                  </div>
                  <Badge variant="outline" className={item.ok ? 'bg-success/10 text-success border-success/20' : 'bg-destructive/10 text-destructive border-destructive/20'}>
                    {item.status}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </InfoCard>

        <InfoCard title="Platform Info">
          <div className="space-y-3">
            {[
              { label: 'Version', value: '1.2.0' },
              { label: 'Environment', value: 'Production' },
              { label: 'API Endpoint', value: 'api.flowkyn.com' },
              { label: 'Region', value: 'EU-West (Frankfurt)' },
              { label: 'Node.js', value: 'v20.x LTS' },
              { label: 'Database', value: 'Neon PostgreSQL 16' },
              { label: 'Last Health Check', value: health?.timestamp ? new Date(health.timestamp).toLocaleString() : '—' },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between text-body-sm">
                <span className="text-muted-foreground">{item.label}</span>
                <span className="font-medium text-foreground">{item.value}</span>
              </div>
            ))}
          </div>
        </InfoCard>
      </div>
    </div>
  );
}
