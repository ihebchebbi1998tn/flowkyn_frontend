/**
 * @fileoverview Skeleton primitives for data-heavy pages.
 * Each variant mirrors the exact layout of its real component
 * to prevent layout shift when data loads.
 */

import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

/* ─── Stat Card Skeleton ─── */
export function StatCardSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className={cn('grid gap-4 grid-cols-2', count >= 4 && 'lg:grid-cols-4')}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-lg border border-border bg-card p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-9 w-9 rounded-lg" />
            <Skeleton className="h-4 w-10" />
          </div>
          <Skeleton className="h-7 w-16" />
          <div className="space-y-1">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-14" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Chart Card Skeleton ─── */
export function ChartCardSkeleton({ height = 240, className }: { height?: number; className?: string }) {
  return (
    <div className={cn('rounded-lg border border-border bg-card overflow-hidden', className)}>
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton className="h-7 w-16 rounded-md" />
      </div>
      <div className="p-5">
        <Skeleton className={cn('w-full rounded-lg')} style={{ height }} />
      </div>
    </div>
  );
}

/* ─── Event/Activity Card Skeleton ─── */
export function CardGridSkeleton({ count = 6, cols = 3 }: { count?: number; cols?: 2 | 3 }) {
  return (
    <div className={cn(
      'grid gap-4 grid-cols-1 sm:grid-cols-2',
      cols === 3 && 'lg:grid-cols-3'
    )}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-14 rounded-full" />
              <Skeleton className="h-5 w-12 rounded-full" />
            </div>
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <div className="flex items-center justify-between pt-1">
              <div className="flex -space-x-1.5">
                {Array.from({ length: 3 }).map((_, j) => (
                  <Skeleton key={j} className="h-6 w-6 rounded-full" />
                ))}
              </div>
              <Skeleton className="h-3 w-12" />
            </div>
            <Skeleton className="h-1 w-full rounded-full" />
          </div>
          <div className="flex items-center justify-between px-4 py-2.5 border-t border-border bg-muted/30">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-14" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Table Skeleton ─── */
export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      {/* Table header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-8 w-48 rounded-lg" />
      </div>
      {/* Header row */}
      <div className="grid gap-4 px-5 py-3 border-b border-border" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-3 w-16" />
        ))}
      </div>
      {/* Data rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="grid gap-4 px-5 py-3 border-b border-border last:border-b-0"
          style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
          {i === 0 || i === 2 ? (
            <>
              <div className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="space-y-1.5">
                  <Skeleton className="h-3.5 w-24" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
              {Array.from({ length: cols - 1 }).map((_, j) => (
                <Skeleton key={j} className="h-4 w-16 self-center" />
              ))}
            </>
          ) : (
            Array.from({ length: cols }).map((_, j) => (
              <Skeleton key={j} className="h-4 w-20 self-center" />
            ))
          )}
        </div>
      ))}
    </div>
  );
}

/* ─── Notification List Skeleton ─── */
export function NotificationListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-1.5">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-start gap-3 p-3.5 rounded-xl border border-border bg-card">
          <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-full" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-3 w-8" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Settings Section Skeleton ─── */
export function SettingsSkeleton({ sections = 3 }: { sections?: number }) {
  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="space-y-1">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-4 w-56" />
      </div>
      {/* Sections */}
      {Array.from({ length: sections }).map((_, i) => (
        <div key={i} className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-border">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <div className="space-y-1">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-44" />
            </div>
          </div>
          <div className="p-6 space-y-4">
            {Array.from({ length: 3 }).map((_, j) => (
              <div key={j} className="flex items-center justify-between">
                <div className="space-y-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-40" />
                </div>
                <Skeleton className="h-8 w-48 rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Dashboard Full Page Skeleton ─── */
export function DashboardSkeleton() {
  return (
    <div className="space-y-5 max-w-[1200px] animate-fade-in">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div className="space-y-1">
          <Skeleton className="h-3.5 w-28" />
          <Skeleton className="h-7 w-40" />
        </div>
        <div className="hidden sm:flex gap-2">
          <Skeleton className="h-9 w-32 rounded-xl" />
          <Skeleton className="h-9 w-24 rounded-xl" />
        </div>
      </div>

      <StatCardSkeleton />

      <div className="grid gap-5 lg:grid-cols-5">
        <ChartCardSkeleton height={240} className="lg:col-span-3" />
        <ChartCardSkeleton height={280} className="lg:col-span-2" />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <ChartCardSkeleton height={260} />
        <ChartCardSkeleton height={260} />
      </div>
    </div>
  );
}

/* ─── Profile Skeleton ─── */
export function ProfileSkeleton() {
  return (
    <div className="space-y-6 max-w-3xl animate-fade-in">
      <div className="flex items-center gap-6">
        <Skeleton className="h-20 w-20 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-3.5 w-16" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        ))}
        <Skeleton className="h-9 w-24 rounded-lg mt-2" />
      </div>
    </div>
  );
}
