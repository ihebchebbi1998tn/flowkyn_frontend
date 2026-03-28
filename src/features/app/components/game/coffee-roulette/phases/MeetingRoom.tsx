/**
 * Coffee Roulette - Meeting Room (Refactored)
 * Orchestrates sub-components: MeetingHeader, ParticipantAvatar, TopicCard, VoiceControls, MeetingActions
 */

import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { TIMER_WARNING_SECONDS } from '@/features/app/constants/coffeeRoulette';
import { useThemeVariables } from '../theme/RoomThemeContext';
import { useCoffeeVoiceCall } from '../hooks/useCoffeeVoiceCall';
import { VoiceCallModal, type VoiceCallModalData } from '../modals/VoiceCallModal';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { GameActionButton } from '../../shared';
import { MeetingHeader } from './MeetingHeader';
import { ParticipantAvatar } from './ParticipantAvatar';
import { TopicCard } from './TopicCard';
import { VoiceControls } from './VoiceControls';
import { MeetingActions } from './MeetingActions';
import type { MeetingPerson } from './meetingRoom.types';
import type { GamesSocketLike } from '@/features/app/types/socket';

interface MeetingRoomProps {
  person1: MeetingPerson;
  person2: MeetingPerson;
  topic: string;
  timeRemaining: number;
  promptsUsed: number;
  maxPrompts: number;
  decisionRequired?: boolean;
  onNextPrompt?: () => void;
  onContinue?: () => void;
  onEnd?: () => void;
  onReShuffle?: () => void;
  isLoading?: boolean;
  sessionId?: string;
  eventId?: string;
  pairId: string;
  myParticipantId: string;
  partnerParticipantId: string;
  isOfferer: boolean;
  gamesSocket?: GamesSocketLike;
}

