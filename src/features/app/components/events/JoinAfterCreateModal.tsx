import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { CheckCircle2 } from "lucide-react";

interface JoinAfterCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoin: () => void;
}

export function JoinAfterCreateModal({ isOpen, onClose, onJoin }: JoinAfterCreateModalProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md border-0 p-0 overflow-hidden rounded-2xl shadow-elevated">
        <div className="h-1.5 w-full bg-gradient-to-r from-success/80 to-success" />
        <div className="p-6 pt-8">
          <DialogHeader className="flex flex-col items-center gap-2">
            <div className="h-16 w-16 rounded-3xl bg-success/10 flex items-center justify-center mb-2 animate-bounce-subtle">
              <CheckCircle2 className="h-8 w-8 text-success" />
            </div>
            <DialogTitle className="text-xl sm:text-2xl font-bold text-center tracking-tight">
              {t('events.postCreate.title')}
            </DialogTitle>
            <DialogDescription className="text-center text-muted-foreground text-[14px] leading-relaxed px-2">
              {t('events.postCreate.description')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-3 mt-8">
            <Button
              variant="outline"
              onClick={onClose}
              className="w-full sm:flex-1 h-12 rounded-xl text-[14px] font-medium transition-all hover:bg-muted/50"
            >
              {t('events.postCreate.closeButton')}
            </Button>
            <Button
              onClick={onJoin}
              className="w-full sm:flex-1 h-12 rounded-xl text-[14px] font-semibold brand-gradient text-white border-0 shadow-glow-primary transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              {t('events.postCreate.joinButton')}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
