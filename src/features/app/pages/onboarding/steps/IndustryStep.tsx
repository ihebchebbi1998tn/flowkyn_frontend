import { useTranslation } from 'react-i18next';
import { Check, Zap, Heart, GraduationCap, BarChart3, Briefcase, Rocket, Shield, Building2 } from 'lucide-react';
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
    <div className="space-y-6">
      {/* Industry */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-foreground">{t('onboarding.industry')}</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {INDUSTRY_KEYS.map((key) => {
            const Icon = INDUSTRY_ICONS[key];
            const selected = data.industry === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => onChange({ industry: key })}
                className={cn(
                  "flex flex-col items-center gap-2 p-3 rounded-lg border text-center transition-all",
                  selected
                    ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                    : 'border-border/60 hover:border-border hover:bg-accent/20'
                )}
              >
                <div className={cn(
                  "h-8 w-8 rounded-lg flex items-center justify-center",
                  selected ? 'bg-primary/10' : 'bg-muted/60'
                )}>
                  <Icon className={cn("h-4 w-4", selected ? 'text-primary' : 'text-muted-foreground')} />
                </div>
                <span className={cn("text-xs font-medium", selected ? 'text-primary' : 'text-foreground/80')}>
                  {t(`onboarding.industries.${key}`)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Company Size */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-foreground">{t('onboarding.companySize')}</label>
        <div className="grid grid-cols-5 gap-1.5">
          {SIZE_KEYS.map((key) => {
            const selected = data.companySize === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => onChange({ companySize: key })}
                className={cn(
                  "flex flex-col items-center gap-0.5 p-2.5 rounded-lg border transition-all",
                  selected
                    ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                    : 'border-border/60 hover:border-border hover:bg-accent/20'
                )}
              >
                <span className={cn("text-sm font-semibold", selected ? 'text-primary' : 'text-foreground/80')}>
                  {t(`onboarding.sizes.${key}.label`)}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
