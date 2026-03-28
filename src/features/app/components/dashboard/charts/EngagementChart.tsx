import { useTranslation } from 'react-i18next';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartCard, chartTooltipStyle, chartAxisProps, chartGridProps } from '../index';
import { Button } from '@/components/ui/button';
import { ArrowUpRight } from 'lucide-react';

interface EngagementChartProps {
  data: Array<{ month: string; sessions: number; completed: number }>;
  onViewDetails?: () => void;
  isDemo?: boolean;
}

export function EngagementChart({ data, onViewDetails, isDemo }: EngagementChartProps) {
  const { t } = useTranslation();

  const demoOverlay = isDemo && (
    <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
      <div className="bg-card/80 backdrop-blur-sm border border-border/60 rounded-lg px-4 py-2.5 shadow-lg pointer-events-auto">
        <p className="text-xs font-semibold text-foreground">{t('dashboard.sampleData', 'Sample preview')}</p>
        <p className="text-[10px] text-muted-foreground">{t('dashboard.sampleDataDesc', 'Run activities to see real data')}</p>
      </div>
    </div>
  );

  return (
    <ChartCard
      title={t('dashboard.teamEngagement')}
      subtitle={t('dashboard.lastSixMonths')}
      className="lg:col-span-3"
      action={
        onViewDetails && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-[11px] text-muted-foreground gap-1 hover:text-primary"
            onClick={onViewDetails}
          >
            {t('dashboard.details')} <ArrowUpRight className="h-3 w-3" />
          </Button>
        )
      }
    >
      <div className="relative">
        {demoOverlay}
        <div className={isDemo ? 'opacity-40' : ''}>
      <ResponsiveContainer width="100%" height={210}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="engGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.18} />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="partGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--chart-3))" stopOpacity={0.12} />
              <stop offset="100%" stopColor="hsl(var(--chart-3))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid {...chartGridProps} />
          <XAxis dataKey="month" {...chartAxisProps} dy={8} />
          <YAxis {...chartAxisProps} fontSize={10} width={30} />
          <Tooltip contentStyle={chartTooltipStyle} />
          <Area
            type="monotone"
            dataKey="sessions"
            stroke="hsl(var(--primary))"
            strokeWidth={2.5}
            fill="url(#engGrad)"
            dot={false}
            name={t('dashboard.started')}
            activeDot={{ r: 5, strokeWidth: 2, stroke: 'hsl(var(--card))', fill: 'hsl(var(--primary))' }}
          />
          <Area
            type="monotone"
            dataKey="completed"
            stroke="hsl(var(--chart-3))"
            strokeWidth={2}
            strokeDasharray="5 5"
            fill="url(#partGrad)"
            dot={false}
            name={t('dashboard.completed')}
            activeDot={{ r: 4, strokeWidth: 2, stroke: 'hsl(var(--card))', fill: 'hsl(var(--chart-3))' }}
          />
        </AreaChart>
      </ResponsiveContainer>
        </div>
      </div>
      {/* Legend */}
      <div className="flex items-center gap-5 mt-3 px-1">
        <div className="flex items-center gap-2">
          <div className="h-[3px] w-5 rounded-full bg-primary" />
          <span className="text-[10px] text-muted-foreground font-medium">{t('dashboard.started')}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-[3px] w-5 rounded-full border-t-2 border-dashed border-[hsl(var(--chart-3))]" />
          <span className="text-[10px] text-muted-foreground font-medium">{t('dashboard.completed')}</span>
        </div>
      </div>
    </ChartCard>
  );
}
