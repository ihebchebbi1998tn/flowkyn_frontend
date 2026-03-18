import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar, Cell, PieChart, Pie } from 'recharts';
import { ChartCard, chartTooltipStyle, chartAxisProps, chartGridProps } from '../index';

interface ActivityItem {
  name: string;
  value: number;
  fill: string;
}

interface ActivityBreakdownSectionProps {
  data: ActivityItem[];
  delay?: number;
}

export function ActivityBreakdownSection({ data, delay = 0.5 }: ActivityBreakdownSectionProps) {
  const { t } = useTranslation();
  const totalSessions = data.reduce((sum, d) => sum + d.value, 0);

  if (data.length === 0) return null;

  return (
    <motion.div
      className="grid gap-4 lg:grid-cols-2"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      <ChartCard title={t('dashboard.activityBreakdown')} subtitle={t('dashboard.sessionsByGameType')}>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data} barSize={20}>
            <CartesianGrid {...chartGridProps} />
            <XAxis dataKey="name" {...chartAxisProps} dy={8} />
            <YAxis {...chartAxisProps} fontSize={10} width={28} />
            <Tooltip contentStyle={chartTooltipStyle} />
            <Bar dataKey="value" radius={[6, 6, 0, 0]} name={t('dashboard.sessions')}>
              {data.map((e, i) => <Cell key={i} fill={e.fill} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title={t('dashboard.categoryDistribution')} subtitle={t('dashboard.byActivityCategory')}>
        <div className="flex items-center gap-8">
          <div className="relative shrink-0">
            <ResponsiveContainer width={180} height={180}>
              <PieChart>
                <Pie data={data} cx="50%" cy="50%" outerRadius={80} innerRadius={56} paddingAngle={3} dataKey="value" strokeWidth={0}>
                  {data.map((e, i) => <Cell key={i} fill={e.fill} />)}
                </Pie>
                <Tooltip contentStyle={chartTooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[24px] font-extrabold text-foreground">{totalSessions}</span>
              <span className="text-[10px] text-muted-foreground font-medium">{t('dashboard.sessions')}</span>
            </div>
          </div>
          <div className="flex-1 space-y-4">
            {data.map(item => {
              const pct = totalSessions > 0 ? Math.round((item.value / totalSessions) * 100) : 0;
              return (
                <div key={item.name}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2.5">
                      <div className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: item.fill }} />
                      <span className="text-[13px] text-foreground font-medium">{item.name}</span>
                    </div>
                    <span className="text-[13px] font-bold text-foreground">{pct}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700 ease-out" style={{ width: `${pct}%`, backgroundColor: item.fill }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </ChartCard>
    </motion.div>
  );
}
