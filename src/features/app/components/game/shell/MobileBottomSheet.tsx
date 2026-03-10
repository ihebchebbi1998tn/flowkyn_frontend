import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Trophy, ChevronUp, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type MobileTab = 'chat' | 'leaderboard';

interface MobileBottomSheetProps {
  activeTab: MobileTab | null;
  onToggle: (tab: MobileTab) => void;
  onClose: () => void;
  chatContent: React.ReactNode;
  leaderboardContent: React.ReactNode;
}

export function MobileBottomSheet({
  activeTab, onToggle, onClose, chatContent, leaderboardContent,
}: MobileBottomSheetProps) {
  const { t } = useTranslation();
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
      <AnimatePresence>
        {activeTab && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-background/60 backdrop-blur-sm z-40"
              onClick={onClose}
            />

            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="relative z-50 bg-card border-t border-border rounded-t-2xl shadow-2xl shadow-black/20 max-h-[70vh] flex flex-col"
            >
              <div className="flex items-center justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-muted-foreground/20" />
              </div>

              <div className="flex items-center justify-between px-4 pb-3 border-b border-border">
                <div className="flex items-center gap-2">
                  {activeTab === 'chat' ? (
                    <><MessageCircle className="h-4 w-4 text-primary" /><span className="text-[13px] font-semibold text-foreground">{t('gamePlay.shell.chat')}</span></>
                  ) : (
                    <><Trophy className="h-4 w-4 text-primary" /><span className="text-[13px] font-semibold text-foreground">{t('gamePlay.leaderboard.title')}</span></>
                  )}
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={onClose}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                {activeTab === 'chat' ? chatContent : leaderboardContent}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {!activeTab && (
        <div className="bg-card/95 backdrop-blur-lg border-t border-border px-4 py-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggle('chat')}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl transition-all",
                "bg-muted/50 hover:bg-muted active:scale-[0.98]"
              )}
            >
              <MessageCircle className="h-4 w-4 text-primary" />
              <span className="text-[12px] font-semibold text-foreground">{t('gamePlay.shell.chat')}</span>
              <ChevronUp className="h-3 w-3 text-muted-foreground" />
            </button>

            <button
              onClick={() => onToggle('leaderboard')}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl transition-all",
                "bg-muted/50 hover:bg-muted active:scale-[0.98]"
              )}
            >
              <Trophy className="h-4 w-4 text-warning" />
              <span className="text-[12px] font-semibold text-foreground">{t('gamePlay.shell.scores')}</span>
              <ChevronUp className="h-3 w-3 text-muted-foreground" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
