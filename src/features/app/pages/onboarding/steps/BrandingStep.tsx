import { useTranslation } from 'react-i18next';
import { Check, Camera, X } from 'lucide-react';
import { FLAGS } from '@/components/common/LanguageFlags';
import { cn } from '@/lib/utils';
import type { OnboardingData } from '../types';

interface BrandingStepProps {
  data: OnboardingData;
  onChange: (partial: Partial<OnboardingData>) => void;
  onLogoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function BrandingStep({ data, onChange, onLogoUpload }: BrandingStepProps) {
  const { t } = useTranslation();

  const LANGUAGES = [
    { key: 'en', label: t('languages.en', { defaultValue: 'English' }) },
    { key: 'fr', label: t('languages.fr', { defaultValue: 'Français' }) },
    { key: 'de', label: t('languages.de', { defaultValue: 'Deutsch' }) },
  ];

  return (
    <div className="space-y-6">
      {/* Language */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-foreground">{t('onboarding.preferredLanguage')}</label>
        <div className="grid grid-cols-3 gap-2">
          {LANGUAGES.map(({ key, label }) => {
            const selected = data.language === key;
            const FlagComponent = FLAGS[key];
            return (
              <button
                key={key}
                type="button"
                onClick={() => onChange({ language: key })}
                className={cn(
                  "flex flex-col items-center gap-2 p-3.5 rounded-lg border transition-all",
                  selected
                    ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                    : 'border-border/60 hover:border-border hover:bg-accent/20'
                )}
              >
                <div className="h-8 w-12 rounded overflow-hidden flex items-center justify-center">
                  {FlagComponent && <FlagComponent size={20} />}
                </div>
                <span className={cn("text-xs font-medium", selected ? 'text-primary' : 'text-foreground/80')}>
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Logo */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-foreground">{t('onboarding.orgLogo')}</label>
          <span className="text-[11px] text-muted-foreground">{t('auth.optional')}</span>
        </div>

        <div
          className={cn(
            "relative rounded-lg border-2 border-dashed p-6 flex items-center justify-center gap-4 transition-all cursor-pointer hover:bg-accent/10",
            data.logoPreview ? 'border-primary/30' : 'border-border/60'
          )}
          onClick={() => document.getElementById('logo-upload')?.click()}
        >
          <input id="logo-upload" type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={onLogoUpload} className="hidden" />

          {data.logoPreview ? (
            <div className="flex items-center gap-4">
              <div className="relative">
                <img src={data.logoPreview} alt="Logo" className="h-14 w-14 rounded-lg object-cover border border-border/50" />
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onChange({ logoFile: null, logoPreview: null }); }}
                  className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-sm"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </div>
              <p className="text-sm text-muted-foreground">{t('onboarding.logoUploadedHint', { defaultValue: 'Click to change' })}</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 py-2">
              <Camera className="h-5 w-5 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">{t('onboarding.logoUploadCta', { defaultValue: 'Upload logo' })}</p>
              <p className="text-[11px] text-muted-foreground/60">PNG, JPG, WebP · Max 2MB</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
