import { useTranslation } from 'react-i18next';
import { User, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { FLAGS, LANGUAGES } from '@/components/common/LanguageFlags';

interface ProfileSectionProps {
  displayName: string;
  setDisplayName: (v: string) => void;
  email?: string;
  currentLang: string;
  onLanguageChange: (code: string) => void;
}

/** Reusable section wrapper */
export function Section({ icon: Icon, title, desc, children }: {
  icon: typeof User; title: string; desc: string; children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-border">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-4 w-4 text-primary" strokeWidth={1.8} />
        </div>
        <div>
          <h2 className="text-[14px] font-semibold text-foreground">{title}</h2>
          <p className="text-[11px] text-muted-foreground">{desc}</p>
        </div>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

/** Reusable setting row with label, description, and control slot */
export function SettingRow({ icon: Icon, label, desc, children, noBorder }: {
  icon?: typeof User; label: string; desc: string; children: React.ReactNode; noBorder?: boolean;
}) {
  return (
    <div className={cn("flex items-center justify-between gap-4 py-4", !noBorder && "border-b border-border last:border-0")}>
      <div className="flex items-start gap-3 min-w-0">
        {Icon && <Icon className="h-4 w-4 text-muted-foreground/60 mt-0.5 shrink-0" strokeWidth={1.6} />}
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-foreground">{label}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{desc}</p>
        </div>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

/** Reusable field group with label */
export function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[12px] font-medium text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}

export function ProfileSection({ displayName, setDisplayName, email, currentLang, onLanguageChange }: ProfileSectionProps) {
  const { t } = useTranslation();

  return (
    <Section icon={User} title={t('settings.profile')} desc={t('settings.profileDesc')}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
        <FieldGroup label={t('settings.displayName')}>
          <Input value={displayName} onChange={e => setDisplayName(e.target.value)} className="h-10 text-[13px]" />
        </FieldGroup>
        <FieldGroup label={t('settings.emailLabel')}>
          <div className="relative">
            <Input defaultValue={email} disabled className="h-10 text-[13px] pr-16" />
            <Badge variant="outline" className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-success border-success/20 bg-success/5">
              {t('settings.verified')}
            </Badge>
          </div>
        </FieldGroup>
      </div>

      <div className="border-t border-border pt-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground mb-4">{t('settings.locale')}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FieldGroup label={t('settings.language')}>
            <div className="grid grid-cols-3 gap-2">
              {LANGUAGES.map(lang => {
                const Flag = FLAGS[lang.code];
                const isActive = currentLang === lang.code;
                return (
                  <button key={lang.code} onClick={() => onLanguageChange(lang.code)}
                    className={cn("flex items-center gap-2 rounded-lg border-2 px-3 py-2.5 transition-all",
                      isActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30')}>
                    {Flag && <Flag />}
                    <span className={cn("text-[12px] font-medium", isActive ? 'text-primary' : 'text-muted-foreground')}>{lang.label}</span>
                    {isActive && <Check className="h-3 w-3 text-primary ml-auto" />}
                  </button>
                );
              })}
            </div>
          </FieldGroup>
          <FieldGroup label={t('settings.timezone')}>
            <Select defaultValue="Europe/Berlin">
              <SelectTrigger className="h-10 text-[13px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Europe/Berlin">{t('timezones.europeBerlinGmt', { defaultValue: 'Europe/Berlin (GMT+1)' })}</SelectItem>
                <SelectItem value="Europe/Paris">{t('timezones.europeParisGmt', { defaultValue: 'Europe/Paris (GMT+1)' })}</SelectItem>
                <SelectItem value="America/New_York">{t('timezones.newYorkGmt', { defaultValue: 'New York (GMT-5)' })}</SelectItem>
                <SelectItem value="Asia/Tokyo">{t('timezones.tokyoGmt', { defaultValue: 'Tokyo (GMT+9)' })}</SelectItem>
                <SelectItem value="UTC">{t('timezones.utc', { defaultValue: 'UTC' })}</SelectItem>
              </SelectContent>
            </Select>
          </FieldGroup>
        </div>
      </div>
    </Section>
  );
}
