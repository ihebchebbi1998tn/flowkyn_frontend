/**
 * @fileoverview Settings page — wider layout, professional UI.
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Settings, Building2, User, CalendarClock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useUpdateProfile } from '@/hooks/queries';
import { trackEvent, TRACK } from '@/hooks/useTracker';
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
    <motion.div className="max-w-[900px] mx-auto space-y-6"
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}>
      {/* Header */}
      <div className="mb-2">
        <div className="flex items-center gap-2 mb-1">
          <Settings className="h-5 w-5 text-primary" />
          <h1 className="text-[22px] sm:text-[26px] font-bold tracking-tight text-foreground">{t('nav.settings')}</h1>
        </div>
        <p className="text-[13px] text-muted-foreground">{t('settings.subtitle')}</p>
      </div>

      <ProfileSection
        displayName={displayName}
        setDisplayName={setDisplayName}
        email={user?.email}
        currentLang={i18n.language}
        onLanguageChange={handleLanguageChange}
      />

      <AppearanceSection theme={theme} setTheme={handleThemeChange} />

      <NotificationsSection
        notifEmail={notifEmail} setNotifEmail={setNotifEmail}
        notifEventReminder={notifEventReminder} setNotifEventReminder={setNotifEventReminder}
        notifActivityUpdate={notifActivityUpdate} setNotifActivityUpdate={setNotifActivityUpdate}
        notifWeeklyDigest={notifWeeklyDigest} setNotifWeeklyDigest={setNotifWeeklyDigest}
        notifMarketing={notifMarketing} setNotifMarketing={setNotifMarketing}
      />

      {/* Workspace */}
      <Section icon={Building2} title={t('settings.workspace')} desc={t('settings.workspaceDesc')}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
          <FieldGroup label={t('settings.workspaceName')}>
            <Input defaultValue="Flowkyn Inc." className="h-10 text-[13px]" />
          </FieldGroup>
          <FieldGroup label={t('settings.defaultMaxParticipants')}>
            <Input type="number" defaultValue={20} className="h-10 text-[13px]" />
          </FieldGroup>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
          <FieldGroup label={t('settings.eventVisibility')}>
            <Select defaultValue="workspace">
              <SelectTrigger className="h-10 text-[13px]"><SelectValue /></SelectTrigger>
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

      <SecuritySection />

      {/* Save all */}
      <div className="flex justify-end pb-8">
        <Button variant="brand" onClick={handleSave} disabled={updateProfile.isPending} className="h-10 px-8 text-[13px]">
          {updateProfile.isPending ? t('settings.saving') : t('settings.saveAllChanges')}
        </Button>
      </div>
    </motion.div>
  );
}