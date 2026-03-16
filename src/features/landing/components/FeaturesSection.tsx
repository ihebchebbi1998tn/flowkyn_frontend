/**
 * @fileoverview Features section — alternating left/right feature cards
 * with animated mockup previews and accent-colored icons.
 */

import { useTranslation } from 'react-i18next';
import { Users, Globe, BarChart3, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { FadeUp, SlideIn, HEADING_FONT } from './animations';

const FEATURE_ICONS = [Users, Globe, BarChart3, Calendar] as const;
const FEATURE_KEYS = ['activities', 'liveAsync', 'analytics', 'management'] as const;
const FEATURE_ACCENT_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--brand-violet))',
  'hsl(var(--success))',
  'hsl(var(--brand-pink))',
];

export function FeaturesSection() {
  const { t } = useTranslation();

  return (
    <section id="features" className="border-t border-border/30 bg-muted/20 relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.02]"
        style={{ backgroundImage: 'radial-gradient(circle, hsl(var(--foreground)) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8 py-16 sm:py-24 md:py-32 relative">
        <FadeUp className="text-center mb-14 sm:mb-20">
          <span className="text-[11px] sm:text-[12px] uppercase tracking-[0.12em] font-semibold text-primary mb-4 block">
            {t('landing.features.sectionLabel')}
          </span>
          <h2 className="text-[26px] sm:text-[34px] md:text-[44px] font-extrabold tracking-[-0.025em] mb-3" style={{ fontFamily: HEADING_FONT }}>
            {t('landing.features.title')}{' '}
            <span className="brand-gradient-text">{t('landing.features.titleHighlight')}</span>
          </h2>
          <p className="text-[15px] sm:text-[17px] text-muted-foreground max-w-[520px] mx-auto leading-relaxed">
            {t('landing.features.subtitle')}
          </p>
        </FadeUp>

        <div className="space-y-16 sm:space-y-24 md:space-y-32">
          {FEATURE_KEYS.map((key, i) => {
            const Icon = FEATURE_ICONS[i];
            const accentColor = FEATURE_ACCENT_COLORS[i];
            const isReversed = i % 2 !== 0;
            return (
              <div key={key} className={cn("grid gap-8 sm:gap-10 md:gap-16 items-center md:grid-cols-2", isReversed && "md:[direction:rtl]")}>
                <SlideIn from={isReversed ? 'right' : 'left'} className="md:[direction:ltr]">
                  <motion.div className="rounded-2xl border border-border/40 bg-card aspect-[4/3] sm:aspect-[16/11] flex items-center justify-center relative overflow-hidden group"
                    whileHover={{ scale: 1.02 }} transition={{ duration: 0.3 }}>
                    <div className="absolute inset-0 opacity-[0.04] group-hover:opacity-[0.08] transition-opacity duration-500"
                      style={{ background: `radial-gradient(ellipse at center, ${accentColor}, transparent 70%)` }} />
                    <div className="relative w-[80%] max-w-[320px]">
                      <div className="rounded-xl border border-border/50 bg-background shadow-lg p-4 sm:p-5 space-y-3">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: `${accentColor}15` }}>
                            <Icon className="h-4 w-4" style={{ color: accentColor }} />
                          </div>
                          <div>
                            <div className="h-3 w-24 rounded bg-muted/60" />
                            <div className="h-2 w-16 rounded bg-muted/40 mt-1" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="h-2.5 w-full rounded bg-muted/50" />
                          <div className="h-2.5 w-4/5 rounded bg-muted/40" />
                          <div className="h-2.5 w-3/5 rounded bg-muted/30" />
                        </div>
                        <div className="flex gap-2 pt-1">
                          <div className="h-8 flex-1 rounded-lg" style={{ background: `${accentColor}18` }} />
                          <div className="h-8 flex-1 rounded-lg bg-muted/40" />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </SlideIn>
                <SlideIn from={isReversed ? 'left' : 'right'} className="md:[direction:ltr] max-w-[480px]">
                  <span className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.08em] mb-5"
                    style={{ background: `${accentColor}10`, color: accentColor }}>
                    <Icon className="h-3 w-3" />
                    {t(`landing.features.${key}.label`)}
                  </span>
                  <h3 className="text-[22px] sm:text-[26px] md:text-[30px] font-bold tracking-[-0.015em] mb-4 leading-[1.2]" style={{ fontFamily: HEADING_FONT }}>
                    {t(`landing.features.${key}.title`)}
                  </h3>
                  <p className="text-[15px] text-muted-foreground leading-[1.8]">
                    {t(`landing.features.${key}.description`)}
                  </p>
                </SlideIn>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
