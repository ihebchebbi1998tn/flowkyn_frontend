/**
 * @fileoverview Onboarding Step 0 — Organization Name & Description
 *
 * First step of the onboarding flow. Collects the organization name (required)
 * and an optional description (max 500 chars).
 */

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
    <div className="space-y-5">
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">{t('onboarding.orgName')} *</label>
        <Input
          placeholder={t('onboarding.orgNamePlaceholder')}
          value={data.orgName}
          onChange={(e) => onChange({ orgName: e.target.value })}
          className="h-12 text-base"
          autoFocus
        />
        <p className="text-[11px] text-muted-foreground">{t('onboarding.orgNameHint')}</p>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          {t('onboarding.orgDescription')} <span className="text-muted-foreground">({t('auth.optional')})</span>
        </label>
        <Textarea
          placeholder={t('onboarding.orgDescriptionPlaceholder')}
          value={data.orgDescription}
          onChange={(e) => onChange({ orgDescription: e.target.value })}
          className="min-h-[100px] text-sm resize-none"
          maxLength={500}
        />
        <div className="flex justify-end">
          <span className="text-[10px] text-muted-foreground">{data.orgDescription.length}/500</span>
        </div>
      </div>
    </div>
  );
}
