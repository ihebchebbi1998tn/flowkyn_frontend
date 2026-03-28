import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Palette, Sun, Moon, Monitor, Check } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { Section, SettingRow } from './ProfileSection';

interface AppearanceSectionProps {
  theme: string;
  setTheme: (t: string) => void;
}

export function AppearanceSection({ theme, setTheme }: AppearanceSectionProps) {
  const { t } = useTranslation();

  // If disabled, we apply a global `reduce-motion` class.
  // This makes the toggle actually affect UI (many components use CSS transitions).
  const [motionEnabled, setMotionEnabled] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('flowkyn-motion-animations');
      return stored !== 'off';
    } catch {
      return true;
    }
  });

  useEffect(() => {
    document.documentElement.classList.toggle('reduce-motion', !motionEnabled);
    try {
      localStorage.setItem('flowkyn-motion-animations', motionEnabled ? 'on' : 'off');
    } catch {
      // ignore
    }
  }, [motionEnabled]);
  const themeOptions = [
    { key: 'light', label: t('theme.light'), icon: Sun, preview: 'bg-white border-border' },
    { key: 'dark', label: t('theme.dark'), icon: Moon, preview: 'bg-[hsl(270,30%,8%)] border-[hsl(270,20%,18%)]' },
    { key: 'system', label: t('theme.system'), icon: Monitor, preview: 'bg-gradient-to-br from-white to-[hsl(270,30%,8%)] border-border' },
  ] as const;

  return (
    <Section icon={Palette} title={t('settings.appearance')} desc={t('settings.appearanceDesc')}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground mb-4">{t('settings.theme')}</p>
      <div className="grid grid-cols-3 gap-3 mb-5">
        {themeOptions.map(opt => (
          <button key={opt.key} onClick={() => setTheme(opt.key)}
            className={cn("relative rounded-xl border-2 p-1.5 transition-all",
              theme === opt.key ? 'border-primary shadow-sm shadow-primary/10' : 'border-border hover:border-primary/30')}>
            <div className={cn("rounded-lg h-16 sm:h-20 border mb-2", opt.preview)}>
              <div className="p-2 space-y-1.5">
                <div className={cn("h-1.5 w-10 rounded-full", opt.key === 'dark' ? 'bg-white/15' : 'bg-black/8')} />
                <div className={cn("h-1.5 w-6 rounded-full", opt.key === 'dark' ? 'bg-white/10' : 'bg-black/5')} />
              </div>
            </div>
            <div className="flex items-center justify-center gap-1.5 pb-0.5">
              <opt.icon className={cn("h-3.5 w-3.5", theme === opt.key ? 'text-primary' : 'text-muted-foreground')} />
              <span className={cn("text-[12px] font-medium", theme === opt.key ? 'text-primary' : 'text-muted-foreground')}>{opt.label}</span>
              {theme === opt.key && <Check className="h-3 w-3 text-primary" />}
            </div>
          </button>
        ))}
      </div>
      <div className="border-t border-border">
        <SettingRow label={t('settings.motionAnimations')} desc={t('settings.motionAnimationsDesc')} noBorder>
          <Switch checked={motionEnabled} onCheckedChange={setMotionEnabled} />
        </SettingRow>
      </div>
    </Section>
  );
}
