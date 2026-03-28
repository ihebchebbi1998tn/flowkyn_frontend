import React from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

const iconColorMap = {
  primary: 'bg-primary/10 text-primary',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  info: 'bg-info/10 text-info',
  destructive: 'bg-destructive/10 text-destructive',
};

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  className?: string;
  gradient?: 'primary' | 'success' | 'warning' | 'info' | 'destructive';
}

export function StatCard({ title, value, change, icon, className, gradient = 'primary' }: StatCardProps) {
  const { t } = useTranslation();
  const isPositive = change !== undefined && change >= 0;

  return (
    <div className={cn(
      "rounded-lg border border-border bg-card p-4 transition-colors hover:border-border/80",
      className
    )}>
      <div className="flex items-start justify-between">
        <div className="space-y-1.5 min-w-0">
          <p className="text-label uppercase text-muted-foreground truncate">{title}</p>
          <p className="text-2xl font-semibold text-card-foreground tracking-tight leading-none">{value}</p>
          {change !== undefined && (
            <div className={cn("flex items-center gap-1 pt-0.5", isPositive ? "text-success" : "text-destructive")}>
              {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              <span className="text-label font-medium">
                {isPositive ? '+' : ''}{change}%
              </span>
              <span className="text-label text-muted-foreground ml-0.5 hidden sm:inline">{t('dashboard.trend')}</span>
            </div>
          )}
        </div>
        <div className={cn(
          "flex h-9 w-9 items-center justify-center rounded-lg shrink-0",
          iconColorMap[gradient]
        )}>
          {icon}
        </div>
      </div>
    </div>
  );
}

interface InfoCardProps {
  title: string;
  gradient?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}

export function InfoCard({ title, children, action, className, noPadding }: InfoCardProps) {
  return (
    <div className={cn("rounded-lg border border-border bg-card overflow-hidden", className)}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="text-card-title font-semibold text-card-foreground">{title}</h3>
        {action}
      </div>
      <div className={noPadding ? '' : 'p-4'}>{children}</div>
    </div>
  );
}
