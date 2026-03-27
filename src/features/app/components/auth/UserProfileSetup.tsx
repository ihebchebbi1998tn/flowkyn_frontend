/**
 * @fileoverview UserProfileSetup — used by ALL users (guests AND authenticated) before joining an event.
 * Also used as an in-game modal to edit avatar + nickname.
 */
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { User, ArrowRight, Loader2, Pencil, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AvatarPicker } from '@/components/common/AvatarPicker';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { getSafeImageUrl } from '@/features/app/utils/assets';

export interface ProfileSetupData {
  displayName: string;
  avatarUrl: string;
}

interface UserProfileSetupProps {
  title?: string;
  subtitle?: string;
  defaultName?: string;
  defaultAvatarUrl?: string;
  submitLabel?: string;
  isPending?: boolean;
  onSubmit: (data: ProfileSetupData) => void | Promise<void>;
  onBack?: () => void;
  asModal?: boolean;
  onClose?: () => void;
  showEmail?: boolean;
  email?: string;
  onEmailChange?: (v: string) => void;
}

export function UserProfileSetup({
  title,
  subtitle,
  defaultName = '',
  defaultAvatarUrl,
  submitLabel,
  isPending = false,
  onSubmit,
  onBack,
  asModal = false,
  onClose,
  showEmail = false,
  email = '',
  onEmailChange,
}: UserProfileSetupProps) {
  const { t } = useTranslation();
  const [name, setName] = useState(defaultName);
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(getSafeImageUrl(defaultAvatarUrl));
  const [saved, setSaved] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmittingLocal, setIsSubmittingLocal] = useState(false);

  const resolvedSubmitLabel = submitLabel ?? t('profileSetup.continue');
  const nameTrimmed = name.trim();
  const MIN_NAME_LEN = 2;
  const nameError =
    nameTrimmed.length === 0
      ? t('auth.errors.required')
      : nameTrimmed.length < MIN_NAME_LEN
        ? t('profileSetup.errors.nameTooShort', { min: MIN_NAME_LEN })
        : null;
  const canSubmit = !nameError;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitError(null);
    setIsSubmittingLocal(true);
    try {
      await Promise.resolve(
        onSubmit({ displayName: name.trim(), avatarUrl: avatarUrl || '' }),
      );
      if (asModal) {
        setSaved(true);
        setTimeout(() => {
          setSaved(false);
          onClose?.();
        }, 800);
      }
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        t('profileSetup.submitFailed', { defaultValue: 'Failed to save profile' });
      setSubmitError(message);
    } finally {
      setIsSubmittingLocal(false);
    }
  };

  const inner = (
    <div className={cn("w-full max-w-md space-y-5", !asModal && "mx-auto")}>
      {/* Compact header — no icon block, just text */}
      {!asModal && (
        <div className="text-center space-y-1">
          <h1 className="text-lg font-bold text-foreground">{title ?? t('profileSetup.chooseIdentity')}</h1>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
      )}

      <div className={cn("rounded-2xl border border-border bg-card space-y-4", asModal ? "p-5" : "p-5")}>
        {/* Nickname */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">{t('profileSetup.nickname')}</Label>
          <div className="relative">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="absolute left-2.5 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full object-cover" />
            ) : (
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            )}
            <Input
              placeholder={t('profileSetup.nicknamePlaceholder')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="pl-10 h-10"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            />
          </div>
        </div>

        {/* Email (guests only) */}
        {showEmail && onEmailChange && (
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">{t('profileSetup.emailOptional')}</Label>
            <Input
              type="email"
              placeholder={t('profileSetup.emailPlaceholder')}
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              className="h-10"
            />
          </div>
        )}

        {/* Avatar picker — 4 rows × 6 cols */}
        <div className="space-y-1.5">
          <AvatarPicker
            seed={name || 'player'}
            onSelect={setAvatarUrl}
            selectedUri={avatarUrl}
            count={24}
            cols={6}
          />
        </div>

        {submitError && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-2.5 text-[11px] text-destructive">
            {submitError}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          {onBack && !asModal && (
            <Button variant="outline" onClick={onBack} className="flex-1 h-10">
              {t('profileSetup.back')}
            </Button>
          )}
          <Button
            className={cn("h-10 gap-2 font-semibold", (!onBack || asModal) && "w-full")}
            disabled={!canSubmit || isPending || isSubmittingLocal}
            onClick={() => void handleSubmit()}
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : saved ? (
              <><CheckCircle className="h-4 w-4" /> {t('profileSetup.saved')}</>
            ) : (
              <>{resolvedSubmitLabel} {!asModal && <ArrowRight className="h-4 w-4" />}</>
            )}
          </Button>
        </div>
      </div>
    </div>
  );

  if (asModal) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={(e) => e.target === e.currentTarget && onClose?.()}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-md"
        >
          <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-5 py-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Pencil className="h-3.5 w-3.5 text-primary" />
                <h2 className="text-sm font-bold text-foreground">{t('profileSetup.editProfile')}</h2>
              </div>
              {onClose && (
                <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xs px-2 py-1 rounded-md hover:bg-muted transition-colors">
                  ✕
                </button>
              )}
            </div>
            <div className="p-5">
              {inner}
            </div>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center animate-fade-in px-4">
      {inner}
    </div>
  );
}
