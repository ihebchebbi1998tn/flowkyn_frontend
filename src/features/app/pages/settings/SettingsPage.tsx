/**
 * @fileoverview Settings page — wider layout, professional UI with in-page navigation.
 */

import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Settings, Building2, User, CalendarClock, Bell, Palette, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useUpdateProfile } from '@/hooks/queries';
import { trackEvent, TRACK } from '@/hooks/useTracker';
import { PageShell } from '@/features/app/components/dashboard';
import { ProfileSection } from './ProfileSection';
import { Section, SettingRow, FieldGroup } from './ProfileSection';
import { AppearanceSection } from './AppearanceSection';
import { NotificationsSection } from './NotificationsSection';
import { SecuritySection } from './SecuritySection';

export default function SettingsPage() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const updateProfile = useUpdateProfile();

  const [notifEmail, setNotifEmail] = useState(true);
  const [notifEventReminder, setNotifEventReminder] = useState(true);
  const [notifActivityUpdate, setNotifActivityUpdate] = useState(true);
  const [notifWeeklyDigest, setNotifWeeklyDigest] = useState(false);
  const [notifMarketing, setNotifMarketing] = useState(false);
  const [displayName, setDisplayName] = useState(user?.name || '');

  const profileRef = useRef<HTMLDivElement | null>(null);
  const appearanceRef = useRef<HTMLDivElement | null>(null);
  const notificationsRef = useRef<HTMLDivElement | null>(null);
  const workspaceRef = useRef<HTMLDivElement | null>(null);
  const securityRef = useRef<HTMLDivElement | null>(null);

  const scrollTo = (ref: React.RefObject<HTMLDivElement>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleSave = () => {
    updateProfile.mutate({ name: displayName, language: i18n.language });
    trackEvent(TRACK.PROFILE_UPDATED, { fields: ['name', 'language'] });
  };

  const handleLanguageChange = (langCode: string) => {
    i18n.changeLanguage(langCode);
    updateProfile.mutate({ language: langCode });
    trackEvent(TRACK.LANGUAGE_CHANGED, { language: langCode });
  };

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme as any);
    trackEvent(TRACK.THEME_CHANGED, { theme: newTheme });
  };

  return (
    <PageShell>
      <motion.div className="space-y-6"
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}>
      {/* Header */}
      <div className="mb-2">
        <div className="flex items-center gap-2 mb-1">
          <Settings className="h-5 w-5 text-primary" />
          <h1 className="text-page-title text-foreground">{t('nav.settings')}</h1>
        </div>
        <p className="text-body-sm text-muted-foreground">{t('settings.subtitle')}</p>
      </div>
      <div className="mb-3">
        <div className="inline-flex w-full sm:w-auto items-center gap-1 rounded-xl border border-border bg-muted/40 px-2.5 py-1.5 text-label-xs text-muted-foreground">
          <span className="font-semibold uppercase tracking-[0.14em]">{t('settings.quickNav')}</span>
          <span className="hidden sm:inline">·</span>
          <span className="hidden sm:inline">{t('settings.quickNavHint')}</span>
        </div>
        <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
          <button
            type="button"
            onClick={() => scrollTo(profileRef)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1.5 text-label-xs font-medium text-muted-foreground hover:text-foreground hover:border-primary/40 hover:bg-primary/5 transition-colors"
          >
            <User className="h-3.5 w-3.5" />
            {t('settings.profile')}
          </button>
          <button
            type="button"
            onClick={() => scrollTo(appearanceRef)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1.5 text-label-xs font-medium text-muted-foreground hover:text-foreground hover:border-primary/40 hover:bg-primary/5 transition-colors"
          >
            <Palette className="h-3.5 w-3.5" />
            {t('settings.appearance')}
          </button>
          <button
            type="button"
            onClick={() => scrollTo(notificationsRef)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1.5 text-label-xs font-medium text-muted-foreground hover:text-foreground hover:border-primary/40 hover:bg-primary/5 transition-colors"
          >
            <Bell className="h-3.5 w-3.5" />
            {t('settings.notifications')}
          </button>
          <button
            type="button"
            onClick={() => scrollTo(workspaceRef)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1.5 text-label-xs font-medium text-muted-foreground hover:text-foreground hover:border-primary/40 hover:bg-primary/5 transition-colors"
          >
            <Building2 className="h-3.5 w-3.5" />
            {t('settings.workspace')}
          </button>
          <button
            type="button"
            onClick={() => scrollTo(securityRef)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1.5 text-label-xs font-medium text-muted-foreground hover:text-foreground hover:border-primary/40 hover:bg-primary/5 transition-colors"
          >
            <Shield className="h-3.5 w-3.5" />
            {t('settings.security')}
          </button>
        </div>
      </div>

      <div ref={profileRef}>
        <ProfileSection
          displayName={displayName}
          setDisplayName={setDisplayName}
          email={user?.email}
          currentLang={i18n.language}
          onLanguageChange={handleLanguageChange}
        />
      </div>

      <div ref={appearanceRef}>
        <AppearanceSection theme={theme} setTheme={handleThemeChange} />
      </div>

      <div ref={notificationsRef}>
        <NotificationsSection
          notifEmail={notifEmail} setNotifEmail={setNotifEmail}
          notifEventReminder={notifEventReminder} setNotifEventReminder={setNotifEventReminder}
          notifActivityUpdate={notifActivityUpdate} setNotifActivityUpdate={setNotifActivityUpdate}
          notifWeeklyDigest={notifWeeklyDigest} setNotifWeeklyDigest={setNotifWeeklyDigest}
          notifMarketing={notifMarketing} setNotifMarketing={setNotifMarketing}
        />
      </div>

      <div ref={workspaceRef}>
        <Section icon={Building2} title={t('settings.workspace')} desc={t('settings.workspaceDesc')}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
            <FieldGroup label={t('settings.workspaceName')}>
              <Input defaultValue={user?.name ? `${user.name}'s Workspace` : 'Workspace'} className="h-10 text-body-sm" />
            </FieldGroup>
            <FieldGroup label={t('settings.defaultMaxParticipants')}>
              <Input type="number" defaultValue={20} className="h-10 text-body-sm" />
            </FieldGroup>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
            <FieldGroup label={t('settings.eventVisibility')}>
              <Select defaultValue="workspace">
                <SelectTrigger className="h-10 text-body-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="workspace">{t('settings.workspaceOnly')}</SelectItem>
                  <SelectItem value="invite">{t('settings.inviteOnly')}</SelectItem>
                  <SelectItem value="public">{t('events.visibilities.public')}</SelectItem>
                </SelectContent>
              </Select>
            </FieldGroup>
          </div>
          <div className="border-t border-border">
            <SettingRow icon={User} label={t('settings.allowGuestAccess')} desc={t('settings.allowGuestAccessDesc')}>
              <Switch defaultChecked />
            </SettingRow>
            <SettingRow icon={CalendarClock} label={t('settings.autoSendReminders')} desc={t('settings.autoSendRemindersDesc')} noBorder>
              <Switch defaultChecked />
            </SettingRow>
          </div>
        </Section>
      </div>

      <div ref={securityRef}>
        <SecuritySection />
      </div>

        {/* Save all */}
        <div className="flex justify-end pb-8">
          <Button variant="brand" onClick={handleSave} disabled={updateProfile.isPending} className="h-10 px-8 text-body-sm">
            {updateProfile.isPending ? t('settings.saving') : t('settings.saveAllChanges')}
          </Button>
        </div>
      </motion.div>
    </PageShell>
  );
}