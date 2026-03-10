import { useState } from 'react';
import { Plus, Download, Trash2, Settings, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LoadingButton } from '@/components/ui/loading-button';
import { Section, ShowcaseRow } from './Primitives';

export function ButtonsSection() {
  const [loading, setLoading] = useState(false);

  return (
    <Section id="buttons" title="Buttons" description="All button variants, sizes, and states available in the design system.">
      <ShowcaseRow label="Variants">
        <Button variant="default">Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="link">Link</Button>
        <Button variant="destructive">Destructive</Button>
      </ShowcaseRow>

      <ShowcaseRow label="Sizes">
        <Button size="sm">Small</Button>
        <Button size="default">Default</Button>
        <Button size="lg">Large</Button>
        <Button size="icon"><Settings className="h-4 w-4" /></Button>
      </ShowcaseRow>

      <ShowcaseRow label="With Icons">
        <Button><Plus className="h-4 w-4" /> Create</Button>
        <Button variant="outline"><Download className="h-4 w-4" /> Export</Button>
        <Button variant="destructive"><Trash2 className="h-4 w-4" /> Delete</Button>
        <Button variant="secondary"><Send className="h-4 w-4" /> Send</Button>
      </ShowcaseRow>

      <ShowcaseRow label="States">
        <Button disabled>Disabled</Button>
        <Button variant="outline" disabled>Disabled Outline</Button>
        <LoadingButton loading={loading} loadingText="Saving..." onClick={() => { setLoading(true); setTimeout(() => setLoading(false), 2000); }}>
          Click to Load
        </LoadingButton>
        <LoadingButton loading={true} loadingText="Processing...">Submit</LoadingButton>
      </ShowcaseRow>

      <ShowcaseRow label="Brand Gradient (via variant)">
        <Button variant="brand">
          <Plus className="h-4 w-4" /> Launch Activity
        </Button>
        <Button variant="brand" size="xl">
          Get Started
        </Button>
      </ShowcaseRow>

      <ShowcaseRow label="Size: XL (new)">
        <Button size="xl">Extra Large</Button>
        <Button variant="brand" size="xl">Brand XL</Button>
        <Button variant="outline" size="xl">Outline XL</Button>
      </ShowcaseRow>
    </Section>
  );
}
