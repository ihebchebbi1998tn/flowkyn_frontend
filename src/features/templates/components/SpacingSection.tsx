import { Section, ShowcaseRow, ShowcaseGrid } from './Primitives';
import { cn } from '@/lib/utils';

export function SpacingSection() {
  const spacingScale = [
    { name: '1 (4px)', value: 'p-1' },
    { name: '2 (8px)', value: 'p-2' },
    { name: '3 (12px)', value: 'p-3' },
    { name: '4 (16px)', value: 'p-4' },
    { name: '5 (20px)', value: 'p-5' },
    { name: '6 (24px)', value: 'p-6' },
    { name: '8 (32px)', value: 'p-8' },
  ];

  const radiusScale = [
    { name: 'sm', class: 'rounded-sm' },
    { name: 'md', class: 'rounded-md' },
    { name: 'default', class: 'rounded' },
    { name: 'lg', class: 'rounded-lg' },
    { name: 'xl', class: 'rounded-xl' },
    { name: 'full', class: 'rounded-full' },
  ];

  return (
    <Section id="spacing" title="Spacing & Radius" description="Strict 4px scale for spacing. Consistent border radius tokens.">
      <ShowcaseRow label="Spacing Scale (padding demo)">
        <div className="flex items-end gap-3 flex-wrap w-full">
          {spacingScale.map(s => (
            <div key={s.name} className="flex flex-col items-center gap-1">
              <div className={cn('bg-primary/10 border border-primary/30', s.value)}>
                <div className="h-4 w-4 bg-primary/30 rounded-sm" />
              </div>
              <span className="text-label-xs text-muted-foreground font-mono">{s.name}</span>
            </div>
          ))}
        </div>
      </ShowcaseRow>

      <ShowcaseRow label="Border Radius">
        <div className="flex items-center gap-4 flex-wrap">
          {radiusScale.map(r => (
            <div key={r.name} className="flex flex-col items-center gap-2">
              <div className={cn('h-14 w-14 bg-primary/15 border border-primary/30', r.class)} />
              <span className="text-label-xs text-muted-foreground font-mono">{r.name}</span>
            </div>
          ))}
        </div>
      </ShowcaseRow>

      <ShowcaseRow label="Shadow Scale">
        <div className="flex items-center gap-6 flex-wrap">
          {[
            { name: 'shadow-card', class: 'shadow-card' },
            { name: 'shadow-card-hover', class: 'shadow-card-hover' },
            { name: 'shadow-elevated', class: 'shadow-elevated' },
          ].map(s => (
            <div key={s.name} className="flex flex-col items-center gap-2">
              <div className={cn('h-16 w-24 rounded-lg bg-card border border-border', s.class)} />
              <span className="text-label-xs text-muted-foreground font-mono">{s.name}</span>
            </div>
          ))}
        </div>
      </ShowcaseRow>
    </Section>
  );
}
