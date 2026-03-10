/**
 * @fileoverview Forgot password page — premium split-panel layout.
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LoadingButton } from '@/components/ui/loading-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertBanner } from '@/components/notifications/AlertBanner';
import { ROUTES } from '@/constants/routes';
import { ArrowLeft } from 'lucide-react';
import { authApi } from '@/features/app/api/auth';
import { ApiError } from '@/lib/apiError';
import { AuthBrandingPanel } from '@/features/app/components/auth/AuthBrandingPanel';
import logoImg from '@/assets/logo.png';

export default function ForgotPassword() {
  const { t, i18n } = useTranslation();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await authApi.forgotPassword(email, i18n.language);
      setSent(true);
    } catch (err) {
      if (ApiError.is(err)) {
        setError(err.message);
      } else {
        setError(t('auth.errors.resetSendFailed'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <AuthBrandingPanel mode="forgot" />

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
            <h1 className="text-[22px] font-bold text-foreground tracking-tight">{t('auth.forgotTitle')}</h1>
            <p className="text-[13px] text-muted-foreground leading-relaxed">{t('auth.forgotSubtitle')}</p>
          </div>

          <div className="space-y-4">
            {sent ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <AlertBanner type="success" message={t('auth.resetLinkSent')} />
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && <AlertBanner type="error" message={error} onClose={() => setError('')} />}
                <div className="space-y-1.5">
                  <Label className="text-[13px] font-medium">{t('auth.email')}</Label>
                  <Input
                    type="email" className="h-11 text-[13px] rounded-xl"
                    value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="you@company.com" autoFocus
                  />
                </div>
                <LoadingButton
                  type="submit" loading={isLoading}
                  className="w-full h-11 text-[13px] rounded-xl font-semibold shadow-md shadow-primary/15"
                  disabled={!email}
                >
                  {t('auth.sendResetLink')}
                </LoadingButton>
              </form>
            )}
          </div>

          <Link
            to={ROUTES.LOGIN}
            className="flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {t('auth.backTo')} {t('auth.login')}
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
