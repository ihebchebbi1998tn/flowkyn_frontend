/**
 * @fileoverview Page Layouts Section — common page layout patterns.
 */

import { Users, Calendar, Settings, BarChart3, Plus, Search, Filter, MoreHorizontal, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Section, ShowcaseGrid } from './Primitives';

function MiniPageHeader() {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="p-4 border-b border-border/60">
        <p className="text-label uppercase text-muted-foreground mb-3">Page Header Pattern</p>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-label text-muted-foreground mb-0.5">Organization</p>
            <h3 className="text-section-title text-foreground">Team Members</h3>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input placeholder="Search..." className="h-8 w-48 pl-8 text-body-sm rounded-lg" />
            </div>
            <Button variant="outline" size="sm" className="h-8 gap-1.5">
              <Filter className="h-3 w-3" /> Filter
            </Button>
            <Button size="sm" className="h-8 gap-1.5">
              <Plus className="h-3 w-3" /> Add Member
            </Button>
          </div>
        </div>
      </div>
      <div className="p-4 space-y-2">
        {[
          { name: 'Alice Martin', role: 'Admin', status: 'active' },
          { name: 'Bob Chen', role: 'Member', status: 'active' },
          { name: 'Carol Davis', role: 'Member', status: 'away' },
        ].map(user => (
          <div key={user.name} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/30 transition-colors cursor-pointer group">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-label-xs font-semibold bg-primary/10 text-primary">
                {user.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-body-sm font-medium text-foreground truncate">{user.name}</p>
            </div>
            <Badge variant="outline" className="text-label-xs">{user.role}</Badge>
            <span className={cn('h-2 w-2 rounded-full', user.status === 'active' ? 'bg-success' : 'bg-warning')} />
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreHorizontal className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function MiniDetailPage() {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="p-4 border-b border-border/60">
        <p className="text-label uppercase text-muted-foreground mb-3">Detail Page Pattern</p>
      </div>
      <div className="p-4 space-y-4">
        {/* Hero section */}
        <div className="rounded-xl bg-gradient-to-br from-primary/10 to-accent/5 p-5 border border-primary/10">
          <div className="flex items-start justify-between">
            <div>
              <Badge variant="outline" className="bg-success/10 text-success border-success/20 text-label mb-2">Active</Badge>
              <h3 className="text-section-title text-foreground mb-1">Team Building Friday</h3>
              <p className="text-body-sm text-muted-foreground">Weekly engagement session · 24 participants</p>
            </div>
            <Button size="sm" className="gap-1.5">
              <ArrowUpRight className="h-3 w-3" /> Join
            </Button>
          </div>
        </div>
        {/* Info grid */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: Calendar, label: 'Date', value: 'Mar 8, 2026' },
            { icon: Users, label: 'Participants', value: '24/30' },
            { icon: BarChart3, label: 'Engagement', value: '87%' },
          ].map(item => (
            <div key={item.label} className="rounded-lg border border-border p-3">
              <item.icon className="h-4 w-4 text-muted-foreground mb-1.5" />
              <p className="text-label text-muted-foreground">{item.label}</p>
              <p className="text-body-sm font-semibold text-foreground">{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MiniSettingsPage() {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="p-4 border-b border-border/60">
        <p className="text-label uppercase text-muted-foreground mb-3">Settings Page Pattern</p>
      </div>
      <div className="p-4">
        <div className="flex gap-4">
          {/* Settings nav */}
          <div className="w-32 shrink-0 space-y-0.5">
            {[
              { icon: Users, label: 'Profile', active: true },
              { icon: Settings, label: 'General' },
              { icon: BarChart3, label: 'Billing' },
            ].map(item => (
              <div key={item.label} className={cn(
                'flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-label cursor-pointer transition-colors',
                item.active ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )}>
                <item.icon className="h-3.5 w-3.5" />
                {item.label}
              </div>
            ))}
          </div>
          {/* Settings content */}
          <div className="flex-1 space-y-3">
            <div className="space-y-1.5">
              <p className="text-body-sm font-medium text-foreground">Display Name</p>
              <Input defaultValue="Alice Martin" className="h-8 text-body-sm rounded-lg" />
            </div>
            <div className="space-y-1.5">
              <p className="text-body-sm font-medium text-foreground">Email</p>
              <Input defaultValue="alice@flowkyn.com" className="h-8 text-body-sm rounded-lg" disabled />
            </div>
            <Button size="sm" className="h-8">Save Changes</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PageLayoutsSection() {
  return (
    <Section id="page-layouts" title="Page Layouts" description="Common page patterns: list pages, detail views, settings panels, dashboards.">
      <ShowcaseGrid label="Layout Patterns" cols={2}>
        <MiniPageHeader />
        <MiniDetailPage />
      </ShowcaseGrid>
      <MiniSettingsPage />
    </Section>
  );
}
