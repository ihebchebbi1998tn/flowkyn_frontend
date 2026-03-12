/**
 * @fileoverview Dashboard shared components — premium, Kahoot-inspired design.
 * 
 * Provides reusable primitives for the dashboard and detail pages:
 * - PageShell: Content wrapper with max-width and fade animation
 * - PageHeader: Title + subtitle + actions bar
 * - DashStat: Stat card with icon, value, trend indicator
 * - ChartCard: Container for charts with header/action slots
 * - EmptyState: Zero-data placeholder with icon + message + CTA
 * - InfoCard: Simple bordered card for detail pages
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

/* ─── Shared tooltip style for all Recharts charts ─── */
export const chartTooltipStyle: React.CSSProperties = {
  background: 'hsl(var(--popover))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '12px',
  color: 'hsl(var(--foreground))',
  fontSize: '12px',
  boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
  padding: '10px 14px',
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
    <div
      className={cn(
        // Constrain width on large screens but let it breathe on tablets
        'space-y-5 w-full max-w-[1200px] animate-fade-in',
        // Center within the main layout while keeping nice padding on small devices
        'mx-auto',
        className,
      )}
    >
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
    <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {subtitle && <p className="text-body-sm text-muted-foreground mb-0.5">{subtitle}</p>}
        <h1 className="text-page-title text-foreground leading-none truncate">{title}</h1>
      </div>
      {actions && <div className="flex items-center gap-2.5 shrink-0 mt-3 sm:mt-0">{actions}</div>}
    </div>
  );
}

/* ─── Stat card — premium with subtle gradient accent ─── */
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

const accentBarMap = {
  primary: 'from-primary to-primary/60',
  success: 'from-success to-success/60',
  warning: 'from-warning to-warning/60',
  info: 'from-info to-info/60',
};

export function DashStat({ label, value, icon: Icon, change, trend, gradient = 'primary' }: DashStatProps) {
  return (
    <div className="group relative rounded-2xl border border-border bg-card/95 backdrop-blur-sm overflow-hidden transition-all duration-200 hover:border-primary/40 hover:shadow-lg hover:-translate-y-0.5">
      {/* Top accent bar */}
      <div className={cn("h-0.5 w-full bg-gradient-to-r opacity-50 group-hover:opacity-100 transition-opacity duration-200", accentBarMap[gradient])} />
      
      <div className="p-3.5 sm:p-5">
        <div className="flex items-center justify-between mb-2.5 sm:mb-3 gap-3">
          <div className={cn(
            "flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105",
            iconColorMap[gradient]
          )}>
            <Icon className="h-[18px] w-[18px]" strokeWidth={1.8} />
          </div>
          {trend !== undefined && (
            <div className={cn(
              'flex items-center gap-1 text-label rounded-full px-2 py-0.5',
              trend >= 0 ? 'text-success bg-success/10' : 'text-destructive bg-destructive/10'
            )}>
              {trend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {trend >= 0 ? '+' : ''}{trend}%
            </div>
          )}
        </div>
        <p className="text-[24px] sm:text-[28px] font-bold text-foreground tracking-tight leading-none mb-1">
          {value}
        </p>
        <p className="text-[11px] sm:text-label text-muted-foreground uppercase tracking-[0.16em]">
          {label}
        </p>
        {change && (
          <p className="text-label-xs text-muted-foreground/70 mt-1.5">{change}</p>
        )}
      </div>
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
    <div className={cn('rounded-2xl border border-border bg-card/95 backdrop-blur-sm overflow-hidden shadow-card', className)}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between px-4 sm:px-5 py-3.5 sm:py-4 border-b border-border/60">
        <div>
          <h3 className="text-card-title font-semibold text-foreground truncate">{title}</h3>
          {subtitle && <p className="text-label text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
        {action && <div className="flex items-center justify-end shrink-0">{action}</div>}
      </div>
      <div className={noPadding ? '' : 'p-4 sm:p-5'}>{children}</div>
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
    <div className="flex items-center gap-3 group p-2.5 -mx-2 rounded-xl hover:bg-muted/50 transition-colors">
      <span className={cn("text-caption font-bold w-5 text-center shrink-0", rank <= 3 ? medalColors[rank - 1] : 'text-muted-foreground/40')}>
        {rank <= 3 ? ['🥇', '🥈', '🥉'][rank - 1] : rank}
      </span>
      <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/15 transition-colors">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-body-sm font-medium text-foreground truncate">{title}</p>
        <p className="text-label-xs text-muted-foreground">{subtitle}</p>
      </div>
      <div className="text-right shrink-0">{right}</div>
    </div>
  );
}

/* ─── Info card (for detail pages) ─── */
interface InfoCardProps {
  title: string;
  gradient?: 'primary' | 'success' | 'warning' | 'info';
  children: React.ReactNode;
}

export function InfoCard({ title, gradient, children }: InfoCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden shadow-card">
      {gradient && <div className={cn("h-0.5 w-full bg-gradient-to-r", accentBarMap[gradient])} />}
      <div className="px-5 py-3.5 border-b border-border/60">
        <h3 className="text-card-title font-semibold text-foreground">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

/* ─── Empty state — premium with subtle background pattern ─── */
interface EmptyStateProps {
  icon: React.ComponentType<{ className?: string }>;
  message: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon: Icon, message, description, action }: EmptyStateProps) {
  return (
    <div className="relative flex flex-col items-center justify-center py-20 px-6 text-center rounded-xl border border-dashed border-border/80 bg-muted/20">
      {/* Subtle dot pattern */}
      <div className="absolute inset-0 opacity-[0.03] rounded-xl"
        style={{ backgroundImage: 'radial-gradient(circle, hsl(var(--foreground)) 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
      <div className="relative">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/80 border border-border/60 mb-5 mx-auto">
          <Icon className="h-7 w-7 text-muted-foreground/50" />
        </div>
        <p className="text-[15px] font-semibold text-foreground mb-1.5">{message}</p>
        {description && (
          <p className="text-body-sm text-muted-foreground max-w-sm leading-relaxed mx-auto">{description}</p>
        )}
        {action && <div className="mt-5">{action}</div>}
      </div>
    </div>
  );
}

// Re-export chart components
export * from './charts';
