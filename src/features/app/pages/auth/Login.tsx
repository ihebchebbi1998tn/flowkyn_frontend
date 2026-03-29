/**
 * @fileoverview Login page — premium card-based form design.
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
import { ArrowRight, Mail, Lock } from 'lucide-react';
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
    <div className="space-y-5">
      {/* Logo on mobile */}
      <div className="lg:hidden flex items-center gap-2.5 mb-2">
        <img src={logoImg} alt="Flowkyn" className="h-10 w-10 object-contain" />
        <span className="text-lg font-bold text-foreground tracking-tight">Flowkyn</span>
      </div>

      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-[28px] font-extrabold text-foreground tracking-tight leading-tight">{t('auth.loginTitle')}</h1>
        <p className="text-sm text-muted-foreground/60 leading-relaxed">{t('auth.loginSubtitle')}</p>
      </div>

      {/* Form card */}
      <div className="rounded-2xl border border-border/40 bg-card/40 backdrop-blur-md shadow-2xl shadow-black/[0.04] overflow-hidden">
        <div className="p-7 space-y-5">
          <form onSubmit={handleSubmit} className="space-y-5">
            {successMessage && <AlertBanner type="success" message={successMessage} />}
            {error && <AlertBanner type="error" message={error} onClose={() => setError('')} />}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-[11px] font-semibold text-foreground/60 uppercase tracking-wider">{t('auth.email')}</Label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-muted-foreground/30 group-focus-within:text-primary/60 transition-colors" />
                <Input
                  id="email"
                  type="email"
                  placeholder={t('auth.emailPlaceholder', { defaultValue: 'you@company.com' })}
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                   className="h-12 pl-12 text-sm rounded-xl bg-background/60 border-border/50 focus-visible:ring-2 focus-visible:ring-primary/25 focus-visible:border-primary/40 focus-visible:bg-background transition-all placeholder:text-muted-foreground/35"
                  autoFocus
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-[11px] font-semibold text-foreground/60 uppercase tracking-wider">{t('auth.password')}</Label>
                <button
                  type="button"
                  onClick={() => switchView('forgot')}
                  className="text-[11px] text-primary/70 hover:text-primary hover:underline font-medium transition-colors"
                >
                  {t('auth.forgotPassword')}
                </button>
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-muted-foreground/30 group-focus-within:text-primary/60 transition-colors z-10" />
                <PasswordInput
                  id="password"
                  placeholder={t('auth.passwordMask', { defaultValue: '••••••••' })}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="h-12 pl-12 text-sm rounded-xl bg-background/60 border-border/50 focus-visible:ring-2 focus-visible:ring-primary/25 focus-visible:border-primary/40 focus-visible:bg-background transition-all placeholder:text-muted-foreground/35"
                />
              </div>
            </div>

            <LoadingButton
              type="submit" loading={isLoading}
              className="w-full h-12 text-sm text-white gap-2 rounded-xl font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:brightness-110 active:scale-[0.98] transition-all duration-200"
            >
              {t('auth.login')}
              <ArrowRight className="h-4 w-4" />
            </LoadingButton>
          </form>
        </div>

        {/* Card footer separator */}
        <div className="border-t border-border/20 bg-muted/10 px-7 py-4">
          <p className="text-center text-[13px] text-muted-foreground/60">
            {t('auth.noAccount')}{' '}
            <button
              type="button"
              onClick={() => switchView('register')}
              className="text-primary font-semibold hover:underline transition-colors cursor-pointer"
            >
              {t('auth.register')}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}