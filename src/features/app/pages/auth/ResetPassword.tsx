/**
 * @fileoverview Reset password page — premium split-panel layout.
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LoadingButton } from '@/components/ui/loading-button';
import { PasswordInput } from '@/components/ui/password-input';
import { Label } from '@/components/ui/label';
import { AlertBanner } from '@/components/notifications/AlertBanner';
import { ROUTES } from '@/constants/routes';
import { authApi } from '@/features/app/api/auth';
import { ApiError } from '@/lib/apiError';
import { AuthBrandingPanel } from '@/features/app/components/auth/AuthBrandingPanel';
import logoImg from '@/assets/logo.png';

export default function ResetPassword() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!token) { setError(t('auth.errors.missingToken')); return; }
    if (password.length < 8) { setError(t('auth.errors.passwordMin')); return; }
    if (password !== confirm) { setError(t('auth.errors.passwordMatch')); return; }
    setIsLoading(true);
    try {
      await authApi.resetPassword(token, password);
      navigate(ROUTES.LOGIN, { state: { message: t('auth.passwordResetSuccess') } });
    } catch (err) {
      if (ApiError.is(err)) {
        setError(err.message);
      } else {
        setError(t('auth.errors.resetFailed'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <AuthBrandingPanel mode="reset" />

      <div className="flex-1 flex items-center justify-center bg-background p-6">
        <motion.div
          className="w-full max-w-[380px] space-y-6"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="lg:hidden mb-4">
            <img src={logoImg} alt="Flowkyn" className="h-12 w-12 object-contain" />
          </div>

          <div className="space-y-1.5">
            <h1 className="text-[22px] font-bold text-foreground tracking-tight">{t('auth.resetTitle')}</h1>
            <p className="text-[13px] text-muted-foreground leading-relaxed">{t('auth.resetSubtitle')}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {error && <AlertBanner type="error" message={error} onClose={() => setError('')} />}
            <div className="space-y-1.5">
              <Label className="text-[13px] font-medium">{t('auth.newPassword')}</Label>
              <PasswordInput
                className="h-11 text-[13px] rounded-xl"
                value={password} onChange={e => setPassword(e.target.value)}
                placeholder={t('auth.passwordPlaceholder')} autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[13px] font-medium">{t('auth.confirmPassword')}</Label>
              <PasswordInput
                className="h-11 text-[13px] rounded-xl"
                value={confirm} onChange={e => setConfirm(e.target.value)}
              />
            </div>
            <LoadingButton
              type="submit" loading={isLoading}
              className="w-full h-11 text-[13px] rounded-xl font-semibold shadow-md shadow-primary/15"
            >
              {t('auth.resetPassword')}
            </LoadingButton>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
