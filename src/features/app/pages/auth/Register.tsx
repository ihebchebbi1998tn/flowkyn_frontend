/**
 * @fileoverview Register page — premium split-panel with smooth animations.
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { LoadingButton } from '@/components/ui/loading-button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Label } from '@/components/ui/label';
import { AlertBanner } from '@/components/notifications/AlertBanner';
import { ROUTES } from '@/constants/routes';
import { ArrowRight } from 'lucide-react';
import { trackEvent, TRACK } from '@/hooks/useTracker';
import { AuthBrandingPanel } from '@/features/app/components/auth/AuthBrandingPanel';
import { ApiError } from '@/lib/apiError';
import logoImg from '@/assets/logo.png';

export default function Register() {
  const { t } = useTranslation();
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', confirmPassword: '', orgName: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const update = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.email || !form.password || !form.firstName || !form.lastName) { setError(t('auth.errors.required')); return; }
    if (form.password.length < 8) { setError(t('auth.errors.passwordMin')); return; }
    if (form.password !== form.confirmPassword) { setError(t('auth.errors.passwordMatch')); return; }
    setIsLoading(true);
    trackEvent(TRACK.REGISTER_START, { email: form.email });
    try {
      const lang = navigator.language?.split('-')[0] || 'en';
      await register({ email: form.email, password: form.password, name: `${form.firstName} ${form.lastName}`.trim(), lang });
      trackEvent(TRACK.REGISTER_SUCCESS, { email: form.email });
      navigate('/verify-otp', { state: { email: form.email, password: form.password } });
    } catch (err: unknown) {
      // Check if error is an ApiError with a specific error code
      if (ApiError.is(err)) {
        const errorMessage = t(`apiErrors.${err.code}`, null);
        if (errorMessage && errorMessage !== `apiErrors.${err.code}`) {
          setError(errorMessage);
        } else {
          setError(t('auth.errors.registerFailed'));
        }
      } else {
        setError(t('auth.errors.registerFailed'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <AuthBrandingPanel mode="register" />

      {/* Form panel */}
      <div className="flex-1 flex items-center justify-center bg-background p-6">
        <motion.div
          className="w-full max-w-[400px] space-y-6"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="lg:hidden mb-4">
            <img src={logoImg} alt="Flowkyn" className="h-12 w-12 object-contain" />
          </div>

          <div className="space-y-1.5">
            <h1 className="text-[22px] font-bold text-foreground tracking-tight">{t('auth.registerTitle')}</h1>
            <p className="text-[13px] text-muted-foreground leading-relaxed">{t('auth.registerSubtitle')}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {error && <AlertBanner type="error" message={error} onClose={() => setError('')} />}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[13px] font-medium">{t('auth.firstName')}</Label>
                <Input
                  className="h-11 text-[13px] rounded-xl"
                  value={form.firstName}
                  onChange={e => update('firstName', e.target.value)}
                  autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[13px] font-medium">{t('auth.lastName')}</Label>
                <Input
                  className="h-11 text-[13px] rounded-xl"
                  value={form.lastName}
                  onChange={e => update('lastName', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[13px] font-medium">{t('auth.email')}</Label>
              <Input
                type="email" className="h-11 text-[13px] rounded-xl"
                value={form.email} onChange={e => update('email', e.target.value)}
                placeholder="you@company.com"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[13px] font-medium">{t('auth.password')}</Label>
              <PasswordInput
                className="h-11 text-[13px] rounded-xl"
                value={form.password} onChange={e => update('password', e.target.value)}
                placeholder={t('auth.passwordPlaceholder')}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[13px] font-medium">{t('auth.confirmPassword')}</Label>
              <PasswordInput
                className="h-11 text-[13px] rounded-xl"
                value={form.confirmPassword} onChange={e => update('confirmPassword', e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[13px] font-medium">
                {t('auth.orgName')} <span className="text-muted-foreground font-normal">({t('auth.optional')})</span>
              </Label>
              <Input
                className="h-11 text-[13px] rounded-xl"
                value={form.orgName} onChange={e => update('orgName', e.target.value)}
              />
            </div>

            <LoadingButton
              type="submit" loading={isLoading}
              className="w-full h-11 text-[13px] gap-2 rounded-xl font-semibold shadow-md shadow-primary/15"
            >
              {t('auth.register')}
              <ArrowRight className="h-3.5 w-3.5" />
            </LoadingButton>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border/60" /></div>
            <div className="relative flex justify-center">
              <span className="bg-background px-3 text-[11px] text-muted-foreground/60 uppercase tracking-wider font-medium">
                {t('auth.or')}
              </span>
            </div>
          </div>

          <p className="text-center text-[13px] text-muted-foreground">
            {t('auth.hasAccount')}{' '}
            <Link to={ROUTES.LOGIN} className="text-primary hover:underline font-semibold transition-colors">
              {t('auth.login')}
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
