/**
 * Auto-verify page — handles email verification links.
 * When user clicks the link in the email, they land on /verify?token=xxx
 */

import { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { authApi } from '@/features/app/api/auth';
import { ApiError } from '@/lib/apiError';
import { ROUTES } from '@/constants/routes';
import logoImg from '@/assets/logo.png';
import { LogoLoader } from '@/components/loading/LogoLoader';
import { LanguageSelector } from '@/components/common';

export default function VerifyEmail() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';

  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [errorMessage, setErrorMessage] = useState('');
  const hasAttempted = useRef(false);

  useEffect(() => {
    if (!token || hasAttempted.current) {
      if (!token) {
        setStatus('error');
        setErrorMessage(t('auth.missingVerificationToken'));
      }
      return;
    }

    async function verify() {
      hasAttempted.current = true;
      try {
        await authApi.verifyEmail(token);
        setStatus('success');
        setTimeout(() => navigate(ROUTES.LOGIN, { state: { message: t('auth.emailVerifiedSuccess') } }), 2500);
      } catch (err) {
        setStatus('error');
        if (ApiError.is(err)) {
          setErrorMessage(err.message);
        } else {
          setErrorMessage(t('auth.verificationExpired'));
        }
      }
    }

    verify();
  }, [token, navigate, t]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative">
      <div className="absolute top-4 right-4 z-50">
        <LanguageSelector align="end" />
      </div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm text-center space-y-6">
        {status !== 'verifying' && (
          <img src={logoImg} alt={t('brand.name', { defaultValue: 'Flowkyn' })} className="h-14 w-14 mx-auto object-contain" />
        )}

        {status === 'verifying' && (
          <div className="space-y-4">
            <LogoLoader size="md" />
            <p className="text-[15px] font-medium text-foreground">{t('auth.verifyingEmail')}</p>
            <p className="text-[13px] text-muted-foreground">{t('auth.pleaseWait')}</p>
          </div>
        )}

        {status === 'success' && (
          <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="space-y-4">
            <div className="h-16 w-16 rounded-full bg-success/10 flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-8 w-8 text-success" />
            </div>
            <h2 className="text-xl font-bold text-foreground">{t('auth.emailVerified')}</h2>
            <p className="text-[13px] text-muted-foreground">{t('auth.redirectingToLogin')}</p>
          </motion.div>
        )}

        {status === 'error' && (
          <div className="space-y-4">
            <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
              <XCircle className="h-8 w-8 text-destructive" />
            </div>
            <h2 className="text-xl font-bold text-foreground">{t('auth.verificationFailedTitle')}</h2>
            <p className="text-[13px] text-muted-foreground">{errorMessage}</p>
            <Link to={ROUTES.LOGIN}>
              <Button variant="outline" className="rounded-xl">{t('auth.goToLogin')}</Button>
            </Link>
          </div>
        )}
      </motion.div>
    </div>
  );
}
