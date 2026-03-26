/**
 * Dashboard shared components — premium SaaS design.
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

/* ─── Shared tooltip style for all Recharts charts ─── */
export const chartTooltipStyle: React.CSSProperties = {
  background: 'hsl(var(--popover))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '10px',
  color: 'hsl(var(--foreground))',
  fontSize: '12px',
  boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
  padding: '8px 12px',
};

/* ─── Shared chart axis props ─── */
export const chartAxisProps = {
  stroke: 'hsl(var(--muted-foreground))',
  fontSize: 11,
  tickLine: false as const,
  axisLine: false as const,
};

export const chartGridProps = {
  strokeDasharray: '3 3',
  stroke: 'hsl(var(--border))',
  vertical: false as const,
};

/* ─── Page shell ─── */
export function PageShell({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('space-y-4 w-full animate-fade-in', className)}>
      {children}
    </div>
  );
}

/* ─── Page header ─── */
interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between pb-2">
      <div className="min-w-0">
        <h1 className="text-xl font-bold text-foreground tracking-tight">{title}</h1>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0 mt-2 sm:mt-0">{actions}</div>}
    </div>
  );
}

/* ─── Stat card — compact premium ─── */
interface DashStatProps {
  label: string;
  value: string | number;
  icon: React.ComponentType<any>;
  change?: string;
  trend?: number;
  gradient?: 'primary' | 'success' | 'warning' | 'info';
}

const iconColorMap = {
  primary: 'bg-primary/8 text-primary',
  success: 'bg-success/8 text-success',
  warning: 'bg-warning/8 text-warning',
  info: 'bg-info/8 text-info',
};

const accentLineMap = {
  primary: 'bg-primary',
  success: 'bg-success',
  warning: 'bg-warning',
  info: 'bg-info',
};

export function DashStat({ label, value, icon: Icon, change, trend, gradient = 'primary' }: DashStatProps) {
  return (
    <div className="group rounded-xl border border-border bg-card p-3.5 transition-all duration-200 hover:border-primary/15 hover:shadow-card-hover relative overflow-hidden">
      {/* Subtle accent line */}
      <div className={cn("absolute top-0 left-0 right-0 h-[2px] opacity-40", accentLineMap[gradient])} />
      
      <div className="flex items-center justify-between mb-2">
        <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", iconColorMap[gradient])}>
          <Icon className="h-4 w-4" strokeWidth={1.8} />
        </div>
        {trend !== undefined && (
          <div className={cn(
            'flex items-center gap-0.5 text-[10px] font-semibold rounded-md px-1.5 py-0.5',
            trend >= 0 ? 'text-success bg-success/8' : 'text-destructive bg-destructive/8'
          )}>
            {trend >= 0 ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
            {trend >= 0 ? '+' : ''}{trend}%
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-foreground tracking-tight leading-none mb-0.5">{value}</p>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">{label}</p>
      {change && <p className="text-[10px] text-muted-foreground mt-1">{change}</p>}
    </div>
  );
}

/* ─── Chart card ─── */
interface ChartCardProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}

export function ChartCard({ title, subtitle, action, children, className, noPadding }: ChartCardProps) {
  return (
    <div className={cn('rounded-xl border border-border bg-card overflow-hidden', className)}>
      <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between px-4 py-3 border-b border-border/60">
        <div>
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          {subtitle && <p className="text-[10px] text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
        {action && <div className="flex items-center justify-end shrink-0">{action}</div>}
      </div>
      <div className={noPadding ? '' : 'p-4'}>{children}</div>
    </div>
  );
}

/* ─── Ranked list item ─── */
interface RankedItemProps {
  rank: number;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  right: React.ReactNode;
}

export function RankedItem({ rank, icon, title, subtitle, right }: RankedItemProps) {
  const medalColors = ['text-warning', 'text-muted-foreground', 'text-warning/60'];
  return (
    <div className="flex items-center gap-2.5 p-2 -mx-2 rounded-lg hover:bg-muted/40 transition-colors">
      <span className={cn("text-[11px] font-bold w-5 text-center shrink-0", rank <= 3 ? medalColors[rank - 1] : 'text-muted-foreground/30')}>
        {rank <= 3 ? ['🥇', '🥈', '🥉'][rank - 1] : rank}
      </span>
      <div className="h-7 w-7 rounded-lg bg-primary/8 flex items-center justify-center shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-medium text-foreground truncate">{title}</p>
        <p className="text-[10px] text-muted-foreground">{subtitle}</p>
      </div>
      <div className="text-right shrink-0">{right}</div>
    </div>
  );
}

/* ─── Info card ─── */
interface InfoCardProps {
  title: string;
  gradient?: 'primary' | 'success' | 'warning' | 'info';
  children: React.ReactNode;
}

const accentBarMap = {
  primary: 'from-primary to-primary/40',
  success: 'from-success to-success/40',
  warning: 'from-warning to-warning/40',
  info: 'from-info to-info/40',
};

export function InfoCard({ title, gradient, children }: InfoCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {gradient && <div className={cn("h-[2px] w-full bg-gradient-to-r", accentBarMap[gradient])} />}
      <div className="px-4 py-2.5 border-b border-border/60">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

/* ─── Empty state ─── */
interface EmptyStateProps {
  icon: React.ComponentType<{ className?: string }>;
  message: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon: Icon, message, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center rounded-xl border border-dashed border-border bg-muted/20">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-muted border border-border mb-4 mx-auto">
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>
      <p className="text-sm font-semibold text-foreground mb-0.5">{message}</p>
      {description && <p className="text-xs text-muted-foreground max-w-sm mx-auto">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export * from './charts';
