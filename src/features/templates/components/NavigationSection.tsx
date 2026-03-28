/**
 * @fileoverview Navigation Section — breadcrumbs, tabs, pills, pagination, steps.
 */

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronRight, Home, Settings, Users, BarChart3, ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Section, ShowcaseRow, ShowcaseGrid } from './Primitives';

function Breadcrumb({ items }: { items: { label: string; active?: boolean }[] }) {
  return (
    <nav className="flex items-center gap-1.5 text-body-sm">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-1.5">
          {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40" />}
          <span className={item.active ? 'text-foreground font-medium' : 'text-muted-foreground hover:text-foreground cursor-pointer transition-colors'}>
            {item.label}
          </span>
        </div>
      ))}
    </nav>
  );
}

function StepIndicator({ steps, current }: { steps: string[]; current: number }) {
  return (
    <div className="flex items-center gap-2 w-full">
      {steps.map((step, i) => (
        <div key={i} className="flex items-center gap-2 flex-1 last:flex-initial">
          <div className={cn(
            'flex items-center justify-center h-8 w-8 rounded-full text-label font-semibold shrink-0 transition-all',
            i < current ? 'bg-primary text-primary-foreground' :
            i === current ? 'bg-primary text-primary-foreground ring-4 ring-primary/20' :
            'bg-muted text-muted-foreground'
          )}>
            {i < current ? '✓' : i + 1}
          </div>
          <span className={cn('text-body-sm hidden sm:block', i === current ? 'text-foreground font-medium' : 'text-muted-foreground')}>
            {step}
          </span>
          {i < steps.length - 1 && <div className={cn('flex-1 h-0.5 rounded-full', i < current ? 'bg-primary' : 'bg-border')} />}
        </div>
      ))}
    </div>
  );
}

export function NavigationSection() {
  const [activeTab, setActiveTab] = useState('overview');
  const [activePill, setActivePill] = useState('all');
  const [currentStep, setCurrentStep] = useState(1);

  const pills = ['All', 'Active', 'Draft', 'Completed', 'Archived'];
  const navItems = [
    { icon: Home, label: 'Dashboard', active: false },
    { icon: BarChart3, label: 'Analytics', active: true },
    { icon: Users, label: 'Members', active: false, badge: '12' },
    { icon: Settings, label: 'Settings', active: false },
  ];

  return (
    <Section id="navigation" title="Navigation" description="Breadcrumbs, tabs, pill filters, step indicators, and sidebar navigation patterns.">

      <ShowcaseRow label="Breadcrumbs">
        <div className="space-y-3 w-full">
          <Breadcrumb items={[{ label: 'Home' }, { label: 'Events' }, { label: 'Team Building Friday', active: true }]} />
          <Breadcrumb items={[{ label: 'Dashboard' }, { label: 'Organizations' }, { label: 'Acme Corp' }, { label: 'Members', active: true }]} />
        </div>
      </ShowcaseRow>

      <ShowcaseRow label="Tab Variants">
        <div className="space-y-4 w-full">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="h-9 bg-muted/50 p-0.5 rounded-xl">
              <TabsTrigger value="overview" className="text-body-sm h-8 rounded-lg data-[state=active]:shadow-sm">Overview</TabsTrigger>
              <TabsTrigger value="analytics" className="text-body-sm h-8 rounded-lg data-[state=active]:shadow-sm">Analytics</TabsTrigger>
              <TabsTrigger value="members" className="text-body-sm h-8 rounded-lg data-[state=active]:shadow-sm">Members</TabsTrigger>
              <TabsTrigger value="settings" className="text-body-sm h-8 rounded-lg data-[state=active]:shadow-sm">Settings</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Underline tabs */}
          <div className="flex items-center gap-6 border-b border-border">
            {['Overview', 'Analytics', 'Members', 'Settings'].map(tab => (
              <button key={tab} className={cn(
                'pb-2.5 text-body-sm font-medium transition-colors border-b-2 -mb-px',
                tab === 'Overview' ? 'text-primary border-primary' : 'text-muted-foreground border-transparent hover:text-foreground'
              )}>
                {tab}
              </button>
            ))}
          </div>
        </div>
      </ShowcaseRow>

      <ShowcaseRow label="Pill Filters">
        <div className="flex items-center gap-1.5 flex-wrap">
          {pills.map(pill => (
            <button key={pill} onClick={() => setActivePill(pill.toLowerCase())}
              className={cn(
                'px-3 py-1.5 rounded-full text-body-sm font-medium transition-all duration-200',
                activePill === pill.toLowerCase()
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
              )}>
              {pill}
            </button>
          ))}
        </div>
      </ShowcaseRow>

      <ShowcaseRow label="Step Indicator (click arrows to navigate)">
        <div className="w-full space-y-4">
          <StepIndicator steps={['Account', 'Organization', 'Branding', 'Review']} current={currentStep} />
          <div className="flex justify-center gap-2">
            <Button size="sm" variant="outline" onClick={() => setCurrentStep(Math.max(0, currentStep - 1))} disabled={currentStep === 0}>
              <ArrowLeft className="h-3.5 w-3.5" /> Back
            </Button>
            <Button size="sm" onClick={() => setCurrentStep(Math.min(3, currentStep + 1))} disabled={currentStep === 3}>
              Next <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </ShowcaseRow>

      <ShowcaseRow label="Sidebar Nav Items">
        <div className="w-full max-w-xs space-y-0.5">
          {navItems.map(item => (
            <div key={item.label} className={cn(
              'flex items-center gap-2.5 px-3 py-2 rounded-lg text-body-sm transition-colors cursor-pointer',
              item.active ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            )}>
              <item.icon className="h-4 w-4 shrink-0" />
              <span className="flex-1">{item.label}</span>
              {item.badge && <Badge variant="secondary" className="h-5 px-1.5 text-label-xs">{item.badge}</Badge>}
            </div>
          ))}
        </div>
      </ShowcaseRow>

      <ShowcaseRow label="Pagination">
        <div className="flex items-center gap-1.5">
          <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled>
            <ArrowLeft className="h-3.5 w-3.5" />
          </Button>
          {[1, 2, 3, '...', 8, 9, 10].map((page, i) => (
            <Button key={i} variant={page === 2 ? 'default' : 'outline'} size="sm" className="h-8 w-8 p-0 text-body-sm"
              disabled={page === '...'}>
              {page}
            </Button>
          ))}
          <Button variant="outline" size="sm" className="h-8 w-8 p-0">
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
          <span className="text-label text-muted-foreground ml-2">Page 2 of 10</span>
        </div>
      </ShowcaseRow>
    </Section>
  );
}
