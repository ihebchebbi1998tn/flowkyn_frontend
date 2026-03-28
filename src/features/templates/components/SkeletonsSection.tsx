import { Skeleton } from '@/components/ui/skeleton';
import { StatCardSkeleton, ChartCardSkeleton, CardGridSkeleton, TableSkeleton, NotificationListSkeleton } from '@/components/loading/Skeletons';
import { Section, ShowcaseGrid } from './Primitives';

export function SkeletonsSection() {
  return (
    <Section id="skeletons" title="Loading Skeletons" description="Layout-preserving loading states to prevent content shift.">
      <ShowcaseGrid label="Primitive Skeletons" cols={3}>
        <div className="space-y-3">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
        <div className="space-y-3">
          <Skeleton className="h-8 w-full rounded-lg" />
          <Skeleton className="h-8 w-full rounded-lg" />
          <Skeleton className="h-8 w-2/3 rounded-lg" />
        </div>
      </ShowcaseGrid>

      <div className="rounded-lg border border-border bg-card p-5">
        <p className="text-label uppercase text-muted-foreground mb-4">Stat Cards Skeleton</p>
        <StatCardSkeleton />
      </div>

      <div className="rounded-lg border border-border bg-card p-5">
        <p className="text-label uppercase text-muted-foreground mb-4">Chart Card Skeleton</p>
        <ChartCardSkeleton height={160} />
      </div>

      <div className="rounded-lg border border-border bg-card p-5">
        <p className="text-label uppercase text-muted-foreground mb-4">Card Grid Skeleton</p>
        <CardGridSkeleton count={3} />
      </div>

      <div className="rounded-lg border border-border bg-card p-5">
        <p className="text-label uppercase text-muted-foreground mb-4">Table Skeleton</p>
        <TableSkeleton rows={3} cols={4} />
      </div>

      <div className="rounded-lg border border-border bg-card p-5">
        <p className="text-label uppercase text-muted-foreground mb-4">Notification List Skeleton</p>
        <NotificationListSkeleton count={3} />
      </div>
    </Section>
  );
}
