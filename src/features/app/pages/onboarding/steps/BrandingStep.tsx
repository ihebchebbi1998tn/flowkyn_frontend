/**
 * @fileoverview Onboarding Step 3 — Language & Logo Upload
 *
 * Final step: user selects their preferred language and optionally
 * uploads an organization logo. The app language switches live
 * when the user picks a language.
 */

import { useTranslation } from 'react-i18next';
import { Check, Camera, X } from 'lucide-react';
import { FLAGS } from '@/components/common/LanguageFlags';
import { cn } from '@/lib/utils';
import type { OnboardingData } from '../types';

const LANGUAGES = [
  { key: 'en', label: 'English', flag: '🇬🇧' },
  { key: 'fr', label: 'Français', flag: '🇫🇷' },
  { key: 'de', label: 'Deutsch', flag: '🇩🇪' },
];

interface BrandingStepProps {
  data: OnboardingData;
  onChange: (partial: Partial<OnboardingData>) => void;
  onLogoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function BrandingStep({ data, onChange, onLogoUpload }: BrandingStepProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-8">
      {/* Language Selection */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-foreground">{t('onboarding.preferredLanguage')}</label>
          {data.language && (
            <span className="text-xs text-primary font-medium flex items-center gap-1">
              <Check className="h-3 w-3" /> {LANGUAGES.find(l => l.key === data.language)?.label}
            </span>
          )}
        </div>
        <div className="grid grid-cols-3 gap-3">
          {LANGUAGES.map(({ key, label }) => {
            const selected = data.language === key;
            const FlagComponent = FLAGS[key];
            return (
              <button
                key={key}
                type="button"
                onClick={() => onChange({ language: key })}
                className={cn(
                  "group relative flex flex-col items-center gap-3 p-5 rounded-xl border transition-all duration-200",
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
                  "h-10 w-14 rounded-md overflow-hidden flex items-center justify-center border transition-all",
                  selected ? 'border-primary/20 shadow-sm' : 'border-border/40'
                )}>
                  {FlagComponent && <FlagComponent size={24} />}
                </div>
                <span className={cn("text-sm font-medium transition-colors", selected ? 'text-primary' : 'text-foreground/80')}>
                  {label}
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

      {/* Logo Upload */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-foreground">{t('onboarding.orgLogo')}</label>
          <span className="text-[11px] text-muted-foreground">{t('auth.optional')}</span>
        </div>

        <div
          className={cn(
            "relative group rounded-2xl border-2 border-dashed p-8 flex flex-col items-center justify-center gap-4 transition-all cursor-pointer hover:bg-accent/20",
            data.logoPreview ? 'border-primary/30 bg-primary/[0.02]' : 'border-border/60'
          )}
          onClick={() => document.getElementById('logo-upload')?.click()}
        >
          <input
            id="logo-upload"
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={onLogoUpload}
            className="hidden"
          />

          {data.logoPreview ? (
            <div className="flex items-center gap-5">
              <div className="relative">
                <img src={data.logoPreview} alt="Logo" className="h-20 w-20 rounded-2xl object-cover border border-border/50 shadow-sm" />
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onChange({ logoFile: null, logoPreview: null }); }}
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-md hover:bg-destructive/90 transition-colors"
                >
                  <X className="h-3 w-3" strokeWidth={3} />
                </button>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">Logo uploaded</p>
                <p className="text-xs text-muted-foreground">Click to change or press × to remove</p>
              </div>
            </div>
          ) : (
            <>
              <div className="h-14 w-14 rounded-2xl bg-muted/60 flex items-center justify-center group-hover:bg-muted transition-colors">
                <Camera className="h-6 w-6 text-muted-foreground/60 group-hover:text-muted-foreground transition-colors" />
              </div>
              <div className="text-center space-y-1">
                <p className="text-sm font-medium text-foreground/80">Click to upload your logo</p>
                <p className="text-[11px] text-muted-foreground">PNG, JPG or WebP • Max 2MB</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
