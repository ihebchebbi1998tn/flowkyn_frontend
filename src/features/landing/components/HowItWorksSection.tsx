/**
 * @fileoverview How It Works section — three-step process with
 * numbered cards and a connecting gradient line.
 */

import { useTranslation } from 'react-i18next';
import { Rocket, Sparkles, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';
import { FadeUp, ScaleIn, HEADING_FONT } from './animations';

export function HowItWorksSection() {
  const { t } = useTranslation();
  const stepIcons = [Rocket, Sparkles, BarChart3];

  return (
    <section id="how-it-works" className="border-t border-border/30">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8 py-16 sm:py-24 md:py-32">
        <FadeUp className="text-center mb-12 sm:mb-16">
          <span className="text-[11px] sm:text-[12px] uppercase tracking-[0.12em] font-semibold text-primary mb-4 block">
            {t('landing.howItWorks.sectionLabel')}
          </span>
          <h2 className="text-[26px] sm:text-[34px] md:text-[44px] font-extrabold tracking-[-0.025em]" style={{ fontFamily: HEADING_FONT }}>
            {t('landing.howItWorks.title')}{' '}
            <span className="brand-gradient-text">{t('landing.howItWorks.titleHighlight')}</span>
          </h2>
          <p className="text-[15px] sm:text-[17px] text-muted-foreground max-w-[480px] mx-auto mt-3 leading-relaxed">
            {t('landing.howItWorks.subtitle')}
          </p>
        </FadeUp>

        <div className="grid gap-5 sm:gap-6 md:grid-cols-3 max-w-[1000px] mx-auto relative">
          <div className="hidden md:block absolute top-[60px] left-[16.67%] right-[16.67%] h-[2px]">
            <div className="h-full bg-gradient-to-r from-primary/10 via-primary/30 to-primary/10 rounded-full" />
          </div>
          {(['step1', 'step2', 'step3'] as const).map((step, i) => {
            const StepIcon = stepIcons[i];
            return (
              <ScaleIn key={step} delay={i * 0.15}>
                <motion.div className="relative rounded-2xl border border-border/50 bg-card p-6 sm:p-8 text-center group hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300"
                  whileHover={{ y: -8 }} transition={{ duration: 0.3 }}>
                  <div className="inline-flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl mb-5 bg-primary text-primary-foreground group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-primary/30 transition-all duration-300">
                    <StepIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                  </div>
                  <div className="absolute -top-2.5 -right-2.5 h-7 w-7 rounded-full bg-background border-2 border-primary/30 flex items-center justify-center">
                    <span className="text-[11px] font-bold text-primary">{i + 1}</span>
                  </div>
                  <h3 className="text-[16px] sm:text-[17px] font-bold mb-2.5" style={{ fontFamily: HEADING_FONT }}>
                    {t(`landing.howItWorks.${step}.title`)}
                  </h3>
                  <p className="text-[14px] text-muted-foreground leading-[1.7]">
                    {t(`landing.howItWorks.${step}.description`)}
                  </p>
                </motion.div>
              </ScaleIn>
            );
          })}
        </div>
      </div>
    </section>
  );
}
