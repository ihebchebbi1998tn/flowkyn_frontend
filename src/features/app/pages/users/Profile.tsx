import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertBanner } from '@/components/notifications/AlertBanner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useUpdateProfile, useUploadAvatar } from '@/hooks/queries';
import { trackEvent, TRACK } from '@/hooks/useTracker';

export default function Profile() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const updateProfile = useUpdateProfile();
  const uploadAvatar = useUploadAvatar();
  const [name, setName] = useState(user?.name || '');
  const [language, setLanguage] = useState(user?.language || i18n.language);

  if (!user) return null;

  const initials = user.name.split(' ').map(n => n[0]).join('').slice(0, 2);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile.mutate({ name, language });
    trackEvent(TRACK.PROFILE_UPDATED, { fields: ['name', 'language'] });
    i18n.changeLanguage(language);
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadAvatar.mutate(file, {
        onSuccess: () => trackEvent(TRACK.AVATAR_UPLOADED, {}),
      });
    }
  };

  return (
    <motion.div className="max-w-2xl mx-auto space-y-4 sm:space-y-6"
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}>
      <h1 className="text-lg sm:text-xl font-bold tracking-tight">{t('profile.title')}</h1>

      <form onSubmit={handleSave} className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="h-1 w-full bg-gradient-to-r from-primary/80 to-primary" />
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <label className="cursor-pointer">
              <Avatar className="h-12 w-12 sm:h-14 sm:w-14">
                {user.avatar_url && <AvatarImage src={user.avatar_url} />}
                <AvatarFallback className="bg-primary/15 text-primary text-base sm:text-lg font-bold">{initials}</AvatarFallback>
              </Avatar>
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            </label>
            <div className="min-w-0">
              <p className="font-semibold text-[14px] sm:text-[15px] truncate">{user.name}</p>
              <p className="text-[12px] sm:text-[13px] text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[13px]">{t('profile.displayName')}</Label>
            <Input value={name} onChange={e => setName(e.target.value)} className="h-10 text-[13px]" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-1.5">
              <Label className="text-[13px]">{t('profile.language')}</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="h-10 text-[13px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">{t('languages.en', { defaultValue: 'English' })}</SelectItem>
                  <SelectItem value="fr">{t('languages.fr', { defaultValue: 'Français' })}</SelectItem>
                  <SelectItem value="de">{t('languages.de', { defaultValue: 'Deutsch' })}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[13px]">{t('profile.timezone')}</Label>
              <Select defaultValue="Europe/Berlin">
                <SelectTrigger className="h-10 text-[13px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Europe/Berlin">{t('timezones.europeBerlin', { defaultValue: 'Europe/Berlin' })}</SelectItem>
                  <SelectItem value="Europe/Paris">{t('timezones.europeParis', { defaultValue: 'Europe/Paris' })}</SelectItem>
                  <SelectItem value="America/New_York">{t('timezones.americaNewYork', { defaultValue: 'America/New York' })}</SelectItem>
                  <SelectItem value="Asia/Tokyo">{t('timezones.asiaTokyo', { defaultValue: 'Asia/Tokyo' })}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" className="h-10 text-[13px]" disabled={updateProfile.isPending}>
              {updateProfile.isPending ? t('common.loading') : t('common.save')}
            </Button>
          </div>
        </div>
      </form>
    </motion.div>
  );
}
