/**
 * @fileoverview Forms Section — complete form patterns, validation states, form layouts.
 */

import { useState } from 'react';
import { Check, AlertCircle, Eye, EyeOff, Upload, X, Image } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { Section, ShowcaseGrid, ShowcaseRow } from './Primitives';

function ValidationInput({ label, error, success, hint, ...props }: {
  label: string; error?: string; success?: boolean; hint?: string; [key: string]: any;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-body-sm font-medium">{label}</Label>
      <div className="relative">
        <Input {...props} className={cn(
          'h-10 rounded-xl text-body-sm pr-9',
          error && 'border-destructive focus-visible:ring-destructive',
          success && 'border-success focus-visible:ring-success'
        )} />
        {error && <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-destructive" />}
        {success && <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-success" />}
      </div>
      {error && <p className="text-label text-destructive">{error}</p>}
      {hint && !error && <p className="text-label text-muted-foreground">{hint}</p>}
    </div>
  );
}

function TagInput() {
  const [tags, setTags] = useState(['team-building', 'remote', 'icebreaker']);
  const [input, setInput] = useState('');

  const addTag = () => {
    if (input.trim() && !tags.includes(input.trim())) {
      setTags([...tags, input.trim()]);
      setInput('');
    }
  };

  return (
    <div className="space-y-1.5">
      <Label className="text-body-sm font-medium">Tags</Label>
      <div className="flex flex-wrap items-center gap-1.5 min-h-[40px] rounded-xl border border-input bg-background px-3 py-2 focus-within:ring-2 focus-within:ring-ring">
        {tags.map(tag => (
          <Badge key={tag} variant="secondary" className="gap-1 h-6 text-label">
            {tag}
            <button onClick={() => setTags(tags.filter(t => t !== tag))} className="hover:text-destructive transition-colors">
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        <input
          value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
          className="flex-1 min-w-[80px] bg-transparent text-body-sm outline-none placeholder:text-muted-foreground"
          placeholder="Add tag..."
        />
      </div>
      <p className="text-label text-muted-foreground">Press Enter to add tags</p>
    </div>
  );
}

function FileUploadZone() {
  const [isDrag, setIsDrag] = useState(false);

  return (
    <div className="space-y-1.5">
      <Label className="text-body-sm font-medium">File Upload</Label>
      <div
        className={cn(
          'flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-8 transition-all cursor-pointer',
          isDrag ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40 hover:bg-muted/30'
        )}
        onDragOver={e => { e.preventDefault(); setIsDrag(true); }}
        onDragLeave={() => setIsDrag(false)}
        onDrop={e => { e.preventDefault(); setIsDrag(false); }}
      >
        <div className="h-12 w-12 rounded-xl bg-muted/60 flex items-center justify-center">
          <Upload className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="text-center">
          <p className="text-body-sm font-medium text-foreground">
            <span className="text-primary">Click to upload</span> or drag and drop
          </p>
          <p className="text-label text-muted-foreground mt-0.5">SVG, PNG, JPG or GIF (max. 5MB)</p>
        </div>
      </div>
    </div>
  );
}

export function FormsSection() {
  return (
    <Section id="forms" title="Form Patterns" description="Complete form layouts with validation states, tags, file upload, and inline editing.">

      <ShowcaseGrid label="Validation States" cols={3}>
        <ValidationInput label="Email (valid)" defaultValue="alice@flowkyn.com" success hint="Email is available" />
        <ValidationInput label="Username (error)" defaultValue="ab" error="Username must be at least 3 characters" />
        <ValidationInput label="With hint" placeholder="Enter your name..." hint="This will be displayed publicly" />
      </ShowcaseGrid>

      <ShowcaseGrid label="Complete Form" cols={2}>
        <div className="space-y-4 p-5 rounded-xl border border-border bg-card">
          <h3 className="text-card-title font-semibold text-foreground">Create Event</h3>
          <div className="space-y-1.5">
            <Label className="text-body-sm font-medium">Event Name</Label>
            <Input placeholder="Team Building Friday" className="h-10 rounded-xl text-body-sm" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-body-sm font-medium">Description</Label>
            <Textarea placeholder="Describe your event..." rows={3} className="rounded-xl text-body-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-body-sm font-medium">Mode</Label>
              <Select defaultValue="sync">
                <SelectTrigger className="h-10 rounded-xl text-body-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sync">Synchronous</SelectItem>
                  <SelectItem value="async">Asynchronous</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-body-sm font-medium">Max Participants</Label>
              <Input type="number" defaultValue={20} className="h-10 rounded-xl text-body-sm" />
            </div>
          </div>
          <div className="flex items-center justify-between py-1">
            <div>
              <p className="text-body-sm font-medium text-foreground">Allow Guests</p>
              <p className="text-label text-muted-foreground">Let non-members join via link</p>
            </div>
            <Switch defaultChecked />
          </div>
          <Button className="w-full h-10 rounded-xl">Create Event</Button>
        </div>

        <div className="space-y-4">
          <TagInput />
          <FileUploadZone />
        </div>
      </ShowcaseGrid>

      <ShowcaseRow label="Inline Settings Pattern">
        <div className="w-full space-y-3">
          {[
            { label: 'Email Notifications', desc: 'Receive updates about your events', checked: true },
            { label: 'Push Notifications', desc: 'Get browser push notifications', checked: false },
            { label: 'Weekly Digest', desc: 'Summary of team activity', checked: true },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between p-3 rounded-xl border border-border hover:bg-muted/30 transition-colors">
              <div>
                <p className="text-body-sm font-medium text-foreground">{item.label}</p>
                <p className="text-label text-muted-foreground">{item.desc}</p>
              </div>
              <Switch defaultChecked={item.checked} />
            </div>
          ))}
        </div>
      </ShowcaseRow>
    </Section>
  );
}