export function MeetingRoom({
  person1,
  person2,
  topic,
  timeRemaining,
  promptsUsed,
  maxPrompts,
  decisionRequired = false,
  onNextPrompt,
  onContinue,
  onEnd,
  onReShuffle,
  isLoading = false,
  sessionId,
  eventId,
  pairId,
  myParticipantId,
  partnerParticipantId,
  isOfferer,
  gamesSocket,
}: MeetingRoomProps) {
  const { t } = useTranslation();
  const themeVars = useThemeVariables();
  const isWarning = timeRemaining < TIMER_WARNING_SECONDS;
  const [showReShuffleConfirm, setShowReShuffleConfirm] = useState(false);
  const [voiceCallModalData, setVoiceCallModalData] = useState<VoiceCallModalData | null>(null);
  const [isVoiceCallModalOpen, setIsVoiceCallModalOpen] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [remoteVolume, setRemoteVolume] = useState(0.8);

  const {
    status: voiceStatus,
    error: voiceError,
    remoteStream,
    isMuted,
    micLevel,
    micComfort,
    remoteMicLevel,
    remoteMicComfort,
    startVoice,
    stopVoice,
    toggleMute,
    showEnableVoicePrompt,
  } = useCoffeeVoiceCall({
    sessionId: sessionId || '',
    pairId,
    myParticipantId,
    partnerParticipantId,
    isOfferer,
    eventId,
    gamesSocket,
  });

  // Talking indicators
  const TALK_LEVEL = 0.18;
  const localTalking = voiceStatus === 'connected' && !isMuted && micLevel > TALK_LEVEL;
  const remoteTalking = voiceStatus === 'connected' && remoteMicLevel > TALK_LEVEL;
  const person1IsLocal = person1.participantId === myParticipantId;
  const person1Talking = person1IsLocal ? localTalking : remoteTalking;
  const person2Talking = person1IsLocal ? remoteTalking : localTalking;

  // Remote audio
  useEffect(() => {
    if (!audioRef.current || !remoteStream) return;
    audioRef.current.srcObject = remoteStream;
    audioRef.current.volume = remoteVolume;
    void audioRef.current.play().catch(() => {});
  }, [remoteStream]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = remoteVolume;
  }, [remoteVolume]);

  // Voice status text & color
  const voiceStatusText = (() => {
    switch (voiceStatus) {
      case 'idle': return t('gamePlay.coffeeRoulette.voice.statusIdle');
      case 'requesting_microphone': return t('gamePlay.coffeeRoulette.voice.statusRequestingMicrophone');
      case 'connecting': return t('gamePlay.coffeeRoulette.voice.connecting');
      case 'connected': return isMuted ? t('gamePlay.coffeeRoulette.voice.statusMuted') : t('gamePlay.coffeeRoulette.voice.statusUnmuted');
      case 'error': return t('gamePlay.coffeeRoulette.voice.error');
      default: return '';
    }
  })();

  const voiceDotColor = (() => {
    switch (voiceStatus) {
      case 'connected': return isMuted ? '#f59e0b' : '#22c55e';
      case 'connecting': case 'requesting_microphone': return '#8b5cf6';
      case 'error': return '#ef4444';
      default: return '#9ca3af';
    }
  })();

  // Socket listeners for voice call modal
  useEffect(() => {
    if (!gamesSocket) return;

    const handleVoiceCallModal = (data: VoiceCallModalData) => {
      if (data.toParticipantId && data.toParticipantId !== myParticipantId) return;
      setVoiceCallModalData(data);
      setIsVoiceCallModalOpen(true);
    };

    const handleVoiceCallAccepted = (data: { sessionId: string; pairId: string; toParticipantId?: string }) => {
      if (data.sessionId !== sessionId || data.pairId !== pairId) return;
      if (data.toParticipantId && data.toParticipantId !== myParticipantId) return;
      setIsVoiceCallModalOpen(false);
      setTimeout(() => { void startVoice(); }, 300);
    };

    const handleVoiceCallDeclined = (data: { sessionId: string; pairId: string; toParticipantId?: string }) => {
      if (data.sessionId !== sessionId || data.pairId !== pairId) return;
      if (data.toParticipantId && data.toParticipantId !== myParticipantId) return;
      setIsVoiceCallModalOpen(false);
      setVoiceCallModalData(null);
    };

    const handleVoiceCallCancelled = (data: { sessionId: string; pairId: string; toParticipantId?: string }) => {
      if (data.sessionId !== sessionId || data.pairId !== pairId) return;
      if (data.toParticipantId && data.toParticipantId !== myParticipantId) return;
      setIsVoiceCallModalOpen(false);
      setVoiceCallModalData(null);
    };

    gamesSocket.on('coffee:voice_call_modal', handleVoiceCallModal);
    gamesSocket.on('coffee:voice_call_accepted', handleVoiceCallAccepted);
    gamesSocket.on('coffee:voice_call_declined', handleVoiceCallDeclined);
    gamesSocket.on('coffee:voice_call_cancelled', handleVoiceCallCancelled);

    return () => {
      gamesSocket.off('coffee:voice_call_modal', handleVoiceCallModal);
      gamesSocket.off('coffee:voice_call_accepted', handleVoiceCallAccepted);
      gamesSocket.off('coffee:voice_call_declined', handleVoiceCallDeclined);
      gamesSocket.off('coffee:voice_call_cancelled', handleVoiceCallCancelled);
    };
  }, [gamesSocket, myParticipantId, pairId, sessionId, startVoice]);

  return (
    <div style={themeVars as React.CSSProperties}>
      {/* Voice Call Modal */}
      <VoiceCallModal
        isOpen={isVoiceCallModalOpen}
        data={voiceCallModalData}
        onAccept={() => {}}
        onDecline={() => { setIsVoiceCallModalOpen(false); setVoiceCallModalData(null); }}
        onCancel={() => {
          if (gamesSocket && sessionId && voiceCallModalData?.pairId) {
            void gamesSocket.emit('coffee:voice_call_cancel', { sessionId, pairId: voiceCallModalData.pairId }).catch(() => {});
          }
        }}
        onClose={() => { setIsVoiceCallModalOpen(false); setVoiceCallModalData(null); }}
        gamesSocket={gamesSocket}
      />

      {/* Enable Voice Prompt Dialog */}
      <Dialog
        open={showEnableVoicePrompt && voiceStatus === 'idle'}
        onOpenChange={(open) => { if (!open) void stopVoice({ emitHangup: false }); }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('gamePlay.coffeeRoulette.voice.prompt.title')}</DialogTitle>
            <DialogDescription>{t('gamePlay.coffeeRoulette.voice.prompt.body')}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <GameActionButton onClick={() => void startVoice()} size="lg">
              {t('gamePlay.coffeeRoulette.voice.enable')}
            </GameActionButton>
            <GameActionButton variant="outline" onClick={() => void stopVoice({ emitHangup: false })} size="lg">
              {t('gamePlay.coffeeRoulette.voice.prompt.notNow')}
            </GameActionButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Re-Shuffle Confirm Dialog */}
      <Dialog open={showReShuffleConfirm} onOpenChange={setShowReShuffleConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('gamePlay.coffeeRoulette.chatting.reShuffleConfirmTitle')}</DialogTitle>
            <DialogDescription>{t('gamePlay.coffeeRoulette.chatting.reShuffleConfirmMessage')}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <GameActionButton
              onClick={() => { setShowReShuffleConfirm(false); onReShuffle?.(); }}
              size="lg"
            >
              {t('gamePlay.coffeeRoulette.chatting.reShuffleConfirmAction')}
            </GameActionButton>
            <GameActionButton variant="outline" onClick={() => setShowReShuffleConfirm(false)} size="lg">
              {t('gamePlay.coffeeRoulette.chatting.reShuffleConfirmCancel')}
            </GameActionButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <audio ref={audioRef} className="hidden" autoPlay />

      <div
        className="w-full h-full py-4 px-6 flex flex-col gap-4 min-h-0"
        style={{
          background: 'linear-gradient(to bottom, #f5f3ff 0%, #faf8ff 100%)',
          position: 'relative',
        }}
      >
        {/* Decorative top accent */}
        <div
          className="absolute top-0 left-0 right-0 h-1"
          style={{ background: 'linear-gradient(to right, var(--color-primary), #a78bfa, #e879f9)' }}
        />

        {/* Header */}
        <MeetingHeader
          timeRemaining={timeRemaining}
          isWarning={isWarning}
          promptsUsed={promptsUsed}
          maxPrompts={maxPrompts}
        />

        {/* Main Content - Participants + Topic */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex-1 flex gap-6 items-center justify-center relative z-10 px-4"
        >
          <ParticipantAvatar person={person1} isTalking={person1Talking} direction="left" />
          <TopicCard topic={topic} decisionRequired={decisionRequired} />
          <ParticipantAvatar person={person2} isTalking={person2Talking} direction="right" />
        </motion.div>

        {/* Action Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex flex-col gap-5 relative z-10 px-2"
        >
          <VoiceControls
            voiceStatus={voiceStatus}
            voiceError={voiceError}
            voiceStatusText={voiceStatusText}
            voiceDotColor={voiceDotColor}
            isMuted={isMuted}
            micLevel={micLevel}
            micComfort={micComfort}
            remoteVolume={remoteVolume}
            onRemoteVolumeChange={setRemoteVolume}
            onToggleMute={toggleMute}
            onStartVoice={() => void startVoice()}
            onStopVoice={() => stopVoice({ emitHangup: true })}
            onRequestVoiceCall={async () => {
              if (!gamesSocket || !sessionId) return;
              try {
                await gamesSocket.emit('coffee:voice_call_request', { sessionId, pairId });
              } catch (error) {
                console.error('[VoiceCall] Request error:', error);
              }
            }}
            sessionId={sessionId}
          />

          <MeetingActions
            onNextPrompt={onNextPrompt}
            onContinue={onContinue}
            onEnd={onEnd}
            onReShuffle={onReShuffle ? () => setShowReShuffleConfirm(true) : undefined}
            onStopVoice={() => stopVoice({ emitHangup: true })}
            isLoading={isLoading}
          />
        </motion.div>
      </div>
    </div>
  );
}
