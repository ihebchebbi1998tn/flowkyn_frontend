import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Heart, Users, Handshake } from 'lucide-react';
import type { OnboardingData } from '../types';

interface TeamPulseStepProps {
  data: OnboardingData;
  onChange: (partial: Partial<OnboardingData>) => void;
}

const QUESTIONS = [
  { key: 'teamConnectedness' as const, icon: Users },
  { key: 'relationshipQuality' as const, icon: Heart },
  { key: 'teamFamiliarity' as const, icon: Handshake },
] as const;

function ratingColor(v: number) {
  if (v <= 3) return 'text-destructive';
  if (v <= 6) return 'text-warning';
  return 'text-success';
}

export function TeamPulseStep({ data, onChange }: TeamPulseStepProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      {QUESTIONS.map((q) => {
        const Icon = q.icon;
        const value = data[q.key];
        return (
          <div key={q.key} className="rounded-lg border border-border p-3.5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <Icon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">
                  {t(`onboarding.pulse.${q.key}.label`)}
                </span>
              </div>
              <span className={cn('text-lg font-bold tabular-nums', ratingColor(value))}>
                {value}<span className="text-xs text-muted-foreground font-normal">/10</span>
              </span>
            </div>
            <Slider value={[value]} onValueChange={([v]) => onChange({ [q.key]: v })} min={1} max={10} step={1} />
          </div>
        );
      })}

      {/* Expectations */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">
          {t('onboarding.pulse.expectations.label')}
          <span className="text-muted-foreground font-normal text-xs ml-1">({t('auth.optional')})</span>
        </label>
        <Textarea
          value={data.expectations}
          onChange={(e) => onChange({ expectations: e.target.value })}
          placeholder={t('onboarding.pulse.expectations.placeholder')}
          className="resize-none min-h-[70px] text-sm"
          maxLength={500}
        />
      </div>
    </div>
  );
}
