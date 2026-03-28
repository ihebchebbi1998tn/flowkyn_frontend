/**
 * @fileoverview Templates Page — complete design system reference.
 * 21 sections covering every component and pattern in the Flowkyn design system.
 */

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import {
  Palette, Type, MousePointer, TextCursor, Tag, LayoutGrid,
  UserCircle, Table2, MessageSquare, Layers, Loader2, Ruler, BarChart3,
  Sparkles, Box, Activity, MousePointerClick, Navigation, FormInput,
  Signal, PanelLeft, BookOpen,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

import { ColorsSection } from '../components/ColorsSection';
import { TypographySection } from '../components/TypographySection';
import { SpacingSection } from '../components/SpacingSection';
import { ButtonsSection } from '../components/ButtonsSection';
import { InputsSection } from '../components/InputsSection';
import { BadgesSection } from '../components/BadgesSection';
import { CardsSection } from '../components/CardsSection';
import { AvatarsSection } from '../components/AvatarsSection';
import { TablesSection } from '../components/TablesSection';
import { ChartsSection } from '../components/ChartsSection';
import { AnimationsSection } from '../components/AnimationsSection';
import { GlassmorphismSection } from '../components/GlassmorphismSection';
import { DataWidgetsSection } from '../components/DataWidgetsSection';
import { InteractiveSection } from '../components/InteractiveSection';
import { FeedbackSection } from '../components/FeedbackSection';
import { OverlaysSection } from '../components/OverlaysSection';
import { SkeletonsSection } from '../components/SkeletonsSection';
import { NavigationSection } from '../components/NavigationSection';
import { FormsSection } from '../components/FormsSection';
import { StatusSection } from '../components/StatusSection';
import { PageLayoutsSection } from '../components/PageLayoutsSection';

const NAV_GROUPS = [
  {
    label: 'Foundation',
    items: [
      { id: 'colors', label: 'Colors', icon: Palette },
      { id: 'typography', label: 'Typography', icon: Type },
      { id: 'spacing', label: 'Spacing', icon: Ruler },
    ],
  },
  {
    label: 'Components',
    items: [
      { id: 'buttons', label: 'Buttons', icon: MousePointer },
      { id: 'inputs', label: 'Inputs', icon: TextCursor },
      { id: 'badges', label: 'Badges', icon: Tag },
      { id: 'cards', label: 'Cards', icon: LayoutGrid },
      { id: 'avatars', label: 'Avatars', icon: UserCircle, badge: '25+' },
      { id: 'tables', label: 'Tables', icon: Table2 },
      { id: 'charts', label: 'Charts', icon: BarChart3 },
    ],
  },
  {
    label: 'Patterns',
    items: [
      { id: 'navigation', label: 'Navigation', icon: Navigation, isNew: true },
      { id: 'forms', label: 'Forms', icon: FormInput, isNew: true },
      { id: 'status', label: 'Status', icon: Signal, isNew: true },
      { id: 'page-layouts', label: 'Page Layouts', icon: PanelLeft, isNew: true },
      { id: 'interactive', label: 'Interactive', icon: MousePointerClick },
      { id: 'feedback', label: 'Feedback', icon: MessageSquare },
      { id: 'overlays', label: 'Overlays', icon: Layers },
    ],
  },
  {
    label: 'Effects',
    items: [
      { id: 'animations', label: 'Animations', icon: Sparkles },
      { id: 'glassmorphism', label: 'Glass & Depth', icon: Box },
      { id: 'data-widgets', label: 'Data Widgets', icon: Activity },
      { id: 'skeletons', label: 'Skeletons', icon: Loader2 },
    ],
  },
];

const ALL_NAV = NAV_GROUPS.flatMap(g => g.items);

export default function TemplatesPage() {
  const [activeSection, setActiveSection] = useState('colors');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter(e => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) setActiveSection(visible[0].target.id);
      },
      { rootMargin: '-80px 0px -60% 0px', threshold: 0.1 }
    );

    ALL_NAV.forEach(item => {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur-xl">
        <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl brand-gradient flex items-center justify-center">
              <BookOpen className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-section-title text-foreground leading-tight">Design System</h1>
              <p className="text-label text-muted-foreground">
                {ALL_NAV.length} sections · Flowkyn component library
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-label border-primary/20 text-primary bg-primary/5">
              v2.0
            </Badge>
            <Badge variant="secondary" className="text-label gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
              {ALL_NAV.filter(i => (i as any).isNew).length} new
            </Badge>
          </div>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto flex">
        {/* Sidebar Navigation */}
        <nav className="hidden lg:block w-56 shrink-0 sticky top-[73px] self-start h-[calc(100vh-73px)] overflow-y-auto border-r border-border py-4 px-3 scrollbar-hide">
          {NAV_GROUPS.map(group => (
            <div key={group.label} className="mb-4">
              <p className="text-label-xs uppercase text-muted-foreground/60 tracking-widest px-3 mb-1.5 font-semibold">{group.label}</p>
              <div className="space-y-0.5">
                {group.items.map(item => (
                  <button
                    key={item.id}
                    onClick={() => scrollTo(item.id)}
                    className={cn(
                      'flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-body-sm transition-all duration-200',
                      activeSection === item.id
                        ? 'bg-primary/10 text-primary font-medium shadow-sm'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    )}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    <span className="flex-1 text-left">{item.label}</span>
                    {(item as any).isNew && (
                      <span className="text-[9px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">NEW</span>
                    )}
                    {(item as any).badge && (
                      <span className="text-label-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-md">{(item as any).badge}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Content */}
        <main className="flex-1 min-w-0 px-6 lg:px-10 py-8 space-y-16">
          {/* Foundation */}
          <ColorsSection />
          <TypographySection />
          <SpacingSection />

          {/* Components */}
          <ButtonsSection />
          <InputsSection />
          <BadgesSection />
          <CardsSection />
          <AvatarsSection />
          <TablesSection />
          <ChartsSection />

          {/* Patterns — NEW */}
          <NavigationSection />
          <FormsSection />
          <StatusSection />
          <PageLayoutsSection />
          <InteractiveSection />
          <FeedbackSection />
          <OverlaysSection />

          {/* Effects */}
          <AnimationsSection />
          <GlassmorphismSection />
          <DataWidgetsSection />
          <SkeletonsSection />
        </main>
      </div>
    </div>
  );
}
