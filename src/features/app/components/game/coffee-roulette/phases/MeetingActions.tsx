/**
 * Meeting Room - Action buttons (Next Topic, Continue, Re-Shuffle, End)
 */
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { MessageCircle, RotateCcw, LogOut, Shuffle } from 'lucide-react';
import { GameActionButton } from '../../shared';

interface MeetingActionsProps {
  onNextPrompt?: () => void;
  onContinue?: () => void;
  onEnd?: () => void;
  onReShuffle?: () => void;
  onStopVoice: () => Promise<void>;
  isLoading: boolean;
}

export function MeetingActions({
  onNextPrompt,
  onContinue,
  onEnd,
  onReShuffle,
  onStopVoice,
  isLoading,
}: MeetingActionsProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-wrap gap-3 justify-center">
      {onNextPrompt && (
        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
          <GameActionButton
            onClick={onNextPrompt}
            size="lg"
            className="gap-3 text-base font-bold shadow-lg hover:shadow-xl transition-all"
            style={{
              backgroundColor: 'var(--color-primary)',
              color: 'white',
              border: 'none',
              boxShadow: '0 12px 24px rgba(108, 92, 231, 0.35)',
            }}
          >
            <MessageCircle className="h-5 w-5" />
            {t('gamePlay.coffeeRoulette.chatting.nextTopicButton')}
          </GameActionButton>
        </motion.div>
      )}

      {onContinue && (
        <GameActionButton
          onClick={onContinue}
          disabled={isLoading}
          variant="outline"
          size="lg"
          className="gap-3 font-semibold"
          style={{ borderColor: '#e5e7eb', borderWidth: '2px', backgroundColor: 'rgba(255, 255, 255, 0.95)' }}
        >
          <RotateCcw className="h-5 w-5" />
          {t('gamePlay.coffeeRoulette.chatting.keepTalkingButton')}
        </GameActionButton>
      )}

      {onReShuffle && (
        <GameActionButton
          onClick={onReShuffle}
          disabled={isLoading}
          variant="outline"
          size="lg"
          className="gap-3 font-semibold"
          style={{ borderColor: '#e5e7eb', borderWidth: '2px', backgroundColor: 'rgba(255, 255, 255, 0.95)' }}
        >
          <Shuffle className="h-5 w-5" />
          {t('gamePlay.coffeeRoulette.chatting.reShuffleButton')}
        </GameActionButton>
      )}

      {onEnd && (
        <GameActionButton
          onClick={async () => {
            await onStopVoice();
            onEnd();
          }}
          disabled={isLoading}
          variant="outline"
          size="lg"
          className="gap-3 font-semibold text-muted-foreground hover:text-foreground"
          style={{ borderColor: '#e5e7eb', borderWidth: '2px' }}
        >
          <LogOut className="h-5 w-5" />
          {t('gamePlay.coffeeRoulette.chatting.endMeetingButton')}
        </GameActionButton>
      )}
    </div>
  );
}
