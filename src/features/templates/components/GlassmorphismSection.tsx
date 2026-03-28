import { motion } from 'framer-motion';
import { Zap, BarChart3, Users, Shield, ArrowUpRight, Sparkles, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Section, ShowcaseGrid } from './Primitives';

export function GlassmorphismSection() {
  return (
    <Section id="glassmorphism" title="Glassmorphism & Depth" description="Frosted glass, layered backgrounds, floating elements, and depth effects.">

      {/* Glass cards on gradient background */}
      <div className="rounded-2xl overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-accent/10 to-info/15" />
        <div className="absolute top-8 left-8 h-32 w-32 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute bottom-8 right-12 h-24 w-24 rounded-full bg-info/20 blur-2xl" />

        <div className="relative p-6 sm:p-8">
          <p className="text-label uppercase text-foreground/60 mb-5">Glass Card Variants</p>

          <div className="grid gap-4 sm:grid-cols-3">
            {/* Glass stat card */}
            <motion.div whileHover={{ y: -4, scale: 1.02 }} transition={{ type: 'spring', stiffness: 300 }}
              className="rounded-2xl border border-white/15 bg-card/60 backdrop-blur-xl p-5 shadow-elevated">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-xl bg-primary/15 border border-primary/20 flex items-center justify-center backdrop-blur-sm">
                  <Zap className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-label text-muted-foreground">Active Sessions</p>
                  <p className="text-xl font-bold text-foreground">2,847</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-success">
                <ArrowUpRight className="h-3 w-3" />
                <span className="text-label font-semibold">+12.5%</span>
                <span className="text-label text-muted-foreground ml-1">vs last week</span>
              </div>
            </motion.div>

            {/* Glass user card */}
            <motion.div whileHover={{ y: -4, scale: 1.02 }} transition={{ type: 'spring', stiffness: 300 }}
              className="rounded-2xl border border-white/15 bg-card/60 backdrop-blur-xl p-5 shadow-elevated">
              <div className="flex items-center gap-3 mb-4">
                <Avatar className="h-10 w-10 border-2 border-white/20">
                  <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground font-semibold text-sm">JD</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-body-sm font-semibold text-foreground">Jane Doe</p>
                  <p className="text-label text-muted-foreground">Product Manager</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Badge className="bg-primary/10 text-primary border-primary/20 backdrop-blur-sm">Pro Plan</Badge>
                <Badge variant="outline" className="border-white/20 backdrop-blur-sm">Team Lead</Badge>
              </div>
            </motion.div>

            {/* Glass feature card */}
            <motion.div whileHover={{ y: -4, scale: 1.02 }} transition={{ type: 'spring', stiffness: 300 }}
              className="rounded-2xl border border-white/15 bg-card/60 backdrop-blur-xl p-5 shadow-elevated">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-warning/20 to-warning/5 border border-warning/20 flex items-center justify-center mb-3">
                <Shield className="h-5 w-5 text-warning" />
              </div>
              <h4 className="text-body-sm font-semibold text-foreground mb-1">Enterprise Security</h4>
              <p className="text-label text-muted-foreground leading-relaxed">SOC 2 compliant with end-to-end encryption and role-based access control.</p>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Floating elements */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden relative">
        <p className="text-label uppercase text-muted-foreground px-6 pt-5 mb-4">Floating & Layered Elements</p>
        <div className="relative h-64 mx-6 mb-6">
          {/* Background circles */}
          <div className="absolute top-4 left-4 h-20 w-20 rounded-full bg-primary/8 border border-primary/10" />
          <div className="absolute bottom-8 right-8 h-16 w-16 rounded-full bg-info/8 border border-info/10" />
          <div className="absolute top-12 right-16 h-12 w-12 rounded-full bg-warning/8 border border-warning/10" />

          {/* Floating card 1 */}
          <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute top-4 left-12 sm:left-24 rounded-xl border border-border bg-card shadow-elevated p-3 flex items-center gap-2.5 z-10">
            <div className="h-8 w-8 rounded-lg bg-success/10 flex items-center justify-center">
              <BarChart3 className="h-4 w-4 text-success" />
            </div>
            <div>
              <p className="text-caption font-semibold text-foreground">Revenue</p>
              <p className="text-label text-success">+24.5%</p>
            </div>
          </motion.div>

          {/* Floating card 2 */}
          <motion.div animate={{ y: [0, 6, 0] }} transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
            className="absolute top-20 right-4 sm:right-16 rounded-xl border border-border bg-card shadow-elevated p-3 flex items-center gap-2.5 z-10">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-caption font-semibold text-foreground">Users</p>
              <p className="text-label text-primary">1,248 active</p>
            </div>
          </motion.div>

          {/* Floating badge */}
          <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
            className="absolute bottom-8 left-8 sm:left-32 z-10">
            <Badge className="bg-card border border-border shadow-card-hover text-foreground gap-1.5 px-3 py-1.5">
              <Sparkles className="h-3 w-3 text-warning" /> AI-Powered
            </Badge>
          </motion.div>

          {/* Center CTA */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button variant="brand" size="xl" className="gap-2 shadow-lg shadow-primary/25">
                <Globe className="h-4 w-4" /> Explore Platform
              </Button>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Gradient borders */}
      <ShowcaseGrid label="Gradient Border Cards" cols={3}>
        {[
          { title: 'Primary Glow', from: 'from-primary', to: 'to-accent', icon: Zap },
          { title: 'Success Glow', from: 'from-success', to: 'to-info', icon: BarChart3 },
          { title: 'Warning Glow', from: 'from-warning', to: 'to-destructive', icon: Shield },
        ].map(card => (
          <div key={card.title} className="relative group">
            <div className={`absolute -inset-px rounded-xl bg-gradient-to-br ${card.from} ${card.to} opacity-20 group-hover:opacity-40 transition-opacity blur-sm`} />
            <div className={`absolute -inset-px rounded-xl bg-gradient-to-br ${card.from} ${card.to} opacity-30 group-hover:opacity-60 transition-opacity`} />
            <div className="relative rounded-xl bg-card p-5">
              <card.icon className="h-5 w-5 text-foreground mb-3" />
              <h4 className="text-body-sm font-semibold text-foreground mb-1">{card.title}</h4>
              <p className="text-label text-muted-foreground">Gradient border with glow effect on hover.</p>
            </div>
          </div>
        ))}
      </ShowcaseGrid>
    </Section>
  );
}
