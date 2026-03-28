/**
 * @fileoverview Landing page hero section with animated headline,
 * CTA buttons, and a mock dashboard browser frame.
 */

import { useTranslation } from 'react-i18next';
import { ArrowRight, Play, Shield, Zap, Calendar, Users, Target, Heart, Rocket, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { getAppUrl } from '@/lib/appMode';
import { HEADING_FONT } from './animations';

export function HeroSection() {
  const { t } = useTranslation();

  return (
    <section className="relative overflow-hidden">
      {/* Dot grid pattern */}
      <div className="absolute inset-0 opacity-[0.03]"
        style={{ backgroundImage: 'radial-gradient(circle, hsl(var(--foreground)) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
      {/* Animated gradient orbs */}
      <motion.div className="absolute top-[-200px] left-[-150px] w-[600px] h-[600px] rounded-full blur-[140px]"
        style={{ background: 'hsl(var(--primary) / 0.08)' }}
        animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }} />
      <motion.div className="absolute bottom-[-100px] right-[-80px] w-[400px] h-[400px] rounded-full blur-[120px]"
        style={{ background: 'hsl(var(--brand-pink) / 0.06)' }}
        animate={{ x: [0, -20, 0], y: [0, 15, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }} />
      <motion.div className="absolute top-[40%] left-[50%] w-[300px] h-[300px] rounded-full blur-[100px]"
        style={{ background: 'hsl(var(--brand-violet) / 0.05)' }}
        animate={{ scale: [1, 1.3, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }} />

      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8 pt-14 pb-10 sm:pt-24 sm:pb-14 md:pt-32 md:pb-20 relative">
        <div className="max-w-[760px] mx-auto text-center">
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="text-[30px] sm:text-[44px] md:text-[56px] lg:text-[64px] leading-[1.08] font-extrabold tracking-[-0.035em] mb-5 sm:mb-7"
            style={{ fontFamily: HEADING_FONT }}>
            {t('landing.hero.title')}<br className="hidden sm:block" />
            <span className="brand-gradient-text">{t('landing.hero.titleHighlight')}</span>
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="text-[15px] sm:text-[17px] md:text-[19px] text-muted-foreground leading-[1.75] max-w-[560px] mx-auto mb-9 sm:mb-11 px-2">
            {t('landing.hero.subtitle')}
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.55 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-5 sm:mb-6 px-4 sm:px-0">
            <a href={getAppUrl('/register')} className="w-full sm:w-auto">
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Button className="w-full sm:w-auto h-12 sm:h-[54px] px-8 sm:px-10 text-[14px] sm:text-[15px] gap-2.5 font-bold rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-xl shadow-primary/25 transition-all">
                  {t('landing.hero.cta')}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </motion.div>
            </a>
            <a href="#how-it-works" className="w-full sm:w-auto">
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Button variant="outline" className="w-full sm:w-auto h-12 sm:h-[54px] px-8 sm:px-10 text-[14px] sm:text-[15px] font-bold rounded-full border-border/60 hover:bg-accent/50 hover:border-primary/30 gap-2">
                  <Play className="h-3.5 w-3.5" />
                  {t('landing.hero.ctaSecondary')}
                </Button>
              </motion.div>
            </a>
          </motion.div>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, delay: 0.7 }}
            className="text-[12px] sm:text-[13px] text-muted-foreground/50 font-medium">
            {t('landing.hero.noCard')}
          </motion.p>
        </div>

        {/* Hero mockup — premium browser frame */}
        <motion.div initial={{ opacity: 0, y: 40, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mt-12 sm:mt-20 max-w-[960px] mx-auto">
          <motion.div className="rounded-2xl border border-border/60 bg-card shadow-2xl shadow-primary/[0.06] overflow-hidden ring-1 ring-border/10"
            whileHover={{ y: -6 }} transition={{ duration: 0.4 }}>
            {/* Browser chrome */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border/40 bg-muted/30">
              <div className="flex gap-1.5">
                <div className="h-3 w-3 rounded-full bg-destructive/50" />
                <div className="h-3 w-3 rounded-full bg-warning/50" />
                <div className="h-3 w-3 rounded-full bg-success/50" />
              </div>
              <div className="flex-1 mx-4">
                <div className="h-7 rounded-lg bg-muted/50 max-w-[280px] mx-auto flex items-center justify-center gap-2 px-3">
                  <Shield className="h-3 w-3 text-success/50" />
                  <span className="text-[11px] text-muted-foreground/40 font-medium hidden sm:inline">app.flowkyn.com/dashboard</span>
                  <span className="text-[11px] text-muted-foreground/40 font-medium sm:hidden">flowkyn.com</span>
                </div>
              </div>
            </div>
            {/* Dashboard content skeleton */}
            <div className="p-5 sm:p-7 md:p-8">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div className="sm:col-span-2 space-y-3 sm:space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Zap className="h-4 w-4 text-primary/40" />
                      </div>
                      <div>
                        <div className="h-3 w-32 rounded bg-muted/60 mb-1.5" />
                        <div className="h-2 w-20 rounded bg-muted/40" />
                      </div>
                    </div>
                    <div className="h-7 w-20 rounded-full bg-primary/10" />
                  </div>
                  <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    {[
                      { icon: Calendar, color: 'primary', label: 'Events' },
                      { icon: Users, color: 'brand-violet', label: 'Members' },
                      { icon: Target, color: 'success', label: 'Rate' },
                    ].map(({ icon: Icon, color, label }) => (
                      <div key={label} className="rounded-xl border border-border/40 p-3 sm:p-4 bg-background group hover:border-primary/20 transition-colors">
                        <div className="flex items-center gap-1.5 mb-2.5">
                          <div className="h-5 w-5 rounded-md flex items-center justify-center" style={{ background: `hsl(var(--${color}) / 0.12)` }}>
                            <Icon className="h-2.5 w-2.5" style={{ color: `hsl(var(--${color}))` }} />
                          </div>
                          <div className="h-2 w-10 rounded bg-muted-foreground/8" />
                        </div>
                        <div className="h-6 w-14 rounded-lg" style={{ background: `hsl(var(--${color}) / 0.08)` }} />
                      </div>
                    ))}
                  </div>
                  <div className="rounded-xl border border-border/40 p-3 sm:p-4 bg-background h-[80px] sm:h-[130px] flex items-end gap-1 sm:gap-1.5">
                    {[40, 65, 45, 80, 55, 70, 90, 60, 75, 85, 50, 95].map((h, i) => (
                      <motion.div key={i} className="flex-1 rounded-t-sm"
                        style={{ background: `hsl(var(--primary) / ${0.15 + (h / 100) * 0.4})` }}
                        initial={{ height: 0 }} whileInView={{ height: `${h}%` }} viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.8 + i * 0.04, ease: [0.22, 1, 0.36, 1] }} />
                    ))}
                  </div>
                </div>
                <div className="space-y-3 hidden sm:block">
                  <div className="rounded-xl border border-border/40 p-4 bg-background">
                    <div className="flex items-center gap-2 mb-4">
                      <Heart className="h-3.5 w-3.5 text-brand-pink/50" />
                      <div className="h-3 w-20 rounded bg-muted-foreground/8" />
                    </div>
                    {[1, 2, 3, 4].map(n => (
                      <div key={n} className="flex items-center gap-2 mb-3 last:mb-0">
                        <div className="h-7 w-7 rounded-full shrink-0" style={{ background: `hsl(var(--primary) / ${0.08 + n * 0.03})` }} />
                        <div className="flex-1 space-y-1">
                          <div className="h-2 w-full rounded bg-muted/60" />
                          <div className="h-1.5 w-2/3 rounded bg-muted/40" />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-xl border border-border/40 p-4 bg-background">
                    <div className="flex items-center gap-2 mb-3">
                      <Rocket className="h-3.5 w-3.5 text-primary/40" />
                      <div className="h-3 w-16 rounded bg-muted-foreground/8" />
                    </div>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map(n => (
                        <Star key={n} className="h-3.5 w-3.5 text-primary/50 fill-primary/50" />
                      ))}
                    </div>
                    <div className="h-2 w-full rounded bg-muted/50 mt-3" />
                    <div className="h-2 w-3/4 rounded bg-muted/40 mt-1.5" />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
