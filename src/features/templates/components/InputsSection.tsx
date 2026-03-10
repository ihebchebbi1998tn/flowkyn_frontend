import { useState } from 'react';
import { Search, Mail, Lock, Calendar, User, Eye } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { Section, ShowcaseRow, ShowcaseGrid } from './Primitives';

export function InputsSection() {
  const [switchOn, setSwitchOn] = useState(true);
  const [sliderVal, setSliderVal] = useState([50]);

  return (
    <Section id="inputs" title="Inputs & Forms" description="Form controls following the 4px spacing scale with consistent border radii.">
      <ShowcaseGrid label="Text Inputs" cols={2}>
        <div className="space-y-2">
          <Label>Default Input</Label>
          <Input placeholder="Enter your name..." />
        </div>
        <div className="space-y-2">
          <Label>With Icon</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search..." className="pl-10" />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input type="email" placeholder="you@example.com" className="pl-10" />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Password</Label>
          <PasswordInput placeholder="Enter password..." />
        </div>
        <div className="space-y-2">
          <Label>Disabled</Label>
          <Input disabled placeholder="Cannot edit..." />
        </div>
        <div className="space-y-2">
          <Label>Read-only</Label>
          <Input readOnly value="Read-only value" className="bg-muted/50" />
        </div>
      </ShowcaseGrid>

      <ShowcaseGrid label="Textarea" cols={2}>
        <div className="space-y-2">
          <Label>Default</Label>
          <Textarea placeholder="Write your message..." rows={3} />
        </div>
        <div className="space-y-2">
          <Label>With character count</Label>
          <div>
            <Textarea placeholder="Max 200 characters..." rows={3} maxLength={200} />
            <p className="text-label-xs text-muted-foreground text-right mt-1">0/200</p>
          </div>
        </div>
      </ShowcaseGrid>

      <ShowcaseGrid label="Select & Dropdowns" cols={2}>
        <div className="space-y-2">
          <Label>Select</Label>
          <Select>
            <SelectTrigger><SelectValue placeholder="Choose option..." /></SelectTrigger>
            <SelectContent>
              <SelectItem value="opt1">Option 1</SelectItem>
              <SelectItem value="opt2">Option 2</SelectItem>
              <SelectItem value="opt3">Option 3</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>With default</Label>
          <Select defaultValue="opt2">
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="opt1">Icebreaker</SelectItem>
              <SelectItem value="opt2">Connection</SelectItem>
              <SelectItem value="opt3">Wellness</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </ShowcaseGrid>

      <ShowcaseRow label="Toggles & Checks">
        <div className="flex items-center gap-6 flex-wrap">
          <div className="flex items-center gap-2">
            <Checkbox id="check1" />
            <Label htmlFor="check1" className="text-body-sm">Checkbox</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="check2" defaultChecked />
            <Label htmlFor="check2" className="text-body-sm">Checked</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="check3" disabled />
            <Label htmlFor="check3" className="text-body-sm text-muted-foreground">Disabled</Label>
          </div>
          <div className="h-6 w-px bg-border" />
          <div className="flex items-center gap-2">
            <Switch checked={switchOn} onCheckedChange={setSwitchOn} />
            <Label className="text-body-sm">{switchOn ? 'On' : 'Off'}</Label>
          </div>
        </div>
      </ShowcaseRow>

      <ShowcaseRow label="Radio Group">
        <RadioGroup defaultValue="sync" className="flex gap-6">
          <div className="flex items-center gap-2">
            <RadioGroupItem value="sync" id="sync" />
            <Label htmlFor="sync" className="text-body-sm">Synchronous</Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="async" id="async" />
            <Label htmlFor="async" className="text-body-sm">Asynchronous</Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="hybrid" id="hybrid" />
            <Label htmlFor="hybrid" className="text-body-sm">Hybrid</Label>
          </div>
        </RadioGroup>
      </ShowcaseRow>

      <ShowcaseRow label="Slider">
        <div className="w-full max-w-sm space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-body-sm">Volume</Label>
            <span className="text-label text-muted-foreground font-mono">{sliderVal[0]}%</span>
          </div>
          <Slider value={sliderVal} onValueChange={setSliderVal} max={100} step={1} />
        </div>
      </ShowcaseRow>
    </Section>
  );
}
