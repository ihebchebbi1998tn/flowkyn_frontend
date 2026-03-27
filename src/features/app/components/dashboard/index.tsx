/**
 * Dashboard shared components — Discord × Linear design.
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

/* ─── Shared tooltip style for all Recharts charts ─── */
export const chartTooltipStyle: React.CSSProperties = {
  background: 'hsl(var(--popover))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '8px',
  color: 'hsl(var(--foreground))',
  fontSize: '12px',
  boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
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
    <div className={cn('space-y-5 w-full animate-fade-in', className)}>
      {children}
    </div>
  );
}

/* ─── Page header — bold, branded ─── */
interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between pb-2">
      <div className="min-w-0">
        <h1 className="text-lg font-bold text-foreground tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          {title}
        </h1>
        {subtitle && (
          <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1.5">
            <span className="inline-block h-1 w-1 rounded-full bg-primary/50" />
            {subtitle}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0 mt-2 sm:mt-0">{actions}</div>}
    </div>
  );
}

/* ─── Stat card — Discord-style with neon accent ─── */
interface DashStatProps {
  label: string;
  value: string | number;
  icon: React.ComponentType<any>;
  change?: string;
  trend?: number;
  gradient?: 'primary' | 'success' | 'warning' | 'info';
}

const iconColorMap = {
  primary: 'bg-primary/10 text-primary',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  info: 'bg-info/10 text-info',
};

const accentLineMap = {
  primary: 'bg-primary',
  success: 'bg-success',
  warning: 'bg-warning',
  info: 'bg-info',
};

const glowMap = {
  primary: 'group-hover:shadow-[0_0_12px_hsl(265_87%_58%_/_0.1)]',
  success: 'group-hover:shadow-[0_0_12px_hsl(160_84%_39%_/_0.1)]',
  warning: 'group-hover:shadow-[0_0_12px_hsl(38_92%_50%_/_0.1)]',
  info: 'group-hover:shadow-[0_0_12px_hsl(217_91%_60%_/_0.1)]',
};

export function DashStat({ label, value, icon: Icon, change, trend, gradient = 'primary' }: DashStatProps) {
  return (
    <div className={cn(
      "group rounded-xl border border-border/80 bg-card p-4 transition-all duration-200 hover:border-primary/20 relative overflow-hidden cursor-default",
      glowMap[gradient]
    )}>
      {/* Neon accent line — thinner, fades on edges */}
      <div className={cn("absolute top-0 left-2 right-2 h-[1.5px] rounded-full opacity-40 transition-opacity group-hover:opacity-70", accentLineMap[gradient])} />
      
      <div className="flex items-center justify-between mb-3">
        <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105", iconColorMap[gradient])}>
          <Icon className="h-4 w-4" strokeWidth={1.8} />
        </div>
        {trend !== undefined && (
          <div className={cn(
            'flex items-center gap-0.5 text-[10px] font-semibold rounded-full px-2 py-0.5',
            trend >= 0 ? 'text-success bg-success/8' : 'text-destructive bg-destructive/8'
          )}>
            {trend >= 0 ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
            {trend >= 0 ? '+' : ''}{trend}%
          </div>
        )}
      </div>
      <p className="text-[22px] font-bold text-foreground tracking-tight leading-none mb-1.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{value}</p>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">{label}</p>
      {change && <p className="text-[10px] text-muted-foreground/70 mt-1.5">{change}</p>}
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
    <div className={cn('rounded-xl border border-border/80 bg-card overflow-hidden', className)}>
      <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between px-4 py-3 border-b border-border/40">
        <div>
          <h3 className="text-[13px] font-semibold text-foreground">{title}</h3>
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
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      {gradient && <div className={cn("h-[2px] w-full bg-gradient-to-r", accentBarMap[gradient])} />}
      <div className="px-4 py-2.5 border-b border-border/50">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

/* ─── Empty state — engaging, branded ─── */
interface EmptyStateProps {
  icon: React.ComponentType<{ className?: string }>;
  message: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon: Icon, message, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center rounded-lg border border-dashed border-border bg-muted/20">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/8 border border-primary/10 mb-4 mx-auto">
        <Icon className="h-5 w-5 text-primary/60" />
      </div>
      <p className="text-sm font-semibold text-foreground mb-0.5">{message}</p>
      {description && <p className="text-xs text-muted-foreground max-w-sm mx-auto">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export * from './charts';
