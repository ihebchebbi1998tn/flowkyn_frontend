import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { OnboardingData } from '../types';

interface OrgInfoStepProps {
  data: OnboardingData;
  onChange: (partial: Partial<OnboardingData>) => void;
}

export function OrgInfoStep({ data, onChange }: OrgInfoStepProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">{t('onboarding.orgName')}</label>
        <Input
          placeholder={t('onboarding.orgNamePlaceholder')}
          value={data.orgName}
          onChange={(e) => onChange({ orgName: e.target.value })}
          className="h-10"
          autoFocus
        />
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">
          {t('onboarding.orgDescription')} <span className="text-muted-foreground font-normal text-xs">({t('auth.optional')})</span>
        </label>
        <Textarea
          placeholder={t('onboarding.orgDescriptionPlaceholder')}
          value={data.orgDescription}
          onChange={(e) => onChange({ orgDescription: e.target.value })}
          className="min-h-[80px] text-sm resize-none"
          maxLength={500}
        />
      </div>
    </div>
  );
}
