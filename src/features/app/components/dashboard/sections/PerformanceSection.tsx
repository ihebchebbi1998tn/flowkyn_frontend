import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { TrendingUp, Sparkles } from 'lucide-react';
import { ChartCard } from '../index';
import { cn } from '@/lib/utils';

interface PerformanceSectionProps {
  totalSessions: number;
  totalParticipants: number;
  completionRate: number;
  delay?: number;
}

export function PerformanceSection({ totalSessions, totalParticipants, completionRate, delay = 0.65 }: PerformanceSectionProps) {
  const { t } = useTranslation();

  const metrics = [
    { name: t('dashboard.sessions'), value: totalSessions, max: Math.max(totalSessions, 1), fill: 'hsl(var(--primary))', fillBg: 'hsl(var(--primary) / 0.1)' },
    { name: t('dashboard.participants'), value: totalParticipants, max: Math.max(totalParticipants, 1), fill: 'hsl(var(--chart-3))', fillBg: 'hsl(var(--chart-3) / 0.1)' },
    { name: t('dashboard.completion'), value: completionRate, max: 100, fill: 'hsl(var(--chart-4))', fillBg: 'hsl(var(--chart-4) / 0.1)' },
  ];

  const getRating = () => {
    if (completionRate >= 80) return { label: t('analyticsPage.excellent', 'Excellent'), icon: Sparkles, class: 'text-success' };
    if (completionRate >= 60) return { label: t('analyticsPage.good', 'Good'), icon: TrendingUp, class: 'text-primary' };
    return { label: t('analyticsPage.improving', 'Getting better'), icon: TrendingUp, class: 'text-warning' };
  };

  const rating = getRating();

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      <ChartCard title={t('dashboard.performanceOverview')} subtitle={t('dashboard.keyMetrics')}>
        <div className="flex flex-col sm:flex-row items-center justify-around gap-6 sm:gap-4 py-3">
          {metrics.map((metric, i) => {
            const pct = metric.max > 0 ? Math.min((metric.value / metric.max) * 100, 100) : 0;
            const circumference = 2 * Math.PI * 38;
            const dashoffset = circumference - (pct / 100) * circumference;
            return (
              <motion.div
                key={metric.name}
                className="flex flex-col items-center gap-2"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: delay + 0.1 + i * 0.08 }}
              >
                <div className="relative">
                  <svg width="92" height="92" viewBox="0 0 92 92">
                    <circle cx="46" cy="46" r="38" fill="none" stroke="hsl(var(--muted))" strokeWidth="5" />
                    <circle
                      cx="46" cy="46" r="38" fill="none"
                      stroke={metric.fill}
                      strokeWidth="5"
                      strokeLinecap="round"
                      strokeDasharray={circumference}
                      strokeDashoffset={dashoffset}
                      transform="rotate(-90 46 46)"
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-[20px] font-bold text-foreground tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      {metric.name === t('dashboard.completion') ? `${metric.value}%` : metric.value}
                    </span>
                  </div>
                </div>
                <span className="text-[11px] text-muted-foreground font-medium text-center">{metric.name}</span>
              </motion.div>
            );
          })}
        </div>
        {completionRate > 0 && (
          <div className="flex items-center justify-center gap-1.5 pt-3 border-t border-border/50 mt-2">
            <rating.icon className={cn('h-3.5 w-3.5', rating.class)} />
            <span className={cn('text-[11px] font-medium', rating.class)}>
              {rating.label} — {t('dashboard.sessionCompletionRate', { rate: completionRate })}
            </span>
          </div>
        )}
      </ChartCard>
    </motion.div>
  );
}
