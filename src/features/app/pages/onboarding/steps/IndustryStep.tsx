/**
 * @fileoverview Onboarding Step 1 — Industry & Company Size
 *
 * Lets users select their industry and company size from visual grids.
 * Both selections are required to proceed.
 */

import { useTranslation } from 'react-i18next';
import { Check, Zap, Heart, GraduationCap, BarChart3, Briefcase, Rocket, Shield, Building2, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { OnboardingData } from '../types';

const INDUSTRY_ICONS: Record<string, React.ElementType> = {
  technology: Zap, healthcare: Heart, education: GraduationCap,
  finance: BarChart3, consulting: Briefcase, startup: Rocket,
  nonprofit: Shield, other: Building2,
};

const INDUSTRY_KEYS = ['technology', 'healthcare', 'education', 'finance', 'consulting', 'startup', 'nonprofit', 'other'];
const SIZE_KEYS = ['1-10', '11-50', '51-200', '201-500', '500+'];

interface IndustryStepProps {
  data: OnboardingData;
  onChange: (partial: Partial<OnboardingData>) => void;
}

export function IndustryStep({ data, onChange }: IndustryStepProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-8">
      {/* Industry */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-foreground">{t('onboarding.industry')}</label>
          {data.industry && (
            <span className="text-xs text-primary font-medium flex items-center gap-1">
              <Check className="h-3 w-3" /> {t(`onboarding.industries.${data.industry}`)}
            </span>
          )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {INDUSTRY_KEYS.map((key) => {
            const Icon = INDUSTRY_ICONS[key];
            const selected = data.industry === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => onChange({ industry: key })}
                className={cn(
                  "group relative flex flex-col items-center gap-2.5 p-4 rounded-xl border transition-all duration-200",
                  selected
                    ? 'border-primary bg-primary/[0.06] ring-1 ring-primary/20'
                    : 'border-border/60 hover:border-border hover:bg-accent/30'
                )}
              >
                {selected && (
                  <div className="absolute top-2 right-2">
                    <div className="h-4 w-4 rounded-full bg-primary flex items-center justify-center">
                      <Check className="h-2.5 w-2.5 text-primary-foreground" strokeWidth={3} />
                    </div>
                  </div>
                )}
                <div className={cn(
                  "h-10 w-10 rounded-xl flex items-center justify-center transition-colors",
                  selected ? 'bg-primary/15' : 'bg-muted/60 group-hover:bg-muted'
                )}>
                  <Icon className={cn("h-5 w-5 transition-colors", selected ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground/70')} />
                </div>
                <span className={cn(
                  "text-xs font-medium transition-colors text-center leading-tight",
                  selected ? 'text-primary' : 'text-foreground/80'
                )}>
                  {t(`onboarding.industries.${key}`)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border/40" /></div>
      </div>

      {/* Company Size */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-foreground">{t('onboarding.companySize')}</label>
          {data.companySize && (
            <span className="text-xs text-primary font-medium flex items-center gap-1">
              <Check className="h-3 w-3" /> {t(`onboarding.sizes.${data.companySize}.label`)}
            </span>
          )}
        </div>
        <div className="grid grid-cols-5 gap-2">
          {SIZE_KEYS.map((key) => {
            const selected = data.companySize === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => onChange({ companySize: key })}
                className={cn(
                  "group relative flex flex-col items-center gap-1.5 p-3.5 rounded-xl border transition-all duration-200",
                  selected
                    ? 'border-primary bg-primary/[0.06] ring-1 ring-primary/20'
                    : 'border-border/60 hover:border-border hover:bg-accent/30'
                )}
              >
                {selected && (
                  <div className="absolute -top-1.5 -right-1.5">
                    <div className="h-4 w-4 rounded-full bg-primary flex items-center justify-center shadow-sm">
                      <Check className="h-2.5 w-2.5 text-primary-foreground" strokeWidth={3} />
                    </div>
                  </div>
                )}
                <span className={cn("text-base font-bold transition-colors", selected ? 'text-primary' : 'text-foreground/80')}>
                  {t(`onboarding.sizes.${key}.label`)}
                </span>
                <span className={cn("text-[10px] leading-tight text-center transition-colors", selected ? 'text-primary/70' : 'text-muted-foreground')}>
                  {t(`onboarding.sizes.${key}.description`)}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
