/**
 * @fileoverview Register page — premium card-based form design.
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/features/app/context/AuthContext';
import { useAuthSwitch } from './AuthSwitchContext';
import { LoadingButton } from '@/components/ui/loading-button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Label } from '@/components/ui/label';
import { AlertBanner } from '@/components/notifications/AlertBanner';
import { ArrowRight, Check, X, Mail, Lock, User } from 'lucide-react';
import { trackEvent, TRACK } from '@/hooks/useTracker';
import { ApiError } from '@/lib/apiError';
import logoImg from '@/assets/logo.png';

export default function Register() {
  const { t } = useTranslation();
  const { register } = useAuth();
  const navigate = useNavigate();
  const { switchView } = useAuthSwitch();
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const update = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));

  const hasMinLength = form.password.length >= 7;
  const hasUppercase = /[A-Z]/.test(form.password);
  const hasNumber = /[0-9]/.test(form.password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.email || !form.password || !form.firstName || !form.lastName) { setError(t('auth.errors.required')); return; }
    if (!hasMinLength || !hasUppercase || !hasNumber) { setError(t('auth.errors.passwordMin')); return; }
    if (form.password !== form.confirmPassword) { setError(t('auth.errors.passwordMatch')); return; }
    setIsLoading(true);
    trackEvent(TRACK.REGISTER_START, { email: form.email });
    try {
      const lang = navigator.language?.split('-')[0] || 'en';
      await register({ email: form.email, password: form.password, name: `${form.firstName} ${form.lastName}`.trim(), lang });
      trackEvent(TRACK.REGISTER_SUCCESS, { email: form.email });
      navigate('/verify-otp', { state: { email: form.email, password: form.password } });
    } catch (err: unknown) {
      if (ApiError.is(err)) {
        const localizedMessage = t(`apiErrors.${err.code}`, '');
        if (localizedMessage) {
          setError(localizedMessage);
        } else if (err.details && err.details.length > 0) {
          setError(err.details.map(d => d.message).join('. '));
        } else {
          setError(err.message || t('auth.errors.registerFailed'));
        }
      } else {
        setError(t('auth.errors.registerFailed'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const inputCls = "h-12 text-sm rounded-xl bg-background/60 border-border/50 focus-visible:ring-2 focus-visible:ring-primary/25 focus-visible:border-primary/40 focus-visible:bg-background transition-all placeholder:text-muted-foreground/35";

  return (
    <div className="space-y-5">
      {/* Logo on mobile */}
      <div className="lg:hidden flex items-center gap-2.5 mb-2">
        <img src={logoImg} alt="Flowkyn" className="h-10 w-10 object-contain" />
        <span className="text-lg font-bold text-foreground tracking-tight">Flowkyn</span>
      </div>

      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-[28px] font-extrabold text-foreground tracking-tight leading-tight">{t('auth.registerTitle')}</h1>
        <p className="text-sm text-muted-foreground/60 leading-relaxed">{t('auth.registerSubtitle')}</p>
      </div>

      {/* Form card */}
      <div className="rounded-2xl border border-border/40 bg-card/40 backdrop-blur-md shadow-2xl shadow-black/[0.04] overflow-hidden">
        <div className="p-7 space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <AlertBanner type="error" message={error} onClose={() => setError('')} />}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-[11px] font-semibold text-foreground/60 uppercase tracking-wider">{t('auth.firstName')}</Label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-muted-foreground/30 group-focus-within:text-primary/60 transition-colors" />
                  <Input className={`pl-12 ${inputCls}`} value={form.firstName} onChange={e => update('firstName', e.target.value)} autoFocus />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[11px] font-semibold text-foreground/60 uppercase tracking-wider">{t('auth.lastName')}</Label>
                <Input className={inputCls} value={form.lastName} onChange={e => update('lastName', e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[11px] font-semibold text-foreground/60 uppercase tracking-wider">{t('auth.email')}</Label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-muted-foreground/30 group-focus-within:text-primary/60 transition-colors" />
                <Input
                  type="email" className={`pl-12 ${inputCls}`}
                  value={form.email} onChange={e => update('email', e.target.value)}
                  placeholder={t('auth.emailPlaceholder', { defaultValue: 'you@company.com' })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[11px] font-semibold text-foreground/60 uppercase tracking-wider">{t('auth.password')}</Label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-muted-foreground/30 group-focus-within:text-primary/60 transition-colors z-10" />
                <PasswordInput
                  className={`pl-12 ${inputCls}`}
                  value={form.password} onChange={e => update('password', e.target.value)}
                  placeholder={t('auth.passwordPlaceholder')}
                />
              </div>
              {form.password.length > 0 && (
                <div className="flex items-center gap-4 pt-1 px-0.5">
                  {[
                    { ok: hasMinLength, label: t('auth.passwordRules.minLength') },
                    { ok: hasUppercase, label: t('auth.passwordRules.uppercase') },
                    { ok: hasNumber, label: t('auth.passwordRules.number') },
                  ].map(rule => (
                    <div key={rule.label} className={`flex items-center gap-1 text-[10px] font-medium transition-colors ${rule.ok ? 'text-primary' : 'text-muted-foreground/35'}`}>
                      {rule.ok ? <Check className="h-3 w-3" /> : <X className="h-3 w-3 opacity-40" />}
                      {rule.label}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-[11px] font-semibold text-foreground/60 uppercase tracking-wider">{t('auth.confirmPassword')}</Label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-muted-foreground/30 group-focus-within:text-primary/60 transition-colors z-10" />
                <PasswordInput
                  className={`pl-12 ${inputCls}`}
                  value={form.confirmPassword} onChange={e => update('confirmPassword', e.target.value)}
                />
              </div>
            </div>

            <LoadingButton
              type="submit" loading={isLoading}
              className="w-full h-12 text-sm text-white gap-2 rounded-xl font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:brightness-110 active:scale-[0.98] transition-all duration-200"
            >
              {t('auth.register')}
              <ArrowRight className="h-4 w-4" />
            </LoadingButton>
          </form>
        </div>

        {/* Card footer */}
        <div className="border-t border-border/20 bg-muted/10 px-7 py-4">
          <p className="text-center text-[13px] text-muted-foreground/60">
            {t('auth.hasAccount')}{' '}
            <button
              type="button"
              onClick={() => switchView('login')}
              className="text-primary font-semibold hover:underline transition-colors cursor-pointer"
            >
              {t('auth.login')}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}