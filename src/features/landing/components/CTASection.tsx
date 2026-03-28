/**
 * @fileoverview Final call-to-action section with gradient background.
 */

import { useTranslation } from 'react-i18next';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { getAppUrl } from '@/lib/appMode';
import { FadeUp, HEADING_FONT } from './animations';

export function CTASection() {
  const { t } = useTranslation();

  return (
    <section className="border-t border-border/30 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.04] via-transparent to-brand-pink/[0.03]" />
      <div className="absolute inset-0 opacity-[0.02]"
        style={{ backgroundImage: 'radial-gradient(circle, hsl(var(--foreground)) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8 py-20 sm:py-28 md:py-36 relative">
        <div className="max-w-[640px] mx-auto text-center">
          <FadeUp>
            <h2 className="text-[26px] sm:text-[36px] md:text-[48px] font-extrabold tracking-[-0.03em] mb-4 leading-[1.1]" style={{ fontFamily: HEADING_FONT }}>
              {t('landing.cta.title')}{' '}
              <span className="brand-gradient-text">{t('landing.cta.titleHighlight')}</span>
            </h2>
          </FadeUp>
          <FadeUp delay={0.1}>
            <p className="text-[15px] sm:text-[17px] text-muted-foreground leading-[1.7] max-w-[480px] mx-auto mb-8 sm:mb-10">
              {t('landing.cta.subtitle')}
            </p>
          </FadeUp>
          <FadeUp delay={0.2}>
            <a href={getAppUrl('/register')}>
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                <Button className="h-13 sm:h-14 px-10 sm:px-12 text-[15px] sm:text-[16px] gap-2.5 font-bold rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-2xl shadow-primary/30 transition-all">
                  {t('landing.cta.button')}
                  <ArrowRight className="h-4.5 w-4.5" />
                </Button>
              </motion.div>
            </a>
            <p className="text-[12px] sm:text-[13px] text-muted-foreground/50 mt-4 font-medium">
              {t('landing.cta.noCard')}
            </p>
          </FadeUp>
        </div>
      </div>
    </section>
  );
}
