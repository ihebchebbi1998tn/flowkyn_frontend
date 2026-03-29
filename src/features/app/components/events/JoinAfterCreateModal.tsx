import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslation } from "react-i18next";
import { CheckCircle2, Copy, CheckCircle, Link2 } from "lucide-react";
import { useState } from "react";
import { copyToClipboard } from "@/utils/clipboard";
import { toast } from "sonner";

interface JoinAfterCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoin: () => void;
  eventId?: string | null;
  gameId?: string;
}

export function JoinAfterCreateModal({ isOpen, onClose, onJoin, eventId, gameId = '1' }: JoinAfterCreateModalProps) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const joinLink = eventId
    ? `${window.location.origin}/join/${eventId}?activity=${gameId}`
    : '';

  const handleCopy = async () => {
    if (!joinLink) return;
    const ok = await copyToClipboard(joinLink);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else {
      toast.error(t('common.copyFailed', 'Failed to copy'));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md border-0 p-0 overflow-hidden rounded-2xl shadow-elevated">
        <div className="h-1.5 w-full bg-gradient-to-r from-success/80 to-success" />
        <div className="p-6 pt-8 space-y-5">
          <DialogHeader className="flex flex-col items-center gap-2">
            <div className="h-14 w-14 rounded-2xl bg-success/10 flex items-center justify-center mb-1">
              <CheckCircle2 className="h-7 w-7 text-success" />
            </div>
            <DialogTitle className="text-lg font-bold text-center tracking-tight">
              {t('events.postCreate.title')}
            </DialogTitle>
            <DialogDescription className="text-center text-muted-foreground text-[13px] leading-relaxed">
              {t('events.postCreate.description')}
            </DialogDescription>
          </DialogHeader>

          {/* Invite link */}
          {joinLink && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Link2 className="h-3 w-3" />
                {t('events.postCreate.inviteLink')}
              </label>
              <div className="flex items-center gap-2">
                <Input
                  value={joinLink}
                  readOnly
                  className="h-9 text-[12px] bg-muted/30 flex-1 border-border/50"
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                />
                <Button size="sm" variant="outline" onClick={handleCopy} className="h-9 text-[11px] gap-1 shrink-0">
                  {copied ? <CheckCircle className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
                  {copied ? t('events.copied') : t('events.copy')}
                </Button>
              </div>
            </div>
          )}

          <DialogFooter className="flex flex-col sm:flex-row gap-2.5">
            <Button
              variant="outline"
              onClick={onClose}
              className="w-full sm:flex-1 h-11 rounded-xl text-[13px] font-medium"
            >
              {t('events.postCreate.closeButton')}
            </Button>
            <Button
              onClick={onJoin}
              className="w-full sm:flex-1 h-11 rounded-xl text-[13px] font-semibold brand-gradient text-white border-0 shadow-glow-primary"
            >
              {t('events.postCreate.joinButton')}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
