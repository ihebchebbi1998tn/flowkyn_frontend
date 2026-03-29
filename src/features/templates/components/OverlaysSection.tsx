import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ConfirmModal, FormModal } from '@/components/modals/ConfirmModal';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { Section, ShowcaseRow, ShowcaseGrid } from './Primitives';

export function OverlaysSection() {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [destructiveOpen, setDestructiveOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);

  return (
    <Section id="overlays" title="Overlays & Patterns" description="Modals, dialogs, tabs, accordions, tooltips, and other interactive patterns.">
      <ShowcaseRow label="Modals & Dialogs">
        <Button variant="outline" size="sm" onClick={() => setConfirmOpen(true)}>Confirm Modal</Button>
        <Button variant="outline" size="sm" onClick={() => setDestructiveOpen(true)}>Destructive Confirm</Button>
        <Button variant="outline" size="sm" onClick={() => setFormOpen(true)}>Form Modal</Button>

        <ConfirmModal open={confirmOpen} onClose={() => setConfirmOpen(false)} onConfirm={() => setConfirmOpen(false)}
          title="Confirm Action" message="Are you sure you want to proceed with this action?" />
        <ConfirmModal open={destructiveOpen} onClose={() => setDestructiveOpen(false)} onConfirm={() => setDestructiveOpen(false)}
          title="Delete Event" message="This will permanently delete the event and all associated data." variant="destructive" confirmLabel="Delete" />
        <FormModal open={formOpen} onClose={() => setFormOpen(false)} title="Create Event" description="Fill in the details for your new event."
          footer={<><Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button><Button onClick={() => setFormOpen(false)}>Create</Button></>}>
          <div className="space-y-2"><Label>Event Name</Label><Input placeholder="Team Building Friday" /></div>
          <div className="space-y-2"><Label>Description</Label><Input placeholder="A fun team activity..." /></div>
        </FormModal>
      </ShowcaseRow>

      <ShowcaseRow label="Tabs">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="h-9">
            <TabsTrigger value="overview" className="text-body-sm h-7">Overview</TabsTrigger>
            <TabsTrigger value="analytics" className="text-body-sm h-7">Analytics</TabsTrigger>
            <TabsTrigger value="settings" className="text-body-sm h-7">Settings</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="mt-4">
            <p className="text-body-sm text-muted-foreground">Overview tab content. This is where summary information goes.</p>
          </TabsContent>
          <TabsContent value="analytics" className="mt-4">
            <p className="text-body-sm text-muted-foreground">Analytics tab with charts and metrics.</p>
          </TabsContent>
          <TabsContent value="settings" className="mt-4">
            <p className="text-body-sm text-muted-foreground">Settings tab for configuration options.</p>
          </TabsContent>
        </Tabs>
      </ShowcaseRow>

      <ShowcaseRow label="Accordion">
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1">
            <AccordionTrigger className="text-body-sm">What is Flowkyn?</AccordionTrigger>
            <AccordionContent className="text-body-sm text-muted-foreground">
              Flowkyn is a team engagement platform that helps organizations run interactive activities and games.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger className="text-body-sm">How many participants can join?</AccordionTrigger>
            <AccordionContent className="text-body-sm text-muted-foreground">
              Each event supports up to 100 participants in synchronous mode and unlimited in async mode.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-3">
            <AccordionTrigger className="text-body-sm">Is it free to use?</AccordionTrigger>
            <AccordionContent className="text-body-sm text-muted-foreground">
              We offer a free tier with limited features and paid plans for teams and enterprises.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </ShowcaseRow>

      <ShowcaseGrid label="Progress Bars" cols={2}>
        <div className="space-y-3">
          <div className="flex justify-between text-body-sm"><span>Upload</span><span className="text-muted-foreground">75%</span></div>
          <Progress value={75} className="h-2" />
        </div>
        <div className="space-y-3">
          <div className="flex justify-between text-body-sm"><span>Processing</span><span className="text-muted-foreground">30%</span></div>
          <Progress value={30} className="h-2" />
        </div>
      </ShowcaseGrid>

      <ShowcaseRow label="Tooltips">
        <Tooltip>
          <TooltipTrigger asChild><Button variant="outline" size="sm">Hover me</Button></TooltipTrigger>
          <TooltipContent><p>This is a tooltip</p></TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild><Button variant="ghost" size="sm">Another tooltip</Button></TooltipTrigger>
          <TooltipContent side="bottom"><p>Bottom-aligned tooltip</p></TooltipContent>
        </Tooltip>
      </ShowcaseRow>

      <ShowcaseRow label="Separators">
        <div className="w-full space-y-4">
          <div className="flex items-center gap-4">
            <span className="text-body-sm text-foreground">Section A</span>
            <Separator className="flex-1" />
            <span className="text-body-sm text-foreground">Section B</span>
          </div>
          <div className="flex items-center gap-6">
            <span className="text-body-sm">Item 1</span>
            <Separator orientation="vertical" className="h-4" />
            <span className="text-body-sm">Item 2</span>
            <Separator orientation="vertical" className="h-4" />
            <span className="text-body-sm">Item 3</span>
          </div>
        </div>
      </ShowcaseRow>
    </Section>
  );
}
