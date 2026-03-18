import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { TrendingUp } from 'lucide-react';
import { ChartCard } from '../index';

interface PerformanceSectionProps {
  totalSessions: number;
  totalParticipants: number;
  completionRate: number;
  delay?: number;
}

export function PerformanceSection({ totalSessions, totalParticipants, completionRate, delay = 0.65 }: PerformanceSectionProps) {
  const { t } = useTranslation();

  const metrics = [
    { name: t('dashboard.sessions'), value: totalSessions, max: Math.max(totalSessions, 1), fill: 'hsl(var(--primary))' },
    { name: t('dashboard.participants'), value: totalParticipants, max: Math.max(totalParticipants, 1), fill: 'hsl(var(--chart-3))' },
    { name: t('dashboard.completion'), value: completionRate, max: 100, fill: 'hsl(var(--chart-4))' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      <ChartCard title={t('dashboard.performanceOverview')} subtitle={t('dashboard.keyMetrics')}>
        <div className="flex flex-col sm:flex-row items-center justify-around gap-2.5 sm:gap-1.5 py-2">
          {metrics.map(metric => {
            const pct = metric.max > 0 ? Math.min((metric.value / metric.max) * 100, 100) : 0;
            return (
              <div key={metric.name} className="flex flex-col items-center gap-1.5">
                <div className="relative">
                  <svg width="80" height="80" viewBox="0 0 88 88" className="sm:w-[88px] sm:h-[88px]">
                    <circle cx="44" cy="44" r="36" fill="none" stroke="hsl(var(--muted))" strokeWidth="6" />
                    <circle cx="44" cy="44" r="36" fill="none" stroke={metric.fill} strokeWidth="6"
                      strokeLinecap="round" strokeDasharray={`${(pct / 100) * 226.19} 226.19`}
                      transform="rotate(-90 44 44)" className="transition-all duration-1000" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-[18px] font-extrabold text-foreground">
                      {metric.name === t('dashboard.completion') ? `${metric.value}%` : metric.value}
                    </span>
                  </div>
                </div>
                <span className="text-[11px] text-muted-foreground font-semibold text-center">{metric.name}</span>
              </div>
            );
          })}
        </div>
        {completionRate > 0 && (
          <div className="flex items-center justify-center gap-1.5 pt-2 border-t border-border mt-2">
            <TrendingUp className="h-3.5 w-3.5 text-success" />
            <span className="text-[11px] font-medium text-success">{t('dashboard.sessionCompletionRate', { rate: completionRate })}</span>
          </div>
        )}
      </ChartCard>
    </motion.div>
  );
}
