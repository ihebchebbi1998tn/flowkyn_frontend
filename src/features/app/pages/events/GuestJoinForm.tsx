/**
 * @fileoverview Guest join form for the event lobby — fully i18n.
 */

import { useTranslation } from 'react-i18next';
import { User, Mail, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AvatarPicker } from '@/components/common/AvatarPicker';

interface GuestJoinFormProps {
  eventTitle: string;
  guestName: string;
  setGuestName: (v: string) => void;
  guestEmail: string;
  setGuestEmail: (v: string) => void;
  selectedAvatar?: string;
  setSelectedAvatar: (v: string | undefined) => void;
  onJoin: () => void;
  onBack: () => void;
  isPending: boolean;
}

export function GuestJoinForm({
  eventTitle, guestName, setGuestName, guestEmail, setGuestEmail,
  selectedAvatar, setSelectedAvatar, onJoin, onBack, isPending,
}: GuestJoinFormProps) {
  const { t } = useTranslation();

  return (
    <div className="min-h-[80vh] flex items-center justify-center animate-fade-in">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center space-y-3">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            <User className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">{t('events.guestJoin')}</h1>
          <p className="text-sm text-muted-foreground">
            {t('events.enterYourName')} <span className="font-medium text-foreground">{eventTitle}</span>
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-medium text-foreground">{t('events.yourName')} *</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder={t('events.enterYourName')} value={guestName} onChange={(e) => setGuestName(e.target.value)} className="pl-10 h-11" autoFocus />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-foreground">{t('events.emailOptional')}</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input type="email" placeholder="your@email.com" value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)} className="pl-10 h-11" />
            </div>
          </div>

          <AvatarPicker seed={guestName || 'guest'} onSelect={setSelectedAvatar} selectedUri={selectedAvatar} />

          {selectedAvatar && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/20">
              <img src={selectedAvatar} alt="Selected avatar" className="h-10 w-10 rounded-xl" />
              <div>
                <p className="text-xs font-medium text-foreground">{guestName || t('events.guest')}</p>
                <p className="text-[10px] text-muted-foreground">{t('events.yourAvatarForEvent')}</p>
              </div>
            </div>
          )}

          <Button className="w-full h-11 gap-2" disabled={!guestName.trim() || isPending} onClick={onJoin}>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <>{t('events.joinEvent')} <ArrowRight className="h-4 w-4" /></>}
          </Button>

          <button className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors" onClick={onBack}>
            {t('events.backToLobby')}
          </button>
        </div>
      </div>
    </div>
  );
}
