import { cn } from '@/lib/utils';
import type { SectionProps } from '../types';

export function Section({ id, title, description, children }: SectionProps) {
  return (
    <section id={id} className="scroll-mt-20">
      <div className="mb-5">
        <h2 className="text-section-title text-foreground">{title}</h2>
        {description && (
          <p className="text-body-sm text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

export function ShowcaseRow({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('rounded-lg border border-border bg-card p-5', className)}>
      <p className="text-label uppercase text-muted-foreground mb-4">{label}</p>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  );
}

export function ShowcaseGrid({ label, children, cols = 2 }: { label: string; children: React.ReactNode; cols?: number }) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <p className="text-label uppercase text-muted-foreground mb-4">{label}</p>
      <div className={cn('grid gap-4', cols === 2 && 'sm:grid-cols-2', cols === 3 && 'sm:grid-cols-3', cols === 4 && 'sm:grid-cols-2 lg:grid-cols-4')}>
        {children}
      </div>
    </div>
  );
}

export function CodeBlock({ code }: { code: string }) {
  return (
    <pre className="rounded-lg bg-muted/60 border border-border p-4 overflow-x-auto">
      <code className="text-caption font-mono text-foreground/80">{code}</code>
    </pre>
  );
}
