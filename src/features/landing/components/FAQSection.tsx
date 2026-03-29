/**
 * @fileoverview FAQ accordion section with animated expand/collapse.
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Minus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { FadeUp, HEADING_FONT } from './animations';

export function FAQSection() {
  const { t } = useTranslation();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const faqItems = t('landing.faq.items', { returnObjects: true }) as { question: string; answer: string }[];

  return (
    <section id="faq" className="border-t border-border/30">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8 py-16 sm:py-24 md:py-32">
        <FadeUp className="text-center mb-12 sm:mb-16">
          <span className="text-[11px] sm:text-[12px] uppercase tracking-[0.12em] font-semibold text-primary mb-4 block">
            {t('landing.faq.sectionLabel')}
          </span>
          <h2 className="text-[26px] sm:text-[34px] md:text-[44px] font-extrabold tracking-[-0.025em]" style={{ fontFamily: HEADING_FONT }}>
            {t('landing.faq.title')}
          </h2>
        </FadeUp>

        <div className="max-w-[720px] mx-auto space-y-3">
          {faqItems.map((item, i) => (
            <FadeUp key={i} delay={i * 0.06}>
              <div className={cn(
                "rounded-xl border transition-all duration-200",
                openFaq === i ? 'border-primary/25 bg-primary/[0.02] shadow-sm' : 'border-border/50 bg-card hover:border-primary/15'
              )}>
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="flex items-center justify-between gap-4 w-full text-left px-5 sm:px-6 py-4 sm:py-5">
                  <span className={cn("text-[14px] sm:text-[15px] font-semibold leading-snug transition-colors",
                    openFaq === i ? 'text-primary' : 'text-foreground'
                  )}>{item.question}</span>
                  <motion.div className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors",
                    openFaq === i ? 'bg-primary/15' : 'bg-muted/60'
                  )} animate={{ rotate: openFaq === i ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    {openFaq === i
                      ? <Minus className="h-3.5 w-3.5 text-primary" />
                      : <Plus className="h-3.5 w-3.5 text-muted-foreground" />}
                  </motion.div>
                </button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25, ease: 'easeInOut' }}
                      className="overflow-hidden">
                      <div className="px-5 sm:px-6 pb-5">
                        <p className="text-[14px] text-muted-foreground leading-[1.8]">{item.answer}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}
