/**
 * @fileoverview Problem section — highlights the pain points Flowkyn solves.
 * Two-column layout: symptoms (left) and business impact (right).
 */

import { useTranslation } from 'react-i18next';
import { AlertTriangle, TrendingDown } from 'lucide-react';
import { FadeUp, ScaleIn, HEADING_FONT } from './animations';

export function ProblemSection() {
  const { t } = useTranslation();
  const symptoms = t('landing.problem.symptoms.items', { returnObjects: true }) as string[];
  const impacts = t('landing.problem.impact.items', { returnObjects: true }) as string[];

  return (
    <section className="border-t border-border/30">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8 py-16 sm:py-24 md:py-32">
        <FadeUp className="text-center mb-12 sm:mb-16">
          <span className="inline-flex items-center gap-2 text-[11px] sm:text-[12px] uppercase tracking-[0.12em] font-semibold text-primary mb-4">
            <AlertTriangle className="h-3.5 w-3.5" />
            {t('landing.problem.sectionLabel')}
          </span>
          <h2 className="text-[26px] sm:text-[34px] md:text-[44px] font-extrabold tracking-[-0.025em] mb-3" style={{ fontFamily: HEADING_FONT }}>
            {t('landing.problem.title')}
          </h2>
          <p className="text-[15px] sm:text-[17px] text-muted-foreground max-w-[500px] mx-auto leading-relaxed">
            {t('landing.problem.subtitle')}
          </p>
        </FadeUp>

        <div className="grid gap-4 sm:gap-6 md:grid-cols-2 max-w-[900px] mx-auto">
          <ScaleIn delay={0.1}>
            <div className="rounded-2xl border border-border/50 bg-card p-6 sm:p-8 hover:border-primary/20 transition-all duration-300 group">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
                  <AlertTriangle className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-[17px] font-bold" style={{ fontFamily: HEADING_FONT }}>{t('landing.problem.symptoms.title')}</h3>
              </div>
              <ul className="space-y-3.5">
                {symptoms.map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-[14px] text-muted-foreground leading-relaxed">
                    <span className="mt-[7px] h-1.5 w-1.5 rounded-full bg-primary/50 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </ScaleIn>
          <ScaleIn delay={0.2}>
            <div className="rounded-2xl border border-border/50 bg-card p-6 sm:p-8 hover:border-primary/20 transition-all duration-300 group">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-11 w-11 rounded-xl bg-destructive/10 flex items-center justify-center group-hover:bg-destructive/15 transition-colors">
                  <TrendingDown className="h-5 w-5 text-destructive" />
                </div>
                <h3 className="text-[17px] font-bold" style={{ fontFamily: HEADING_FONT }}>{t('landing.problem.impact.title')}</h3>
              </div>
              <ul className="space-y-3.5">
                {impacts.map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-[14px] text-muted-foreground leading-relaxed">
                    <span className="mt-[7px] h-1.5 w-1.5 rounded-full bg-destructive/50 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </ScaleIn>
        </div>

        <FadeUp delay={0.3} className="mt-8 sm:mt-12">
          <div className="max-w-[700px] mx-auto rounded-xl border border-primary/15 bg-primary/[0.03] px-6 py-4 text-center">
            <p className="text-[14px] sm:text-[15px] text-muted-foreground leading-relaxed font-medium">
              {t('landing.problem.punchline')}
            </p>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}
