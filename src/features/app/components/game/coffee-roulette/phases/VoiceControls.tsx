/**
 * Meeting Room - Voice Controls Panel
 * Handles voice status display, mic level, mute/unmute, volume, and call buttons
 */
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Mic, MicOff, PhoneOff, Volume2, VolumeX } from 'lucide-react';
import { GameActionButton } from '../../shared';
import type { VoiceStatus } from './meetingRoom.types';

interface VoiceControlsProps {
  voiceStatus: VoiceStatus;
  voiceError: string | null;
  voiceStatusText: string;
  voiceDotColor: string;
  isMuted: boolean;
  micLevel: number;
  micComfort: 'quiet' | 'ok' | 'loud';
  remoteVolume: number;
  onRemoteVolumeChange: (volume: number) => void;
  onToggleMute: () => void;
  onStartVoice: () => void;
  onStopVoice: () => Promise<void>;
  onRequestVoiceCall: () => void;
  sessionId?: string;
}

export function VoiceControls({
  voiceStatus,
  voiceError,
  voiceStatusText,
  voiceDotColor,
  isMuted,
  micLevel,
  micComfort,
  remoteVolume,
  onRemoteVolumeChange,
  onToggleMute,
  onStopVoice,
  onRequestVoiceCall,
  sessionId,
}: VoiceControlsProps) {
  const { t } = useTranslation();

  const voiceErrorText = voiceError
    ? t(`gamePlay.coffeeRoulette.voice.errors.${voiceError}`, {
        defaultValue: t('gamePlay.coffeeRoulette.voice.errors.unknown'),
      })
    : null;

  return (
    <>
      {/* Status Indicator + Mic Level + Control Buttons */}
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
                style={{ border: `3px solid ${voiceDotColor}` }}
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
              <span className="text-xs font-semibold text-muted-foreground">
                {t('gamePlay.coffeeRoulette.voice.micLevelLabel')}
              </span>
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
                  animate={{ width: `${Math.round(micLevel * 100)}%` }}
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
                  style={{ backgroundColor: micComfort === 'quiet' ? '#f59e0b' : '#ef4444' }}
                />
                <span
                  className="text-xs font-semibold"
                  style={{ color: micComfort === 'quiet' ? '#d97706' : '#dc2626' }}
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
                onClick={onRequestVoiceCall}
                size="lg"
                className="gap-2 font-bold shadow-md hover:shadow-xl transition-all px-6"
                style={{ backgroundColor: 'var(--color-primary)', color: 'white', border: 'none' }}
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
              {/* Mute/Unmute */}
              <motion.div whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}>
                <GameActionButton
                  variant={isMuted ? 'outline' : 'default'}
                  size="lg"
                  className="gap-2 font-bold px-6"
                  onClick={onToggleMute}
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
                  {isMuted
                    ? t('gamePlay.coffeeRoulette.voice.unmute')
                    : t('gamePlay.coffeeRoulette.voice.mute')}
                </GameActionButton>
              </motion.div>

              {/* Volume Control */}
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
                  animate={{ scale: remoteVolume > 0.7 ? [1, 1.15, 1] : 1 }}
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
                  onChange={(e) => onRemoteVolumeChange(Number(e.target.value))}
                />
                <span className="text-sm font-bold text-primary min-w-fit">
                  {Math.round(remoteVolume * 100)}%
                </span>
              </motion.div>

              {/* End Call */}
              <motion.div whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}>
                <GameActionButton
                  variant="outline"
                  size="lg"
                  className="gap-2 font-bold px-6 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
                  onClick={() => void onStopVoice()}
                >
                  <PhoneOff className="h-5 w-5" />
                  {t('gamePlay.coffeeRoulette.voice.leave')}
                </GameActionButton>
              </motion.div>
            </>
          )}
        </div>
      </div>

      {/* Error State */}
      {voiceStatus === 'error' && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-4 py-3.5 rounded-lg border-l-4"
          style={{ backgroundColor: '#fee2e2', borderColor: '#ef4444' }}
        >
          <p className="text-sm font-bold text-destructive">
            {t('gamePlay.coffeeRoulette.voice.error')}
          </p>
          {voiceError && (
            <p className="text-xs text-destructive/80 mt-1.5 leading-relaxed">{voiceErrorText}</p>
          )}
        </motion.div>
      )}
    </>
  );
}
