/**
 * @fileoverview Login page — premium split-panel auth layout with smooth transitions.
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/features/app/context/AuthContext';
import { useAuthSwitch } from './AuthSwitchContext';
import { LoadingButton } from '@/components/ui/loading-button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Label } from '@/components/ui/label';
import { AlertBanner } from '@/components/notifications/AlertBanner';
import { ROUTES } from '@/constants/routes';
import { ArrowRight } from 'lucide-react';
import { trackEvent, TRACK } from '@/hooks/useTracker';
import { ApiError } from '@/lib/apiError';
import logoImg from '@/assets/logo.png';

export default function Login() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { switchView } = useAuthSwitch();
  const searchParams = new URLSearchParams(location.search);
  const redirectParam = searchParams.get('redirect');
  const from = redirectParam || (location.state as { from?: { pathname: string } })?.from?.pathname || ROUTES.DASHBOARD;
  const successMessage = (location.state as { message?: string })?.message;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email) { setError(t('auth.errors.required')); return; }
    if (!password) { setError(t('auth.errors.required')); return; }
    setIsLoading(true);
    try {
      await login(email, password);
      trackEvent(TRACK.LOGIN_SUCCESS, { email });
      navigate(from, { replace: true });
    } catch (err: unknown) {
      trackEvent(TRACK.LOGIN_FAILED, { email });
      if (ApiError.is(err)) {
        const errorMessage = t(`apiErrors.${err.code}`, null);
        if (errorMessage && errorMessage !== `apiErrors.${err.code}`) {
          setError(errorMessage);
        } else {
          setError(t('auth.errors.loginFailed'));
        }
      } else {
        setError(t('auth.errors.loginFailed'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-7">
      <div className="lg:hidden mb-4">
        <img src={logoImg} alt="Flowkyn" className="h-12 w-12 object-contain" />
      </div>

      <div className="space-y-1.5">
        <h1 className="text-page-title text-foreground">{t('auth.loginTitle')}</h1>
        <p className="text-body-sm text-muted-foreground leading-relaxed">{t('auth.loginSubtitle')}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {successMessage && <AlertBanner type="success" message={successMessage} />}
        {error && <AlertBanner type="error" message={error} onClose={() => setError('')} />}

        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-body-sm font-medium">{t('auth.email')}</Label>
          <Input
            id="email" type="email" placeholder="you@company.com" value={email}
            onChange={e => setEmail(e.target.value)}
            className="h-11 text-body-sm rounded-xl bg-background border-input focus-visible:ring-primary/30"
            autoFocus
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-body-sm font-medium">{t('auth.password')}</Label>
            <button
              type="button"
              onClick={() => switchView('forgot')}
              className="text-caption text-primary hover:underline font-medium transition-colors"
            >
              {t('auth.forgotPassword')}
            </button>
          </div>
          <PasswordInput
            id="password" placeholder="••••••••" value={password}
            onChange={e => setPassword(e.target.value)}
            className="h-11 text-body-sm rounded-xl"
          />
        </div>

        <LoadingButton
          type="submit" loading={isLoading}
          className="w-full h-11 text-body-sm gap-2 rounded-xl font-semibold shadow-md shadow-primary/15"
        >
          {t('auth.login')}
          <ArrowRight className="h-3.5 w-3.5" />
        </LoadingButton>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border/60" /></div>
        <div className="relative flex justify-center">
          <span className="bg-background px-3 text-label-xs text-muted-foreground/60 uppercase tracking-wider font-medium">
            {t('auth.or')}
          </span>
        </div>
      </div>

      <p className="text-center text-body-sm text-muted-foreground">
        {t('auth.noAccount')}{' '}
        <button
          type="button"
          onClick={() => switchView('register')}
          className="text-primary hover:underline font-semibold transition-colors cursor-pointer"
        >
          {t('auth.register')}
        </button>
      </p>
    </div>
  );
}
