import { Section, ShowcaseRow } from './Primitives';

export function TypographySection() {
  return (
    <Section id="typography" title="Typography" description="Strict semantic scale using Inter. Use these token classes — never arbitrary sizes.">
      <ShowcaseRow label="Heading Scale">
        <div className="space-y-4 w-full">
          <div className="flex items-baseline gap-4">
            <span className="text-label-xs text-muted-foreground w-24 shrink-0 font-mono">page-title</span>
            <h1 className="text-page-title text-foreground">Page Title — 24px/600</h1>
          </div>
          <div className="flex items-baseline gap-4">
            <span className="text-label-xs text-muted-foreground w-24 shrink-0 font-mono">section-title</span>
            <h2 className="text-section-title text-foreground">Section Title — 18px/600</h2>
          </div>
          <div className="flex items-baseline gap-4">
            <span className="text-label-xs text-muted-foreground w-24 shrink-0 font-mono">card-title</span>
            <h3 className="text-card-title text-foreground font-semibold">Card Title — 14px/600</h3>
          </div>
        </div>
      </ShowcaseRow>
      <ShowcaseRow label="Body & Caption">
        <div className="space-y-3 w-full">
          <div className="flex items-baseline gap-4">
            <span className="text-label-xs text-muted-foreground w-24 shrink-0 font-mono">body</span>
            <p className="text-body text-foreground">Body text — 14px/400 — The quick brown fox jumps over the lazy dog.</p>
          </div>
          <div className="flex items-baseline gap-4">
            <span className="text-label-xs text-muted-foreground w-24 shrink-0 font-mono">body-sm</span>
            <p className="text-body-sm text-muted-foreground">Body small — 13px/400 — Secondary information and descriptions.</p>
          </div>
          <div className="flex items-baseline gap-4">
            <span className="text-label-xs text-muted-foreground w-24 shrink-0 font-mono">caption</span>
            <p className="text-caption text-muted-foreground">Caption — 12px/400 — Metadata, timestamps, counts.</p>
          </div>
          <div className="flex items-baseline gap-4">
            <span className="text-label-xs text-muted-foreground w-24 shrink-0 font-mono">label</span>
            <p className="text-label text-muted-foreground uppercase">Label — 11px/500 — Column headers, categories</p>
          </div>
          <div className="flex items-baseline gap-4">
            <span className="text-label-xs text-muted-foreground w-24 shrink-0 font-mono">label-xs</span>
            <p className="text-label-xs text-muted-foreground uppercase">Label XS — 10px/500 — Tiny metadata</p>
          </div>
        </div>
      </ShowcaseRow>
      <ShowcaseRow label="Font Families">
        <div className="space-y-3 w-full">
          <p className="font-sans text-body text-foreground">Inter (sans) — Primary typeface for all UI text</p>
          <p className="font-mono text-body text-foreground">JetBrains Mono — Code blocks and technical values</p>
        </div>
      </ShowcaseRow>
    </Section>
  );
}
