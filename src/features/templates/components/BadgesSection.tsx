import { Badge } from '@/components/ui/badge';
import { Section, ShowcaseRow } from './Primitives';

export function BadgesSection() {
  return (
    <Section id="badges" title="Badges & Tags" description="Status indicators, labels, and categorization tags.">
      <ShowcaseRow label="Variants">
        <Badge variant="default">Primary</Badge>
        <Badge variant="secondary">Secondary</Badge>
        <Badge variant="outline">Outline</Badge>
        <Badge variant="destructive">Destructive</Badge>
        <Badge variant="success">Success</Badge>
        <Badge variant="warning">Warning</Badge>
      </ShowcaseRow>

      <ShowcaseRow label="Status Indicators">
        <Badge variant="success" className="gap-1.5">
          <span className="relative flex h-1.5 w-1.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" /><span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-success" /></span>
          Active
        </Badge>
        <Badge variant="warning" className="gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-warning" />
          Pending
        </Badge>
        <Badge variant="outline" className="gap-1.5 text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
          Inactive
        </Badge>
        <Badge variant="destructive" className="gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-destructive-foreground" />
          Error
        </Badge>
      </ShowcaseRow>

      <ShowcaseRow label="Category Tags">
        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">🎯 Icebreaker</Badge>
        <Badge variant="outline" className="bg-success/5 text-success border-success/20">🤝 Connection</Badge>
        <Badge variant="outline" className="bg-warning/5 text-warning border-warning/20">🧘 Wellness</Badge>
        <Badge variant="outline" className="bg-info/5 text-info border-info/20">🏆 Competition</Badge>
      </ShowcaseRow>

      <ShowcaseRow label="Size Variations">
        <Badge variant="default" className="text-label-xs px-1.5 py-0 h-[18px]">Tiny</Badge>
        <Badge variant="default">Default</Badge>
        <Badge variant="default" className="text-body-sm px-3 py-1">Large</Badge>
      </ShowcaseRow>
    </Section>
  );
}
