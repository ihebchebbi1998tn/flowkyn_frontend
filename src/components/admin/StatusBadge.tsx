import React from 'react';
import { Badge } from '@/components/ui/badge';

export type StatusVariant = 'success' | 'error' | 'warning' | 'info' | 'pending' | 'active' | 'inactive' | 'archived';

export interface StatusBadgeProps {
  status: string | StatusVariant;
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  className?: string;
  customColors?: Record<string, { bg: string; text: string }>;
}

const defaultStatusMap: Record<StatusVariant, { bg: string; text: string }> = {
  success: { bg: 'bg-green-100', text: 'text-green-800' },
  error: { bg: 'bg-red-100', text: 'text-red-800' },
  warning: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  info: { bg: 'bg-blue-100', text: 'text-blue-800' },
  pending: { bg: 'bg-orange-100', text: 'text-orange-800' },
  active: { bg: 'bg-green-100', text: 'text-green-800' },
  inactive: { bg: 'bg-gray-100', text: 'text-gray-800' },
  archived: { bg: 'bg-slate-100', text: 'text-slate-800' },
};

const statusAliases: Record<string, StatusVariant> = {
  approved: 'success',
  rejected: 'error',
  flagged: 'warning',
  pending: 'pending',
  enabled: 'active',
  disabled: 'inactive',
  published: 'success',
  draft: 'info',
  done: 'success',
  failed: 'error',
};

export function StatusBadge({
  status,
  variant,
  size = 'sm',
  icon,
  className = '',
  customColors = {},
}: StatusBadgeProps) {
  const statusKey = String(status).toLowerCase();
  const resolvedStatus = (statusAliases[statusKey] || statusKey) as StatusVariant;
  const colors = customColors[statusKey] || defaultStatusMap[resolvedStatus] || defaultStatusMap.info;

  const sizeClass = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-2.5 py-1.5',
    lg: 'text-base px-3 py-2',
  }[size];

  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-medium ${colors.bg} ${colors.text} ${sizeClass} ${className}`}>
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span className="capitalize">{status}</span>
    </span>
  );
}

export function StatusIndicator({
  status,
  customColors = {},
}: {
  status: string;
  customColors?: Record<string, string>;
}) {
  const statusKey = String(status).toLowerCase();
  const resolvedStatus = (statusAliases[statusKey] || statusKey) as StatusVariant;
  const colors = customColors[statusKey] 
    ? { bg: customColors[statusKey], text: 'text-foreground' }
    : defaultStatusMap[resolvedStatus] || defaultStatusMap.info;

  return (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${colors.bg}`}></div>
      <span className="text-sm capitalize">{status}</span>
    </div>
  );
}
