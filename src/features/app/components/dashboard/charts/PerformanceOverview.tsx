/**
 * @fileoverview Performance overview with circular metrics — extracted from Dashboard.
 */

import { useTranslation } from 'react-i18next';
import { TrendingUp } from 'lucide-react';
import { ChartCard } from '../index';

interface Metric {
  name: string;
  value: number;
  max: number;
  fill: string;
}

interface PerformanceOverviewProps {
  stats: {
    totalSessions: number;
    totalParticipants: number;
    completionRate: number;
  };
}

export function PerformanceOverview({ stats }: PerformanceOverviewProps) {
  const { t } = useTranslation();

  const metrics: Metric[] = [
    { 
      name: t('dashboard.sessions'), 
      value: stats.totalSessions, 
      max: Math.max(stats.totalSessions, 1), 
      fill: 'hsl(var(--primary))' 
    },
    { 
      name: t('dashboard.participants'), 
      value: stats.totalParticipants, 
      max: Math.max(stats.totalParticipants, 1), 
      fill: 'hsl(var(--chart-3))' 
    },
    { 
      name: t('dashboard.completion'), 
      value: stats.completionRate, 
      max: 100, 
      fill: 'hsl(var(--chart-4))' 
    },
  ];

  return (
    <ChartCard title={t('dashboard.performanceOverview')} subtitle={t('dashboard.keyMetrics')}>
      <div className="flex items-center justify-around py-4">
        {metrics.map(metric => {
          const pct = metric.max > 0 ? Math.min((metric.value / metric.max) * 100, 100) : 0;
          return (
            <div key={metric.name} className="flex flex-col items-center gap-2">
              <div className="relative">
                <svg width="88" height="88" viewBox="0 0 88 88">
                  <circle 
                    cx="44" 
                    cy="44" 
                    r="36" 
                    fill="none" 
                    stroke="hsl(var(--muted))" 
                    strokeWidth="6" 
                  />
                  <circle 
                    cx="44" 
                    cy="44" 
                    r="36" 
                    fill="none" 
                    stroke={metric.fill} 
                    strokeWidth="6"
                    strokeLinecap="round" 
                    strokeDasharray={`${(pct / 100) * 226.19} 226.19`}
                    transform="rotate(-90 44 44)" 
                    className="transition-all duration-1000" 
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-[18px] font-extrabold text-foreground">
                    {metric.name === t('dashboard.completion') ? `${metric.value}%` : metric.value}
                  </span>
                </div>
              </div>
              <span className="text-[11px] text-muted-foreground font-semibold">{metric.name}</span>
            </div>
          );
        })}
      </div>
      {stats.completionRate > 0 && (
        <div className="flex items-center justify-center gap-1.5 pt-2 border-t border-border mt-2">
          <TrendingUp className="h-3.5 w-3.5 text-success" />
          <span className="text-[11px] font-medium text-success">
            {t('dashboard.sessionCompletionRate', { rate: stats.completionRate })}
          </span>
        </div>
      )}
    </ChartCard>
  );
}