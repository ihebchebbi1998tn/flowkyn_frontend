/**
 * @fileoverview Testimonials section — horizontal scrollable cards on mobile,
 * three-column grid on desktop.
 */

import { useTranslation } from 'react-i18next';
import { Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { FadeUp, ScaleIn, HEADING_FONT } from './animations';

export function TestimonialsSection() {
  const { t } = useTranslation();
  const testimonials = t('landing.testimonials.items', { returnObjects: true }) as { quote: string; author: string; role: string }[];

  return (
    <section className="border-t border-border/30 bg-muted/20">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8 py-16 sm:py-24 md:py-32">
        <FadeUp className="text-center mb-12 sm:mb-16">
          <span className="text-[11px] sm:text-[12px] uppercase tracking-[0.12em] font-semibold text-primary mb-4 block">
            {t('landing.testimonials.sectionLabel')}
          </span>
          <h2 className="text-[26px] sm:text-[34px] md:text-[44px] font-extrabold tracking-[-0.025em]" style={{ fontFamily: HEADING_FONT }}>
            {t('landing.testimonials.title')}
          </h2>
        </FadeUp>

        <div className="md:grid md:gap-5 md:grid-cols-3 max-w-[1000px] mx-auto">
          <div className="flex md:contents gap-4 overflow-x-auto pb-4 md:pb-0 snap-x snap-mandatory -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
            {testimonials.map((item, i) => (
              <ScaleIn key={i} delay={i * 0.12}>
                <motion.div className="rounded-2xl border border-border/50 bg-card p-6 sm:p-8 flex flex-col min-w-[280px] sm:min-w-[300px] md:min-w-0 snap-center shrink-0 md:shrink hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300"
                  whileHover={{ y: -6 }} transition={{ duration: 0.3 }}>
                  <div className="flex gap-0.5 mb-5">
                    {[1, 2, 3, 4, 5].map(n => (
                      <Star key={n} className="h-4 w-4 text-primary fill-primary" />
                    ))}
                  </div>
                  <p className="text-[14px] sm:text-[15px] text-foreground leading-[1.8] flex-1 mb-6 font-medium italic">
                    "{item.quote}"
                  </p>
                  <div className="flex items-center gap-3 pt-5 border-t border-border/30">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/10 text-primary text-[12px] font-bold">
                        {item.author.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-[13px] font-semibold text-foreground">{item.author}</p>
                      <p className="text-[11px] text-muted-foreground">{item.role}</p>
                    </div>
                  </div>
                </motion.div>
              </ScaleIn>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
