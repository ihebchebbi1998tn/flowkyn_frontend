import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { chartTooltipStyle, chartAxisProps, chartGridProps } from '@/features/app/components/dashboard';
import { Section, ShowcaseGrid } from './Primitives';

const lineData = [
  { month: 'Jan', sessions: 12, completed: 10 },
  { month: 'Feb', sessions: 19, completed: 15 },
  { month: 'Mar', sessions: 25, completed: 22 },
  { month: 'Apr', sessions: 18, completed: 16 },
  { month: 'May', sessions: 32, completed: 28 },
  { month: 'Jun', sessions: 27, completed: 24 },
];

const barData = [
  { name: 'Icebreaker', value: 45 },
  { name: 'Connection', value: 38 },
  { name: 'Wellness', value: 22 },
  { name: 'Competition', value: 31 },
];

const pieData = [
  { name: 'Icebreaker', value: 35, fill: 'hsl(var(--primary))' },
  { name: 'Connection', value: 25, fill: 'hsl(var(--chart-2))' },
  { name: 'Wellness', value: 20, fill: 'hsl(var(--chart-3))' },
  { name: 'Competition', value: 20, fill: 'hsl(var(--chart-4))' },
];

export function ChartsSection() {
  return (
    <Section id="charts" title="Charts & Graphs" description="Recharts-based visualizations using design system tokens.">
      <ShowcaseGrid label="Chart Types" cols={2}>
        <div className="rounded-lg border border-border bg-card p-5">
          <p className="text-card-title font-semibold text-foreground mb-4">Area Chart</p>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={lineData}>
              <defs>
                <linearGradient id="tmplGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid {...chartGridProps} />
              <XAxis dataKey="month" {...chartAxisProps} dy={8} />
              <YAxis {...chartAxisProps} fontSize={10} width={30} />
              <Tooltip contentStyle={chartTooltipStyle} />
              <Area type="monotone" dataKey="sessions" stroke="hsl(var(--primary))" strokeWidth={2.5} fill="url(#tmplGrad)" dot={false}
                activeDot={{ r: 5, strokeWidth: 2, stroke: 'hsl(var(--card))', fill: 'hsl(var(--primary))' }} />
              <Area type="monotone" dataKey="completed" stroke="hsl(var(--chart-2))" strokeWidth={2} strokeDasharray="5 5" fill="none" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-lg border border-border bg-card p-5">
          <p className="text-card-title font-semibold text-foreground mb-4">Bar Chart</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={barData} barSize={24}>
              <CartesianGrid {...chartGridProps} />
              <XAxis dataKey="name" {...chartAxisProps} dy={8} />
              <YAxis {...chartAxisProps} fontSize={10} width={28} />
              <Tooltip contentStyle={chartTooltipStyle} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]} fill="hsl(var(--primary))" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-lg border border-border bg-card p-5">
          <p className="text-card-title font-semibold text-foreground mb-4">Pie / Donut Chart</p>
          <div className="flex items-center gap-6">
            <ResponsiveContainer width={160} height={160}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={70} innerRadius={45} paddingAngle={3} dataKey="value" strokeWidth={0}>
                  {pieData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                </Pie>
                <Tooltip contentStyle={chartTooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2">
              {pieData.map(item => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: item.fill }} />
                  <span className="text-body-sm text-foreground">{item.name}</span>
                  <span className="text-label text-muted-foreground ml-auto">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-5">
          <p className="text-card-title font-semibold text-foreground mb-4">Horizontal Bar</p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={barData} layout="vertical" barSize={16}>
              <CartesianGrid {...chartGridProps} horizontal={false} vertical />
              <XAxis type="number" {...chartAxisProps} fontSize={10} />
              <YAxis dataKey="name" type="category" {...chartAxisProps} width={80} />
              <Tooltip contentStyle={chartTooltipStyle} />
              <Bar dataKey="value" radius={[0, 6, 6, 0]} fill="hsl(var(--primary))" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ShowcaseGrid>
    </Section>
  );
}
