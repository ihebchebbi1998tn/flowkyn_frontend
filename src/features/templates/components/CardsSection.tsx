import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Play, BarChart3, Layers, TrendingUp, Calendar } from 'lucide-react';
import { StatCard } from '@/components/cards/StatCard';
import { DashStat, ChartCard, InfoCard, EmptyState, RankedItem } from '@/features/app/components/dashboard';
import { Section, ShowcaseGrid } from './Primitives';

export function CardsSection() {
  return (
    <Section id="cards" title="Cards & Containers" description="Card primitives and composite card patterns used across the app.">
      <ShowcaseGrid label="Base Card Variants" cols={3}>
        <Card>
          <CardHeader>
            <CardTitle>Default Card</CardTitle>
            <CardDescription>Basic card with header, content, and footer.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-body-sm text-muted-foreground">Card body content goes here.</p>
          </CardContent>
          <CardFooter>
            <Button size="sm">Action</Button>
          </CardFooter>
        </Card>

        <Card className="hover:shadow-card-hover transition-shadow cursor-pointer">
          <CardHeader>
            <CardTitle>Interactive Card</CardTitle>
            <CardDescription>Hover for elevated shadow.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Badge variant="success">Active</Badge>
              <Badge variant="outline">Sync</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-elevated">
          <CardHeader>
            <CardTitle>Elevated Card</CardTitle>
            <CardDescription>Uses shadow-elevated for emphasis.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-body-sm text-muted-foreground">This card draws more attention.</p>
          </CardContent>
        </Card>
      </ShowcaseGrid>

      <ShowcaseGrid label="Stat Cards" cols={4}>
        <StatCard title="Active Sessions" value={12} change={8} icon={<Play className="h-4 w-4" />} gradient="primary" />
        <StatCard title="Team Members" value={48} change={-2} icon={<Users className="h-4 w-4" />} gradient="info" />
        <StatCard title="Activities Run" value={156} change={24} icon={<Layers className="h-4 w-4" />} gradient="success" />
        <StatCard title="Engagement" value="87%" change={5} icon={<BarChart3 className="h-4 w-4" />} gradient="warning" />
      </ShowcaseGrid>

      <ShowcaseGrid label="Dashboard Stat Cards" cols={4}>
        <DashStat label="Sessions" value={42} icon={Play} gradient="primary" trend={12} change="+8 this week" />
        <DashStat label="Members" value={128} icon={Users} gradient="info" trend={-3} />
        <DashStat label="Events" value={18} icon={Calendar} gradient="success" />
        <DashStat label="Growth" value="23%" icon={TrendingUp} gradient="warning" trend={23} />
      </ShowcaseGrid>

      <ShowcaseGrid label="Chart Card & Info Card" cols={2}>
        <ChartCard title="Session Trend" subtitle="Last 6 months" action={<Button variant="ghost" size="sm" className="h-7 text-label">View All</Button>}>
          <div className="h-32 flex items-center justify-center text-muted-foreground text-body-sm">
            Chart content placeholder
          </div>
        </ChartCard>
        <InfoCard title="Event Configuration">
          <div className="space-y-2 text-body-sm text-muted-foreground">
            <p>Format: Synchronous</p>
            <p>Duration: 30 minutes</p>
            <p>Max Participants: 20</p>
          </div>
        </InfoCard>
      </ShowcaseGrid>

      <ShowcaseGrid label="Empty State" cols={2}>
        <EmptyState icon={BarChart3} message="No analytics data" description="Start running team activities to see engagement analytics here." action={<Button size="sm">Get Started</Button>} />
        <EmptyState icon={Calendar} message="No upcoming events" description="Create your first event to get started." />
      </ShowcaseGrid>

      <div className="rounded-lg border border-border bg-card p-5">
        <p className="text-label uppercase text-muted-foreground mb-4">Ranked List Items</p>
        <div className="space-y-1">
          <RankedItem rank={1} icon={<BarChart3 className="h-3.5 w-3.5 text-primary" />} title="Two Truths & a Lie" subtitle="45 participants · 12 sessions" right={<span className="text-body-sm font-semibold text-foreground">130</span>} />
          <RankedItem rank={2} icon={<BarChart3 className="h-3.5 w-3.5 text-primary" />} title="Coffee Roulette" subtitle="38 participants · 8 sessions" right={<span className="text-body-sm font-semibold text-foreground">98</span>} />
          <RankedItem rank={3} icon={<BarChart3 className="h-3.5 w-3.5 text-primary" />} title="Wins of the Week" subtitle="52 participants · 15 sessions" right={<span className="text-body-sm font-semibold text-foreground">87</span>} />
        </div>
      </div>
    </Section>
  );
}
