import { useTranslation } from 'react-i18next';
import { Bell, Mail, CalendarClock, BarChart3, Megaphone } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Section, SettingRow } from './ProfileSection';

interface NotificationsSectionProps {
  notifEmail: boolean;
  setNotifEmail: (v: boolean) => void;
  notifEventReminder: boolean;
  setNotifEventReminder: (v: boolean) => void;
  notifActivityUpdate: boolean;
  setNotifActivityUpdate: (v: boolean) => void;
  notifWeeklyDigest: boolean;
  setNotifWeeklyDigest: (v: boolean) => void;
  notifMarketing: boolean;
  setNotifMarketing: (v: boolean) => void;
}

export function NotificationsSection(props: NotificationsSectionProps) {
  const { t } = useTranslation();

  return (
    <Section icon={Bell} title={t('settings.notifications')} desc={t('settings.notificationsDesc')}>
      <SettingRow icon={Mail} label={t('settings.emailNotifications')} desc={t('settings.emailNotificationsDesc')}>
        <Switch checked={props.notifEmail} onCheckedChange={props.setNotifEmail} />
      </SettingRow>
      <SettingRow icon={CalendarClock} label={t('settings.eventReminders')} desc={t('settings.eventRemindersDesc')}>
        <Switch checked={props.notifEventReminder} onCheckedChange={props.setNotifEventReminder} />
      </SettingRow>
      <SettingRow icon={Bell} label={t('settings.activityUpdates')} desc={t('settings.activityUpdatesDesc')}>
        <Switch checked={props.notifActivityUpdate} onCheckedChange={props.setNotifActivityUpdate} />
      </SettingRow>
      <SettingRow icon={BarChart3} label={t('settings.weeklyDigest')} desc={t('settings.weeklyDigestDesc')}>
        <Switch checked={props.notifWeeklyDigest} onCheckedChange={props.setNotifWeeklyDigest} />
      </SettingRow>
      <SettingRow icon={Megaphone} label={t('settings.productUpdates')} desc={t('settings.productUpdatesDesc')} noBorder>
        <Switch checked={props.notifMarketing} onCheckedChange={props.setNotifMarketing} />
      </SettingRow>
    </Section>
  );
}
