/**
 * @fileoverview Stats section — animated counters showing key metrics.
 */

import { useTranslation } from 'react-i18next';
import { FadeUp, AnimatedCounter, HEADING_FONT } from './animations';

export function StatsSection() {
  const { t } = useTranslation();
  const stats = [
    { value: 41, suffix: '%', key: 'stat1' },
    { value: 2, suffix: '×', key: 'stat2' },
    { value: 1000, suffix: '+', key: 'stat3' },
    { value: 50, suffix: '%', key: 'stat4' },
  ];

  return (
    <section className="border-t border-border/30 relative overflow-hidden">
      <div className="absolute inset-0 brand-gradient-subtle" />
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8 py-16 sm:py-24 md:py-28 relative">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 max-w-[1000px] mx-auto">
          {stats.map((stat, i) => (
            <FadeUp key={stat.key} delay={i * 0.1} className="text-center">
              <p className="text-[28px] sm:text-[40px] md:text-[50px] font-extrabold brand-gradient-text mb-1.5 tracking-tight"
                style={{ fontFamily: HEADING_FONT }}>
                <AnimatedCounter value={stat.value} suffix={stat.suffix} />
              </p>
              <p className="text-[12px] sm:text-[13px] text-muted-foreground font-medium">
                {t(`landing.stats.${stat.key}.label`)}
              </p>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}
