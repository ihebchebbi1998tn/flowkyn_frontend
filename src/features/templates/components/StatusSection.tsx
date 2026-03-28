/**
 * @fileoverview Status & Indicators Section — status dots, progress, timelines, notification badges.
 */

import { motion } from 'framer-motion';
import { Check, Clock, AlertTriangle, XCircle, Radio, Wifi, WifiOff, Circle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Section, ShowcaseRow, ShowcaseGrid } from './Primitives';

function StatusDot({ color, pulse, label }: { color: string; pulse?: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="relative flex h-2.5 w-2.5">
        {pulse && <span className={cn('animate-ping absolute inline-flex h-full w-full rounded-full opacity-75', color)} />}
        <span className={cn('relative inline-flex rounded-full h-2.5 w-2.5', color)} />
      </span>
      <span className="text-body-sm text-foreground">{label}</span>
    </div>
  );
}

function Timeline() {
  const events = [
    { time: '10:00 AM', title: 'Event created', desc: 'by Alice Martin', icon: Check, color: 'bg-success text-success-foreground' },
    { time: '10:15 AM', title: 'Invitations sent', desc: '12 members invited', icon: Radio, color: 'bg-primary text-primary-foreground' },
    { time: '10:30 AM', title: '8 members joined', desc: 'Waiting for 4 more', icon: Clock, color: 'bg-warning text-warning-foreground' },
    { time: '11:00 AM', title: 'Event started', desc: 'Two Truths & a Lie', icon: Radio, color: 'bg-primary text-primary-foreground' },
  ];

  return (
    <div className="space-y-0">
      {events.map((event, i) => (
        <div key={i} className="flex gap-3">
          <div className="flex flex-col items-center">
            <div className={cn('flex h-7 w-7 items-center justify-center rounded-full shrink-0', event.color)}>
              <event.icon className="h-3.5 w-3.5" />
            </div>
            {i < events.length - 1 && <div className="w-0.5 flex-1 bg-border my-1" />}
          </div>
          <div className="pb-5">
            <p className="text-body-sm font-medium text-foreground leading-7">{event.title}</p>
            <p className="text-label text-muted-foreground">{event.desc}</p>
            <p className="text-label-xs text-muted-foreground/60 mt-0.5">{event.time}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export function StatusSection() {
  return (
    <Section id="status" title="Status & Indicators" description="Status dots, progress bars, timelines, connection states, and notification badges.">

      <ShowcaseRow label="Status Dots">
        <div className="flex flex-wrap gap-6">
          <StatusDot color="bg-success" pulse label="Online" />
          <StatusDot color="bg-warning" label="Away" />
          <StatusDot color="bg-destructive" pulse label="Busy" />
          <StatusDot color="bg-muted-foreground/40" label="Offline" />
          <StatusDot color="bg-primary" pulse label="Live" />
        </div>
      </ShowcaseRow>

      <ShowcaseGrid label="Progress Variants" cols={2}>
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-body-sm"><span>Upload progress</span><span className="text-muted-foreground tabular-nums">75%</span></div>
            <Progress value={75} className="h-2" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-body-sm"><span>Team completion</span><span className="text-muted-foreground tabular-nums">45%</span></div>
            <Progress value={45} className="h-2" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-body-sm"><span>Storage used</span><span className="text-destructive text-label font-medium">92%</span></div>
            <Progress value={92} className="h-2 [&>div]:bg-destructive" />
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-label uppercase text-muted-foreground">Segmented Progress</p>
          <div className="flex gap-1">
            {[true, true, true, true, false, false, false].map((filled, i) => (
              <div key={i} className={cn('h-2 flex-1 rounded-full', filled ? 'bg-primary' : 'bg-muted')} />
            ))}
          </div>
          <p className="text-label text-muted-foreground">Step 4 of 7</p>

          <p className="text-label uppercase text-muted-foreground mt-4">Circular Progress</p>
          <div className="flex items-center gap-4">
            {[25, 50, 75, 100].map(pct => (
              <div key={pct} className="relative h-12 w-12">
                <svg viewBox="0 0 36 36" className="h-12 w-12 -rotate-90">
                  <circle cx="18" cy="18" r="15" fill="none" stroke="hsl(var(--muted))" strokeWidth="3" />
                  <motion.circle cx="18" cy="18" r="15" fill="none" stroke="hsl(var(--primary))" strokeWidth="3"
                    strokeLinecap="round" strokeDasharray={`${pct * 0.94} 100`}
                    initial={{ strokeDasharray: '0 100' }}
                    animate={{ strokeDasharray: `${pct * 0.94} 100` }}
                    transition={{ duration: 1, ease: 'easeOut' }} />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-label-xs font-semibold text-foreground">{pct}%</span>
              </div>
            ))}
          </div>
        </div>
      </ShowcaseGrid>

      <ShowcaseGrid label="Connection & System Status" cols={3}>
        <div className="rounded-xl border border-success/30 bg-success/5 p-4 flex items-center gap-3">
          <Wifi className="h-5 w-5 text-success" />
          <div>
            <p className="text-body-sm font-medium text-foreground">Connected</p>
            <p className="text-label text-muted-foreground">Latency: 24ms</p>
          </div>
        </div>
        <div className="rounded-xl border border-warning/30 bg-warning/5 p-4 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-warning" />
          <div>
            <p className="text-body-sm font-medium text-foreground">Degraded</p>
            <p className="text-label text-muted-foreground">Some features may be slow</p>
          </div>
        </div>
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 flex items-center gap-3">
          <WifiOff className="h-5 w-5 text-destructive" />
          <div>
            <p className="text-body-sm font-medium text-foreground">Disconnected</p>
            <p className="text-label text-muted-foreground">Reconnecting...</p>
          </div>
        </div>
      </ShowcaseGrid>

      <ShowcaseGrid label="Timeline" cols={2}>
        <Timeline />
        <div className="space-y-3">
          <p className="text-label uppercase text-muted-foreground">Notification Badges</p>
          <div className="flex flex-wrap gap-4">
            {[
              { label: 'Messages', count: 3, color: 'bg-primary' },
              { label: 'Alerts', count: 12, color: 'bg-destructive' },
              { label: 'Updates', count: 1, color: 'bg-info' },
              { label: 'None', count: 0, color: '' },
            ].map(item => (
              <div key={item.label} className="relative">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-muted text-muted-foreground text-label font-semibold">{item.label[0]}</AvatarFallback>
                </Avatar>
                {item.count > 0 && (
                  <span className={cn('absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full text-[10px] font-bold text-primary-foreground px-1', item.color)}>
                    {item.count}
                  </span>
                )}
                <p className="text-label-xs text-muted-foreground text-center mt-1">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </ShowcaseGrid>
    </Section>
  );
}
