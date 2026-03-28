import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

/** Full-page skeleton shown inside DashboardLayout while lazy chunks load */
export function PageSkeleton() {
  return (
    <div className="space-y-6 max-w-[1200px] animate-in fade-in-0 duration-300">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div className="space-y-2">
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-7 w-48" />
        </div>
        <div className="hidden sm:flex gap-2">
          <Skeleton className="h-8 w-28 rounded-lg" />
          <Skeleton className="h-8 w-24 rounded-lg" />
        </div>
      </div>

      {/* Stat cards row */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-5 space-y-4">
            <div className="flex justify-between">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-4 w-4 rounded" />
            </div>
            <Skeleton className="h-7 w-16" />
            <Skeleton className="h-3 w-28" />
          </div>
        ))}
      </div>

      {/* Content area */}
      <div className="grid gap-5 lg:grid-cols-5">
        <div className="lg:col-span-3 rounded-xl border border-border bg-card">
          <div className="flex justify-between px-5 py-4 border-b border-border">
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-7 w-16 rounded" />
          </div>
          <div className="p-5">
            <Skeleton className="h-[220px] w-full rounded-lg" />
          </div>
        </div>
        <div className="lg:col-span-2 rounded-xl border border-border bg-card">
          <div className="flex justify-between px-5 py-4 border-b border-border">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-7 w-10 rounded" />
          </div>
          <div className="divide-y divide-border">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3.5 px-5 py-4">
                <div className="space-y-1 w-11 shrink-0">
                  <Skeleton className="h-3 w-10 mx-auto" />
                  <Skeleton className="h-2.5 w-8 mx-auto" />
                </div>
                <div className="h-8 w-px bg-border shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3.5 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Minimal skeleton for auth/public pages */
export function AuthPageSkeleton() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="w-full max-w-[400px] p-6 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}
