import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, Users, Zap, Activity, ArrowUpRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Section, ShowcaseGrid } from './Primitives';

function AnimatedCounter({ target, duration = 1.5 }: { target: number; duration?: number }) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let frame: number;
    const start = performance.now();
    const tick = (now: number) => {
      const elapsed = (now - start) / (duration * 1000);
      if (elapsed >= 1) { setValue(target); return; }
      setValue(Math.round(target * elapsed));
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);
  return <span className="tabular-nums">{value.toLocaleString()}</span>;
}

function ProgressRing({ value, max = 100, size = 80, stroke = 6, color = 'hsl(var(--primary))' }: { value: number; max?: number; size?: number; stroke?: number; color?: string }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(value / max, 1);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth={stroke} />
      <motion.circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={stroke}
        strokeLinecap="round" transform={`rotate(-90 ${size / 2} ${size / 2})`}
        initial={{ strokeDasharray: `0 ${circumference}` }}
        animate={{ strokeDasharray: `${pct * circumference} ${circumference}` }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }} />
    </svg>
  );
}

function Sparkline({ data, color = 'hsl(var(--primary))', height = 32, width = 100 }: { data: number[]; color?: string; height?: number; width?: number }) {
  if (!data.length) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * width},${height - ((v - min) / range) * (height - 4) - 2}`).join(' ');
  return (
    <svg width={width} height={height} className="shrink-0">
      <polyline fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={points} />
    </svg>
  );
}

function HeatmapRow({ data, label }: { data: number[]; label: string }) {
  const max = Math.max(...data);
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-label text-muted-foreground w-8 shrink-0">{label}</span>
      {data.map((v, i) => {
        const opacity = max > 0 ? 0.1 + (v / max) * 0.9 : 0.1;
        return <div key={i} className="h-5 w-5 rounded-sm" style={{ backgroundColor: `hsl(var(--primary) / ${opacity})` }} title={`${v}`} />;
      })}
    </div>
  );
}

export function DataWidgetsSection() {
  const sparkData1 = [12, 15, 11, 18, 22, 19, 25, 28, 24, 30, 27, 35];
  const sparkData2 = [28, 25, 30, 22, 18, 20, 15, 12, 10, 8, 11, 9];
  const sparkData3 = [5, 8, 6, 12, 15, 14, 18, 22, 20, 25, 23, 28];

  const heatmapData = [
    { label: 'Mon', data: [2, 5, 8, 12, 15, 10, 3] },
    { label: 'Tue', data: [1, 3, 6, 14, 18, 12, 5] },
    { label: 'Wed', data: [4, 7, 10, 16, 20, 14, 8] },
    { label: 'Thu', data: [3, 6, 9, 11, 17, 13, 6] },
    { label: 'Fri', data: [5, 8, 12, 15, 22, 16, 9] },
  ];

  return (
    <Section id="data-widgets" title="Data Widgets" description="Animated counters, progress rings, sparklines, heatmaps, and KPI cards.">

      {/* Animated KPI cards */}
      <ShowcaseGrid label="Animated KPI Cards" cols={4}>
        {[
          { label: 'Total Users', value: 12847, trend: 12.5, icon: Users, sparkData: sparkData1, color: 'primary' },
          { label: 'Sessions', value: 3294, trend: -2.3, icon: Activity, sparkData: sparkData2, color: 'info' },
          { label: 'Revenue', value: 48520, trend: 18.7, icon: Zap, sparkData: sparkData3, color: 'success', prefix: '$' },
          { label: 'Engagement', value: 87, trend: 5.2, icon: TrendingUp, color: 'warning', suffix: '%', isRing: true },
        ].map(kpi => (
          <motion.div key={kpi.label} whileHover={{ y: -2 }} transition={{ type: 'spring', stiffness: 300 }}
            className="rounded-xl border border-border bg-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center',
                `bg-${kpi.color}/10 text-${kpi.color}`)} style={{ backgroundColor: `hsl(var(--${kpi.color}) / 0.1)`, color: `hsl(var(--${kpi.color}))` }}>
                <kpi.icon className="h-4 w-4" />
              </div>
              <div className={cn('flex items-center gap-0.5 text-label font-semibold', kpi.trend >= 0 ? 'text-success' : 'text-destructive')}>
                {kpi.trend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {kpi.trend >= 0 ? '+' : ''}{kpi.trend}%
              </div>
            </div>

            {kpi.isRing ? (
              <div className="flex items-center gap-3">
                <ProgressRing value={kpi.value} size={52} stroke={5} color={`hsl(var(--${kpi.color}))`} />
                <div>
                  <p className="text-xl font-bold text-foreground"><AnimatedCounter target={kpi.value} />{kpi.suffix}</p>
                  <p className="text-label text-muted-foreground">{kpi.label}</p>
                </div>
              </div>
            ) : (
              <>
                <div>
                  <p className="text-xl font-bold text-foreground">{kpi.prefix}<AnimatedCounter target={kpi.value} /></p>
                  <p className="text-label text-muted-foreground">{kpi.label}</p>
                </div>
                {kpi.sparkData && <Sparkline data={kpi.sparkData} color={`hsl(var(--${kpi.color}))`} width={140} height={28} />}
              </>
            )}
          </motion.div>
        ))}
      </ShowcaseGrid>

      {/* Progress rings */}
      <div className="rounded-lg border border-border bg-card p-5">
        <p className="text-label uppercase text-muted-foreground mb-4">Progress Rings</p>
        <div className="flex flex-wrap items-center justify-around gap-6">
          {[
            { label: 'Completion', value: 87, color: 'hsl(var(--primary))' },
            { label: 'Engagement', value: 64, color: 'hsl(var(--success))' },
            { label: 'Retention', value: 42, color: 'hsl(var(--warning))' },
            { label: 'Churn Risk', value: 18, color: 'hsl(var(--destructive))' },
          ].map(ring => (
            <div key={ring.label} className="flex flex-col items-center gap-2">
              <div className="relative">
                <ProgressRing value={ring.value} size={72} stroke={5} color={ring.color} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-body-sm font-bold text-foreground">{ring.value}%</span>
                </div>
              </div>
              <span className="text-label text-muted-foreground">{ring.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Sparklines */}
      <ShowcaseGrid label="Sparkline Variants" cols={3}>
        {[
          { label: 'Users', data: sparkData1, color: 'hsl(var(--primary))', value: '12.8K', trend: '+12%' },
          { label: 'Bounce Rate', data: sparkData2, color: 'hsl(var(--destructive))', value: '34%', trend: '-8%' },
          { label: 'Avg Duration', data: sparkData3, color: 'hsl(var(--success))', value: '4m 32s', trend: '+5%' },
        ].map(item => (
          <div key={item.label} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card">
            <Sparkline data={item.data} color={item.color} width={80} height={28} />
            <div className="flex-1 min-w-0">
              <p className="text-body-sm font-semibold text-foreground">{item.value}</p>
              <p className="text-label text-muted-foreground">{item.label}</p>
            </div>
            <Badge variant="outline" className={cn('text-label', item.trend.startsWith('+') ? 'text-success border-success/20' : 'text-destructive border-destructive/20')}>
              {item.trend}
            </Badge>
          </div>
        ))}
      </ShowcaseGrid>

      {/* Heatmap */}
      <div className="rounded-lg border border-border bg-card p-5">
        <p className="text-label uppercase text-muted-foreground mb-4">Activity Heatmap</p>
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-label text-muted-foreground w-8" />
            {['9a', '10a', '11a', '12p', '1p', '2p', '3p'].map(h => (
              <span key={h} className="text-label-xs text-muted-foreground w-5 text-center">{h}</span>
            ))}
          </div>
          {heatmapData.map(row => <HeatmapRow key={row.label} {...row} />)}
        </div>
        <div className="flex items-center gap-2 mt-3">
          <span className="text-label-xs text-muted-foreground">Less</span>
          {[0.1, 0.3, 0.5, 0.7, 0.9].map(o => (
            <div key={o} className="h-3 w-3 rounded-sm" style={{ backgroundColor: `hsl(var(--primary) / ${o})` }} />
          ))}
          <span className="text-label-xs text-muted-foreground">More</span>
        </div>
      </div>
    </Section>
  );
}
