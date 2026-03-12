/**
 * OTP / Email Verification page — verifies the user's email after registration.
 * After successful verification, auto-logs in and redirects to onboarding.
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { CheckCircle2, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Input } from '@/components/ui/input';
import { AlertBanner } from '@/components/notifications/AlertBanner';
import { useAuth } from '@/context/AuthContext';
import { authApi } from '@/features/app/api/auth';
import { ApiError } from '@/lib/apiError';
import { ROUTES } from '@/constants/routes';
import { trackEvent, TRACK } from '@/hooks/useTracker';
import logoImg from '@/assets/logo.png';

export default function OTPVerify() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const state = location.state as { email?: string; password?: string } | null;
  const initialEmail = state?.email || '';
  const password = state?.password || '';

  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [verified, setVerified] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [isChangingEmail, setIsChangingEmail] = useState(false);

  const handleVerify = async () => {
    if (code.length < 6) return;
    setIsLoading(true);
    setError('');
    try {
      await authApi.verifyEmail(code);
      trackEvent(TRACK.EMAIL_VERIFIED, { email });
      setVerified(true);
      setTimeout(async () => {
        try {
          await login(email, password);
          navigate(ROUTES.ONBOARDING, { replace: true });
        } catch {
          navigate(ROUTES.LOGIN, { replace: true });
        }
      }, 2000);
    } catch (err) {
      if (ApiError.is(err)) {
        setError(err.message);
      } else {
        setError(t('auth.errors.verificationFailed'));
      }
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email || resendCooldown > 0) return;
    try {
      const lang = navigator.language?.split('-')[0] || 'en';
      await authApi.resendVerification(email, lang);
      toast.success(t('auth.codeResent'));
      setResendCooldown(120); // 2 minutes
      const interval = setInterval(() => {
        setResendCooldown(prev => {
          if (prev <= 1) { clearInterval(interval); return 0; }
          return prev - 1;
        });
      }, 1000);
    } catch (err: unknown) {
      if (ApiError.is(err)) {
        // Check for specific error codes and handle accordingly
        if (err.code === 'AUTH_ALREADY_VERIFIED') {
          toast.info(t('auth.alreadyVerified'));
          navigate(ROUTES.LOGIN, { replace: true });
        } else {
          // Try to get translated error message from apiErrors namespace
          const errorMessage = t(`apiErrors.${err.code}`, null);
          if (errorMessage && errorMessage !== `apiErrors.${err.code}`) {
            toast.error(errorMessage);
          } else {
            toast.error(t('auth.resendFailed'));
          }
        }
      } else {
        toast.error(t('auth.resendFailed'));
      }
    }
  };

  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newEmail.includes('@')) {
      toast.error(t('auth.errors.invalidEmail'));
      return;
    }
    setIsChangingEmail(true);
    try {
      // Update email in state and close dialog
      setEmail(newEmail);
      setNewEmail('');
      setShowEmailDialog(false);
      setCode('');
      setResendCooldown(0);
      toast.success(t('common.success'));
      // Resend code to new email
      const lang = navigator.language?.split('-')[0] || 'en';
      await authApi.resendVerification(newEmail, lang);
      toast.success(t('auth.codeResent'));
      setResendCooldown(120);
      const interval = setInterval(() => {
        setResendCooldown(prev => {
          if (prev <= 1) { clearInterval(interval); return 0; }
          return prev - 1;
        });
      }, 1000);
    } catch (err: unknown) {
      if (ApiError.is(err)) {
        const errorMessage = t(`apiErrors.${err.code}`, null);
        if (errorMessage && errorMessage !== `apiErrors.${err.code}`) {
          toast.error(errorMessage);
        } else {
          toast.error(t('common.error'));
        }
      } else {
        toast.error(t('common.error'));
      }
    } finally {
      setIsChangingEmail(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <AnimatePresence mode="wait">
        {verified ? (
          <motion.div
            key="success"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            className="flex flex-col items-center gap-6 text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.15 }}
              className="relative"
            >
              <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center">
                <motion.div initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.5, delay: 0.3 }}>
                  <CheckCircle2 className="h-12 w-12 text-primary" strokeWidth={2} />
                </motion.div>
              </div>
              <motion.div initial={{ scale: 0.8, opacity: 0.6 }} animate={{ scale: 1.6, opacity: 0 }} transition={{ duration: 1.2, delay: 0.2, ease: 'easeOut' }} className="absolute inset-0 rounded-full border-2 border-primary/30" />
              <motion.div initial={{ scale: 0.8, opacity: 0.4 }} animate={{ scale: 2, opacity: 0 }} transition={{ duration: 1.5, delay: 0.4, ease: 'easeOut' }} className="absolute inset-0 rounded-full border-2 border-primary/20" />
            </motion.div>
            <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }} className="space-y-2">
              <h2 className="text-2xl font-bold text-foreground">{t('auth.emailVerified')}</h2>
              <p className="text-sm text-muted-foreground">{t('auth.settingUpAccount')}</p>
            </motion.div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="flex items-center gap-2 text-xs text-muted-foreground/60">
              <div className="h-1 w-16 rounded-full bg-muted overflow-hidden">
                <motion.div initial={{ x: '-100%' }} animate={{ x: '100%' }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="h-full w-full bg-primary/40 rounded-full" />
              </div>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div key="form" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }} className="w-full max-w-[400px] space-y-8">
            <div className="flex flex-col items-center gap-4">
              <img src={logoImg} alt="Flowkyn" className="h-16 w-16 object-contain" />
            </div>
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-2">
                <ShieldCheck className="h-3.5 w-3.5" />
                {t('auth.secureVerification')}
              </div>
              <h1 className="text-2xl font-bold text-foreground">{t('auth.otpTitle')}</h1>
              <p className="text-sm text-muted-foreground leading-relaxed">{t('auth.otpSent')}</p>
              {email && (
                <div className="flex items-center justify-center gap-2 mt-3">
                  <p className="text-sm font-semibold text-foreground">{email}</p>
                  <button
                    onClick={() => setShowEmailDialog(true)}
                    className="text-xs text-primary hover:underline font-medium transition-colors"
                  >
                    {t('auth.changeEmail')}
                  </button>
                </div>
              )}
            </div>
            <div className="space-y-6">
              {error && <AlertBanner type="error" message={error} onClose={() => setError('')} />}
              <div className="flex justify-center">
                <InputOTP maxLength={6} value={code} onChange={setCode}>
                  <InputOTPGroup className="gap-2">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <InputOTPSlot key={i} index={i} className="h-12 w-12 text-lg font-semibold rounded-xl border-2 border-border/60 first:rounded-l-xl last:rounded-r-xl transition-all data-[active=true]:border-primary data-[active=true]:ring-2 data-[active=true]:ring-primary/20" />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              </div>
              <Button className="w-full h-11 text-sm rounded-xl font-medium" onClick={handleVerify} disabled={code.length < 6 || isLoading}>
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                    {t('auth.verifying')}
                  </div>
                ) : t('auth.verifyOTP')}
              </Button>
              <div className="text-center">
                <button onClick={handleResend} disabled={resendCooldown > 0} className="text-sm text-muted-foreground hover:text-primary transition-colors disabled:opacity-50">
                  {resendCooldown > 0 ? t('auth.resendIn', { seconds: resendCooldown }) : t('auth.resendOTP')}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Email Change Dialog */}
      <AnimatePresence>
        {showEmailDialog && (
          <motion.div
            key="email-dialog"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowEmailDialog(false)}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-[400px] bg-background rounded-xl border border-border/60 shadow-lg p-6 space-y-4"
            >
              <h2 className="text-lg font-bold text-foreground">{t('auth.changeEmail')}</h2>
              <p className="text-sm text-muted-foreground">{t('auth.enterNewEmail')}</p>
              <form onSubmit={handleChangeEmail} className="space-y-4">
                <Input
                  type="email"
                  placeholder="new@email.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="h-11 text-sm rounded-xl"
                  autoFocus
                />
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 h-10 rounded-xl"
                    onClick={() => setShowEmailDialog(false)}
                  >
                    {t('common.cancel')}
                  </Button>
                  <Button
                    type="submit"
                    disabled={!newEmail || isChangingEmail}
                    className="flex-1 h-10 rounded-xl"
                  >
                    {isChangingEmail ? (
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                        {t('auth.emailChanging')}
                      </div>
                    ) : (
                      t('auth.updateEmail')
                    )}
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
