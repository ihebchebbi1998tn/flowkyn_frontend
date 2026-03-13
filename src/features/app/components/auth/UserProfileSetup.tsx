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
  /** Title shown at top */
  title?: string;
  /** Subtitle / description */
  subtitle?: string;
  /** Pre-filled name (e.g., from auth user) */
  defaultName?: string;
  /** Pre-filled avatar URL */
  defaultAvatarUrl?: string;
  /** Label for the submit button */
  submitLabel?: string;
  /** Whether the form is loading / pending */
  isPending?: boolean;
  /** On submit with the chosen profile data */
  onSubmit: (data: ProfileSetupData) => void;
  /** Optional back button */
  onBack?: () => void;
  /** Show as a modal overlay (used in-game) */
  asModal?: boolean;
  onClose?: () => void;
  /** Show email field (guests only) */
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

  const resolvedTitle = title ?? t('profileSetup.chooseIdentity');
  const resolvedSubtitle = subtitle ?? t('profileSetup.pickNickname');
  const resolvedSubmitLabel = submitLabel ?? t('profileSetup.continue');
  const canSubmit = name.trim().length > 0;

  const handleSubmit = () => {
    if (!canSubmit) return;
    if (!avatarUrl) {
      // Auto-pick a placeholder — just submit with initials fallback
    }
    onSubmit({ displayName: name.trim(), avatarUrl: avatarUrl || '' });
    if (asModal) {
      setSaved(true);
      setTimeout(() => { setSaved(false); onClose?.(); }, 800);
    }
  };

  const inner = (
    <div className={cn("w-full max-w-lg space-y-6", !asModal && "mx-auto")}>
      {/* Header */}
      {!asModal && (
        <div className="text-center space-y-2">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            <User className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">{resolvedTitle}</h1>
          <p className="text-sm text-muted-foreground">{resolvedSubtitle}</p>
        </div>
      )}

      <div className={cn("rounded-2xl border border-border bg-card space-y-5", asModal ? "p-5" : "p-6")}>
        {/* Nickname */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-foreground uppercase tracking-wider">{t('profileSetup.nickname')}</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('profileSetup.nicknamePlaceholder')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="pl-10 h-11"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            />
          </div>
        </div>

        {/* Email (guests only) */}
        {showEmail && onEmailChange && (
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground uppercase tracking-wider">{t('profileSetup.emailOptional')}</Label>
            <Input
              type="email"
              placeholder={t('profileSetup.emailPlaceholder')}
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              className="h-11"
            />
          </div>
        )}

        {/* Avatar picker */}
        <div className="space-y-2">
          <AvatarPicker
            seed={name || 'player'}
            onSelect={setAvatarUrl}
            selectedUri={avatarUrl}
            count={27}
            cols={9}
          />
        </div>

        {/* Preview */}
        <AnimatePresence>
          {(name.trim() || avatarUrl) && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-primary/5 border border-primary/15"
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt={t('profileSetup.yourAvatar')} className="h-10 w-10 rounded-xl object-cover shrink-0" />
              ) : (
                <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                  {(name || '?').slice(0, 2).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{name || t('profileSetup.yourName')}</p>
                <p className="text-[10px] text-muted-foreground">{t('profileSetup.appearInGame')}</p>
              </div>
              {canSubmit && <CheckCircle className="h-4 w-4 text-success ml-auto shrink-0" />}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Actions */}
        <div className="flex gap-2">
          {onBack && !asModal && (
            <Button variant="outline" onClick={onBack} className="flex-1 h-11">
              {t('profileSetup.back')}
            </Button>
          )}
          <Button
            className={cn("h-11 gap-2 font-semibold", (!onBack || asModal) && "w-full")}
            disabled={!canSubmit || isPending}
            onClick={handleSubmit}
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
          className="w-full max-w-lg"
        >
          <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-gradient-to-r from-primary/5 to-transparent">
              <div className="flex items-center gap-2">
                <Pencil className="h-4 w-4 text-primary" />
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
