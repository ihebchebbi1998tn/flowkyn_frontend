import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Shield, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LoadingButton } from '@/components/ui/loading-button';
import { PasswordInput } from '@/components/ui/password-input';
import { AlertBanner } from '@/components/notifications/AlertBanner';
import { Section, FieldGroup } from './ProfileSection';
import { api } from '@/features/app/api/client';
import { ApiError } from '@/lib/apiError';
import { toast } from 'sonner';
import { trackEvent, TRACK } from '@/hooks/useTracker';
import { useAuth } from '@/features/app/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useApiError } from '@/hooks/useApiError';

export function SecuritySection() {
  const { t } = useTranslation();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const { showError } = useApiError();

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
        showError(err, t('settings.passwordUpdateFailed'));
      } else {
        setError(t('settings.passwordUpdateFailed'));
        showError(err, t('settings.passwordUpdateFailed'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await api.del('/users/me');
      toast.success(t('settings.accountDeleted'));
      logout();
      navigate(ROUTES.LOGIN);
    } catch (err) {
      if (ApiError.is(err)) {
        showError(err, t('settings.accountDeleteFailed'));
      } else {
        showError(err, t('settings.accountDeleteFailed'));
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Section icon={Shield} title={t('settings.security')} desc={t('settings.securityDesc')}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground mb-4">{t('settings.changePassword')}</p>
      <form onSubmit={handleChangePassword} className="space-y-4 max-w-sm mb-5">
        {error && <AlertBanner type="error" message={error} onClose={() => setError('')} />}
        <FieldGroup label={t('settings.currentPassword')}>
          <PasswordInput
            className="h-10 text-[13px]"
            placeholder={t('auth.passwordMask', { defaultValue: '••••••••' })}
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

      <div className="mt-5 rounded-lg border border-destructive/20 bg-destructive/5 p-4">
        <div className="flex items-center gap-2 mb-1">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <p className="text-[13px] font-medium text-destructive">{t('settings.dangerZone')}</p>
        </div>
        <p className="text-[11px] text-muted-foreground mt-1 mb-3">{t('settings.dangerZoneDesc')}</p>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 text-[12px] text-destructive border-destructive/30 hover:bg-destructive/10">
              {t('settings.deleteAccount')}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="text-destructive flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                {t('settings.deleteAccountTitle')}
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-3">
                <span className="block">{t('settings.deleteAccountWarning')}</span>
                <span className="block text-[12px] text-muted-foreground">
                  {t('settings.deleteAccountConfirmHint')}
                </span>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={e => setDeleteConfirmText(e.target.value)}
                  placeholder={t('settings.deleteAccountPlaceholder')}
                  className="w-full h-10 rounded-lg border border-destructive/30 bg-background px-3 text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-destructive/30"
                />
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setDeleteConfirmText('')}>
                {t('common.cancel')}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== 'DELETE' || isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
              >
                {isDeleting ? t('settings.deleting') : t('settings.deleteAccountConfirm')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Section>
  );
}