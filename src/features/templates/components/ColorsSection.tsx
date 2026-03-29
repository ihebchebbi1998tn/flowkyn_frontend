import { Section, ShowcaseRow } from './Primitives';

const colorTokens = [
  { name: 'Primary', var: '--primary', class: 'bg-primary' },
  { name: 'Secondary', var: '--secondary', class: 'bg-secondary' },
  { name: 'Accent', var: '--accent', class: 'bg-accent' },
  { name: 'Destructive', var: '--destructive', class: 'bg-destructive' },
  { name: 'Success', var: '--success', class: 'bg-success' },
  { name: 'Warning', var: '--warning', class: 'bg-warning' },
  { name: 'Info', var: '--info', class: 'bg-info' },
  { name: 'Muted', var: '--muted', class: 'bg-muted' },
];

const surfaceTokens = [
  { name: 'Background', var: '--background', class: 'bg-background' },
  { name: 'Card', var: '--card', class: 'bg-card' },
  { name: 'Popover', var: '--popover', class: 'bg-popover' },
  { name: 'Border', var: '--border', class: 'bg-border' },
  { name: 'Input', var: '--input', class: 'bg-input' },
];

const chartTokens = [
  { name: 'Chart 1', var: '--chart-1', class: 'bg-chart-1' },
  { name: 'Chart 2', var: '--chart-2', class: 'bg-chart-2' },
  { name: 'Chart 3', var: '--chart-3', class: 'bg-chart-3' },
  { name: 'Chart 4', var: '--chart-4', class: 'bg-chart-4' },
  { name: 'Chart 5', var: '--chart-5', class: 'bg-chart-5' },
];

function ColorSwatch({ name, cssVar, className }: { name: string; cssVar: string; className: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`h-10 w-10 rounded-lg border border-border shrink-0 ${className}`} />
      <div>
        <p className="text-body-sm font-medium text-foreground">{name}</p>
        <p className="text-label-xs text-muted-foreground font-mono">{cssVar}</p>
      </div>
    </div>
  );
}

export function ColorsSection() {
  return (
    <Section id="colors" title="Colors & Tokens" description="HSL-based design tokens that adapt to light/dark modes. Never use hardcoded colors.">
      <ShowcaseRow label="Brand & Semantic Colors">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full">
          {colorTokens.map(t => (
            <ColorSwatch key={t.name} name={t.name} cssVar={t.var} className={t.class} />
          ))}
        </div>
      </ShowcaseRow>
      <ShowcaseRow label="Surfaces & Chrome">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 w-full">
          {surfaceTokens.map(t => (
            <ColorSwatch key={t.name} name={t.name} cssVar={t.var} className={t.class} />
          ))}
        </div>
      </ShowcaseRow>
      <ShowcaseRow label="Chart Palette">
        <div className="grid grid-cols-5 gap-4 w-full">
          {chartTokens.map(t => (
            <ColorSwatch key={t.name} name={t.name} cssVar={t.var} className={t.class} />
          ))}
        </div>
      </ShowcaseRow>
      <ShowcaseRow label="Gradients & Effects">
        <div className="flex flex-wrap gap-4 w-full">
          <div className="h-12 w-36 rounded-lg brand-gradient" />
          <div className="h-12 w-36 rounded-lg brand-gradient-subtle border border-border" />
          <div className="h-12 w-36 rounded-lg glass-card" />
          <div className="flex flex-col gap-1">
            <span className="brand-gradient-text text-section-title font-bold">Gradient Text</span>
            <span className="text-label-xs text-muted-foreground">.brand-gradient-text</span>
          </div>
        </div>
      </ShowcaseRow>
    </Section>
  );
}
