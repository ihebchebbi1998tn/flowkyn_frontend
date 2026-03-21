/**
 * Coffee Roulette - Meeting Room (Redesigned)
 * Compact, beautiful meeting interface
 * Takes minimal height, only what's needed
 */

import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { MessageCircle, Clock, Lightbulb, RotateCcw, LogOut, Mic, MicOff, PhoneOff, Volume2, VolumeX, Shuffle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { getSafeImageUrl } from '@/features/app/utils/assets';
import { useRoomTheme, useThemeVariables } from '../theme/RoomThemeContext';
import { useCoffeeVoiceCall } from '../hooks/useCoffeeVoiceCall';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { GameActionButton } from '../../shared';

interface Person {
  participantId: string;
  name: string;
  avatar: string;
  avatarUrl?: string | null;
}

interface MeetingRoomProps {
  person1: Person;
  person2: Person;
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
  gamesSocket?: any;
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
  const [displayTime, setDisplayTime] = useState(formatTime(timeRemaining));
  const [isWarning, setIsWarning] = useState(false);
  const [showReShuffleConfirm, setShowReShuffleConfirm] = useState(false);

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

  const voiceErrorText = (() => {
    if (!voiceError) return null;
    return t(`gamePlay.coffeeRoulette.voice.errors.${voiceError}`, {
      defaultValue: t('gamePlay.coffeeRoulette.voice.errors.unknown'),
    });
  })();

  // Tiny "talking" indicator on avatars:
  // - Local side uses micLevel
  // - Remote side uses remoteMicLevel
  const TALK_LEVEL = 0.18;
  const localTalking = voiceStatus === 'connected' && !isMuted && micLevel > TALK_LEVEL;
  const remoteTalking = voiceStatus === 'connected' && remoteMicLevel > TALK_LEVEL;
  const person1IsLocal = person1.participantId === myParticipantId;
  const person1Talking = person1IsLocal ? localTalking : remoteTalking;
  const person2Talking = person1IsLocal ? remoteTalking : localTalking;

  // Attach remote audio stream to a hidden audio element.
  useEffect(() => {
    if (!audioRef.current) return;
    if (!remoteStream) return;
    // @ts-expect-error - srcObject exists in modern browsers.
    audioRef.current.srcObject = remoteStream;
    audioRef.current.volume = remoteVolume;
    void audioRef.current.play().catch(() => {});
  }, [remoteStream]);

  // Keep the audio output volume synced with the UI slider.
  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = remoteVolume;
  }, [remoteVolume]);

  useEffect(() => {
    setDisplayTime(formatTime(timeRemaining));
    setIsWarning(timeRemaining < 300);
  }, [timeRemaining]);

  const voiceStatusText = (() => {
    switch (voiceStatus) {
      case 'idle':
        return t('gamePlay.coffeeRoulette.voice.statusIdle');
      case 'requesting_microphone':
        return t('gamePlay.coffeeRoulette.voice.statusRequestingMicrophone');
      case 'connecting':
        return t('gamePlay.coffeeRoulette.voice.connecting');
      case 'connected':
        return isMuted ? t('gamePlay.coffeeRoulette.voice.statusMuted') : t('gamePlay.coffeeRoulette.voice.statusUnmuted');
      case 'error':
        return t('gamePlay.coffeeRoulette.voice.error');
      default:
        return '';
    }
  })();

  const voiceDotColor = (() => {
    switch (voiceStatus) {
      case 'connected':
        return isMuted ? '#f59e0b' : '#22c55e';
      case 'connecting':
      case 'requesting_microphone':
        return '#8b5cf6';
      case 'error':
        return '#ef4444';
      case 'idle':
      default:
        return '#9ca3af';
    }
  })();

  return (
    <div style={themeVars as React.CSSProperties}>
      <Dialog
        open={showEnableVoicePrompt && voiceStatus === 'idle'}
        onOpenChange={(open) => {
          if (!open) void stopVoice({ emitHangup: false });
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('gamePlay.coffeeRoulette.voice.prompt.title')}</DialogTitle>
            <DialogDescription>{t('gamePlay.coffeeRoulette.voice.prompt.body')}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <GameActionButton
              onClick={() => {
                void startVoice();
              }}
              size="lg"
            >
              {t('gamePlay.coffeeRoulette.voice.enable')}
            </GameActionButton>
            <GameActionButton
              variant="outline"
              onClick={() => {
                void stopVoice({ emitHangup: false });
              }}
              size="lg"
            >
              {t('gamePlay.coffeeRoulette.voice.prompt.notNow')}
            </GameActionButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showReShuffleConfirm} onOpenChange={setShowReShuffleConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('gamePlay.coffeeRoulette.chatting.reShuffleConfirmTitle')}</DialogTitle>
            <DialogDescription>{t('gamePlay.coffeeRoulette.chatting.reShuffleConfirmMessage')}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <GameActionButton
              onClick={async () => {
                setShowReShuffleConfirm(false);
                if (onReShuffle) {
                  onReShuffle();
                }
              }}
              size="lg"
            >
              {t('gamePlay.coffeeRoulette.chatting.reShuffleConfirmAction')}
            </GameActionButton>
            <GameActionButton
              variant="outline"
              onClick={() => setShowReShuffleConfirm(false)}
              size="lg"
            >
              {t('gamePlay.coffeeRoulette.chatting.reShuffleConfirmCancel')}
            </GameActionButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <audio ref={audioRef} className="hidden" autoPlay />
      <div
        className="w-full h-full py-4 px-6 flex flex-col gap-4 min-h-0"
        style={{
          background: `linear-gradient(to bottom, #f5f3ff 0%, #faf8ff 100%)`,
          position: 'relative',
        }}
      >
        {/* Decorative top accent */}
        <div
          className="absolute top-0 left-0 right-0 h-1"
          style={{
            background: `linear-gradient(to right, var(--color-primary), #a78bfa, #e879f9)`,
          }}
        />
        {/* Professional Header */}
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-center justify-between px-5 py-2 rounded-xl relative z-10"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.98)',
            border: `1px solid #e5e7eb`,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
          }}
        >
          {/* Left: Live Badge */}
          <div className="flex items-center gap-3">
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
              style={{
                backgroundColor: 'var(--color-primary)',
                color: 'white',
              }}
            >
              <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
              {t('gamePlay.coffeeRoulette.chatting.liveBadge')}
            </div>
          </div>

          {/* Center: Timer */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Clock
                className="w-4 h-4 font-bold"
                style={{ color: isWarning ? '#ef4444' : '#6b7280' }}
              />
              <motion.span
                className="font-mono font-bold text-sm"
                style={{ color: isWarning ? '#ef4444' : '#111827' }}
                animate={isWarning ? { scale: [1, 1.15, 1] } : {}}
                transition={isWarning ? { duration: 0.8, repeat: Infinity } : {}}
              >
                {displayTime}
              </motion.span>
            </div>
            <div className="h-5 w-px" style={{ backgroundColor: '#e5e7eb' }} />
            <span className="text-sm font-medium" style={{ color: '#6b7280' }}>
              {t('gamePlay.coffeeRoulette.chatting.topicCounter', { current: promptsUsed, max: maxPrompts })}
            </span>
          </div>

          {/* Right: Empty space */}
          <div className="w-20" />
        </motion.div>

        {/* Main Content - Professional Meeting Layout */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex-1 flex gap-6 items-center justify-center relative z-10 px-4"
        >
          {/* Left Participant */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex flex-col items-center gap-4"
          >
            <motion.div
              className="relative"
              whileHover={{ scale: 1.08 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <div
                className="absolute inset-0 rounded-full blur-xl opacity-30"
                style={{
                  backgroundColor: 'var(--color-primary)',
                }}
              />
              <Avatar 
                className="w-24 h-24 border-4 relative z-10"
                style={{ 
                  borderColor: 'var(--color-primary)',
                  boxShadow: '0 12px 32px rgba(108, 92, 231, 0.25)',
                }}
              >
                <AvatarImage src={getSafeImageUrl(person1.avatarUrl)} alt={person1.name} />
                <AvatarFallback
                  style={{
                    backgroundColor: 'var(--color-primary)',
                    color: 'white',
                    fontSize: '20px',
                    fontWeight: '700',
                  }}
                >
                  {person1.avatar}
                </AvatarFallback>
              </Avatar>
              {person1Talking && (
                <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-success ring-2 ring-white/90 animate-pulse" />
              )}
            </motion.div>
            <div className="text-center">
              <p className="font-bold text-lg" style={{ color: '#111827' }}>
                {person1.name}
              </p>
              <p className="text-sm" style={{ color: '#6b7280' }}>
                {t('gamePlay.coffeeRoulette.chatting.participantLabel')}
              </p>
            </div>
          </motion.div>

          {/* Center: Topic Card - Main Professional Focus */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="relative flex-shrink-0"
          >
            <div
              className="rounded-2xl p-10 flex flex-col justify-between w-96 min-h-56"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.99)',
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.99) 0%, rgba(250, 248, 255, 0.8) 100%)',
                border: `2px solid var(--color-primary)`,
                boxShadow: '0 25px 50px rgba(108, 92, 231, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.6)',
              }}
            >
              <div>
                <div className="flex items-center gap-2.5 mb-5">
                  <Lightbulb className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--color-primary)' }} />
                  <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--color-primary)' }}>
                    {t('gamePlay.coffeeRoulette.chatting.topicCardLabel')}
                  </p>
                </div>
                <motion.p
                  key={topic}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="text-2xl font-bold leading-relaxed"
                  style={{ color: '#111827', wordBreak: 'break-word' }}
                >
                  {topic}
                </motion.p>
              </div>

              {/* Decision Message */}
              {decisionRequired && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="mt-6 pt-6 border-t-2"
                  style={{ borderColor: '#e5e7eb' }}
                >
                  <p className="text-sm font-bold text-center" style={{ color: 'var(--color-primary)' }}>
                    ✓ {t('gamePlay.coffeeRoulette.chatting.decisionMessage')}
                  </p>
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* Right Participant */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex flex-col items-center gap-4"
          >
            <motion.div
              className="relative"
              whileHover={{ scale: 1.08 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <div
                className="absolute inset-0 rounded-full blur-xl opacity-30"
                style={{
                  backgroundColor: 'var(--color-primary)',
                }}
              />
              <Avatar 
                className="w-24 h-24 border-4 relative z-10"
                style={{ 
                  borderColor: 'var(--color-primary)',
                  boxShadow: '0 12px 32px rgba(108, 92, 231, 0.25)',
                }}
              >
                <AvatarImage src={getSafeImageUrl(person2.avatarUrl)} alt={person2.name} />
                <AvatarFallback
                  style={{
                    backgroundColor: 'var(--color-primary)',
                    color: 'white',
                    fontSize: '20px',
                    fontWeight: '700',
                  }}
                >
                  {person2.avatar}
                </AvatarFallback>
              </Avatar>
              {person2Talking && (
                <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-success ring-2 ring-white/90 animate-pulse" />
              )}
            </motion.div>
            <div className="text-center">
              <p className="font-bold text-lg" style={{ color: '#111827' }}>
                {person2.name}
              </p>
              <p className="text-sm" style={{ color: '#6b7280' }}>
                {t('gamePlay.coffeeRoulette.chatting.participantLabel')}
              </p>
            </div>
          </motion.div>
        </motion.div>

        {/* Action Controls - Grouped layout per UX feedback */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex flex-col gap-5 relative z-10 px-2"
        >
          {/* Row 1: Professional Voice Controls */}
          <div className="flex items-center justify-center gap-6 flex-wrap">
            {/* Status Indicator */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="relative"
            >
              <div
                className="relative w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg"
                style={{
                  backgroundColor: `${voiceDotColor}15`,
                  border: `3px solid ${voiceDotColor}`,
                  boxShadow: `0 0 20px ${voiceDotColor}50`,
                }}
              >
                {voiceStatus === 'connected' && (
                  <motion.div
                    className="absolute inset-0 rounded-full"
                    style={{
                      border: `3px solid ${voiceDotColor}`,
                    }}
                    initial={{ scale: 1, opacity: 0.8 }}
                    animate={{ scale: 1.5, opacity: 0 }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                )}
                <div
                  className="w-4 h-4 rounded-full"
                  style={{
                    backgroundColor: voiceDotColor,
                    boxShadow: `0 0 12px ${voiceDotColor}`,
                  }}
                />
              </div>
              <p className="text-xs font-bold text-center mt-2 text-muted-foreground">{voiceStatusText}</p>
            </motion.div>

            {/* Mic Level & Quality Display */}
            {voiceStatus === 'connected' && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex flex-col gap-3 min-w-max"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-muted-foreground">{t('gamePlay.coffeeRoulette.voice.micLevelLabel')}</span>
                  <div
                    className="flex-1 h-2.5 rounded-full bg-gradient-to-r from-slate-200 to-slate-100 overflow-hidden shadow-inner"
                    style={{ minWidth: '100px' }}
                  >
                    <motion.div
                      className="h-full transition-all"
                      style={{
                        background: `linear-gradient(to right, #22c55e, #10b981, var(--color-primary))`,
                        boxShadow: `inset 0 0 8px ${voiceDotColor}40`,
                      }}
                      animate={{
                        width: `${Math.round(micLevel * 100)}%`,
                      }}
                    />
                  </div>
                </div>

                {micComfort !== 'ok' && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-md"
                    style={{
                      backgroundColor: micComfort === 'quiet' ? '#fef08a' : '#fee2e2',
                    }}
                  >
                    <div
                      className="w-2 h-2 rounded-full animate-pulse"
                      style={{
                        backgroundColor: micComfort === 'quiet' ? '#f59e0b' : '#ef4444',
                      }}
                    />
                    <span
                      className="text-xs font-semibold"
                      style={{
                        color: micComfort === 'quiet' ? '#d97706' : '#dc2626',
                      }}
                    >
                      {micComfort === 'quiet'
                        ? t('gamePlay.coffeeRoulette.voice.micTooQuiet')
                        : t('gamePlay.coffeeRoulette.voice.micTooLoud')}
                    </span>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* Control Buttons */}
            <div className="flex items-center gap-3 flex-wrap justify-center">
              {(voiceStatus === 'idle' || voiceStatus === 'error') && (
                <motion.div whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}>
                  <GameActionButton
                    disabled={!sessionId}
                    onClick={async () => {
                      await startVoice();
                    }}
                    size="lg"
                    className="gap-2 font-bold shadow-md hover:shadow-xl transition-all px-6"
                    style={{
                      backgroundColor: 'var(--color-primary)',
                      color: 'white',
                      border: 'none',
                    }}
                  >
                    <Mic className="h-5 w-5" />
                    {t('gamePlay.coffeeRoulette.voice.enable')}
                  </GameActionButton>
                </motion.div>
              )}

              {(voiceStatus === 'connecting' || voiceStatus === 'requesting_microphone') && (
                <GameActionButton variant="outline" size="lg" disabled className="gap-2 px-6">
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity }}>
                    <Mic className="h-5 w-5" />
                  </motion.div>
                  {t('gamePlay.coffeeRoulette.voice.connecting')}
                </GameActionButton>
              )}

              {voiceStatus === 'connected' && (
                <>
                  {/* Mute/Unmute Button */}
                  <motion.div whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}>
                    <GameActionButton
                      variant={isMuted ? 'outline' : 'default'}
                      size="lg"
                      className="gap-2 font-bold px-6"
                      onClick={() => toggleMute()}
                      style={
                        !isMuted
                          ? {
                              backgroundColor: 'var(--color-primary)',
                              color: 'white',
                              border: 'none',
                              boxShadow: '0 6px 20px rgba(108, 92, 231, 0.35)',
                            }
                          : {}
                      }
                    >
                      {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                      {isMuted ? t('gamePlay.coffeeRoulette.voice.unmute') : t('gamePlay.coffeeRoulette.voice.mute')}
                    </GameActionButton>
                  </motion.div>

                  {/* Volume Control Card */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-3 px-4 py-2.5 rounded-lg"
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.8)',
                      border: '2px solid var(--color-primary)',
                      boxShadow: '0 4px 16px rgba(108, 92, 231, 0.15)',
                    }}
                  >
                    <motion.div
                      animate={{
                        scale: remoteVolume > 0.7 ? [1, 1.15, 1] : 1,
                      }}
                      transition={{ duration: 0.8, repeat: remoteVolume > 0.7 ? Infinity : 0 }}
                    >
                      {remoteVolume <= 0.01 ? (
                        <VolumeX className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <Volume2 className="h-5 w-5" style={{ color: 'var(--color-primary)' }} />
                      )}
                    </motion.div>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={remoteVolume}
                      className="h-2 accent-primary cursor-pointer"
                      style={{ width: '120px' }}
                      aria-label={t('gamePlay.coffeeRoulette.voice.volumeLabel', {
                        percent: Math.round(remoteVolume * 100),
                      })}
                      onChange={(e) => setRemoteVolume(Number(e.target.value))}
                    />
                    <span className="text-sm font-bold text-primary min-w-fit">
                      {Math.round(remoteVolume * 100)}%
                    </span>
                  </motion.div>

                  {/* End Call Button */}
                  <motion.div whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}>
                    <GameActionButton
                      variant="outline"
                      size="lg"
                      className="gap-2 font-bold px-6 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
                      onClick={async () => {
                        await stopVoice({ emitHangup: true });
                      }}
                    >
                      <PhoneOff className="h-5 w-5" />
                      {t('gamePlay.coffeeRoulette.voice.leave')}
                    </GameActionButton>
                  </motion.div>
                </>
              )}
            </div>
          </div>

          {/* Error State - Professional Alert */}
          {voiceStatus === 'error' && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="px-4 py-3.5 rounded-lg border-l-4"
              style={{
                backgroundColor: '#fee2e2',
                borderColor: '#ef4444',
              }}
            >
              <p className="text-sm font-bold text-destructive">
                {t('gamePlay.coffeeRoulette.voice.error')}
              </p>
              {voiceError && (
                <p className="text-xs text-destructive/80 mt-1.5 leading-relaxed">{voiceErrorText}</p>
              )}
            </motion.div>
          )}

          {/* Row 2: Primary CTA - Next Topic (bigger, more contrast) */}
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
                style={{
                  borderColor: '#e5e7eb',
                  borderWidth: '2px',
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                }}
              >
                <RotateCcw className="h-5 w-5" />
                {t('gamePlay.coffeeRoulette.chatting.keepTalkingButton')}
              </GameActionButton>
            )}

            {onReShuffle && (
              <GameActionButton
                onClick={() => setShowReShuffleConfirm(true)}
                disabled={isLoading}
                variant="outline"
                size="lg"
                className="gap-3 font-semibold"
                style={{
                  borderColor: '#e5e7eb',
                  borderWidth: '2px',
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                }}
              >
                <Shuffle className="h-5 w-5" />
                {t('gamePlay.coffeeRoulette.chatting.reShuffleButton')}
              </GameActionButton>
            )}

            {onEnd && (
              <GameActionButton
                onClick={async () => {
                  await stopVoice({ emitHangup: true });
                  onEnd();
                }}
                disabled={isLoading}
                variant="outline"
                size="lg"
                className="gap-3 font-semibold text-muted-foreground hover:text-foreground"
                style={{
                  borderColor: '#e5e7eb',
                  borderWidth: '2px',
                }}
              >
                <LogOut className="h-5 w-5" />
                {t('gamePlay.coffeeRoulette.chatting.endMeetingButton')}
              </GameActionButton>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

/**
 * Format seconds to MM:SS
 */
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}
