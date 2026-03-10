import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Shield, KeyRound, Smartphone, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LoadingButton } from '@/components/ui/loading-button';
import { PasswordInput } from '@/components/ui/password-input';
import { AlertBanner } from '@/components/notifications/AlertBanner';
import { Section, SettingRow, FieldGroup } from './ProfileSection';
import { api } from '@/features/app/api/client';
import { ApiError } from '@/lib/apiError';
import { toast } from 'sonner';
import { trackEvent, TRACK } from '@/hooks/useTracker';

export function SecuritySection() {
  const { t } = useTranslation();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 8) { setError(t('settings.passwordMinLength')); return; }
    if (newPassword !== confirmPassword) { setError(t('auth.errors.passwordMatch')); return; }
    if (!/[A-Z]/.test(newPassword)) { setError(t('settings.passwordUppercase')); return; }
    if (!/[0-9]/.test(newPassword)) { setError(t('settings.passwordNumber')); return; }

    setIsLoading(true);
    try {
      await api.post('/users/change-password', {
        current_password: currentPassword,
        new_password: newPassword,
      });
      toast.success(t('settings.passwordUpdated'));
      trackEvent(TRACK.PASSWORD_RESET, {});
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      if (ApiError.is(err)) {
        setError(err.message);
      } else {
        setError(t('settings.passwordUpdateFailed'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Section icon={Shield} title={t('settings.security')} desc={t('settings.securityDesc')}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground mb-4">{t('settings.changePassword')}</p>
      <form onSubmit={handleChangePassword} className="space-y-4 max-w-sm mb-5">
        {error && <AlertBanner type="error" message={error} onClose={() => setError('')} />}
        <FieldGroup label={t('settings.currentPassword')}>
          <PasswordInput className="h-10 text-[13px]" placeholder="••••••••"
            value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
        </FieldGroup>
        <FieldGroup label={t('settings.newPasswordLabel')}>
          <PasswordInput className="h-10 text-[13px]" placeholder={t('auth.passwordPlaceholder')}
            value={newPassword} onChange={e => setNewPassword(e.target.value)} />
        </FieldGroup>
        <FieldGroup label={t('settings.confirmPasswordLabel')}>
          <PasswordInput className="h-10 text-[13px]"
            value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
        </FieldGroup>
        <LoadingButton type="submit" variant="outline" loading={isLoading} className="h-9 text-[13px]"
          disabled={!currentPassword || !newPassword || !confirmPassword}>
          {t('settings.updatePassword')}
        </LoadingButton>
      </form>
      <div className="border-t border-border">
        <SettingRow icon={KeyRound} label={t('settings.twoFactor')} desc={t('settings.twoFactorDesc')}>
          <Button variant="outline" size="sm" className="h-8 text-[12px] gap-1.5">{t('settings.enable2FA')}</Button>
        </SettingRow>
        <SettingRow icon={Smartphone} label={t('settings.activeSessions')} desc={t('settings.activeSessionsDesc')} noBorder>
          <Button variant="outline" size="sm" className="h-8 text-[12px] gap-1.5">
            <Eye className="h-3 w-3" /> {t('settings.manage')}
          </Button>
        </SettingRow>
      </div>

      <div className="mt-5 rounded-lg border border-destructive/20 bg-destructive/5 p-4">
        <p className="text-[13px] font-medium text-destructive">{t('settings.dangerZone')}</p>
        <p className="text-[11px] text-muted-foreground mt-1 mb-3">{t('settings.dangerZoneDesc')}</p>
        <Button variant="outline" size="sm" className="h-8 text-[12px] text-destructive border-destructive/30 hover:bg-destructive/10">
          {t('settings.deleteAccount')}
        </Button>
      </div>
    </Section>
  );
}
