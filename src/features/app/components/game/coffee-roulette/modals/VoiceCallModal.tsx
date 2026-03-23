/**
 * Voice Call Modal — Handles initiating and responding to voice calls in Coffee Roulette
 * 
 * Two variants:
 * - "initiator": Shows when the current user clicks "Open Voice Call"
 *   - Displays a confirmation dialog with the partner's info
 *   - Shows loading state while waiting for partner response
 *   - Automatically closes when partner accepts/declines
 * 
 * - "receiver": Shows when the partner clicks "Open Voice Call"
 *   - Displays an incoming call alert with the initiator's info
 *   - Allows user to accept or decline
 *   - Auto-closes after 30 seconds if no response
 */

import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, PhoneOff, X } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

export interface VoiceCallModalData {
  type: 'initiator' | 'receiver';
  sessionId: string;
  pairId: string;
  initiatorParticipantId?: string;
  partnerParticipantId?: string;
  initiatorName?: string;
  partnerName?: string;
  initiatorAvatar?: string;
  partnerAvatar?: string;
  /** Present in fallback game-room broadcasts so clients can filter by participant ID */
  toParticipantId?: string;
  message: string;
}

interface VoiceCallModalProps {
  isOpen: boolean;
  data: VoiceCallModalData | null;
  onAccept?: () => void;
  onDecline?: () => void;
  onClose?: () => void;
  /** Called when the initiator cancels their own pending request */
  onCancel?: () => void;
  gamesSocket?: any;
}

export function VoiceCallModal({
  isOpen,
  data,
  onAccept,
  onDecline,
  onClose,
  onCancel,
  gamesSocket,
}: VoiceCallModalProps) {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [timeoutWarning, setTimeoutWarning] = useState(false);
  const autoDeclineTimerRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-decline after 30 seconds for receiver modal
  useEffect(() => {
    if (!isOpen || !data || data.type !== 'receiver') return;

    // Show warning at 25 seconds
    warningTimerRef.current = setTimeout(() => {
      setTimeoutWarning(true);
    }, 25000);

    // Auto-decline at 30 seconds
    autoDeclineTimerRef.current = setTimeout(() => {
      handleDecline();
    }, 30000);

    return () => {
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
      if (autoDeclineTimerRef.current) clearTimeout(autoDeclineTimerRef.current);
    };
  }, [isOpen, data]);

  const handleAccept = async () => {
    if (!data || !gamesSocket) return;

    setIsLoading(true);
    try {
      const result = await gamesSocket.emit('coffee:voice_call_response', {
        sessionId: data.sessionId,
        pairId: data.pairId,
        accepted: true,
      });

      if (result?.ok) {
        onAccept?.();
        // Modal will auto-close via onClose when coffee:voice_call_accepted is received
      }
    } catch (error) {
      console.error('[VoiceCallModal] Accept error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDecline = async () => {
    if (!data || !gamesSocket) return;

    setIsLoading(true);
    try {
      const result = await gamesSocket.emit('coffee:voice_call_response', {
        sessionId: data.sessionId,
        pairId: data.pairId,
        accepted: false,
      });

      if (result?.ok) {
        onDecline?.();
        onClose?.();
      }
    } catch (error) {
      console.error('[VoiceCallModal] Decline error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (autoDeclineTimerRef.current) clearTimeout(autoDeclineTimerRef.current);
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    setTimeoutWarning(false);
    onClose?.();
  };

  if (!data) return null;

  const isInitiator = data.type === 'initiator';
  const displayName = isInitiator ? data.partnerName : data.initiatorName;
  const displayAvatar = isInitiator ? data.partnerAvatar : data.initiatorAvatar;

  return (
    <AnimatePresence>
      {isOpen && (
        <Dialog open={isOpen} onOpenChange={handleClose}>
          <DialogContent className={cn(
            'sm:max-w-md gap-6 border-2',
            isInitiator 
              ? 'border-blue-300 dark:border-blue-700' 
              : 'border-green-300 dark:border-green-700'
          )}>
            {/* Header */}
            <DialogHeader>
              <DialogTitle className={cn(
                'text-lg font-bold flex items-center gap-2',
                isInitiator ? 'text-blue-700 dark:text-blue-400' : 'text-green-700 dark:text-green-400'
              )}>
                <Phone className={cn(
                  'h-5 w-5',
                  isInitiator ? 'text-blue-600' : 'text-green-600 animate-pulse'
                )} />
                {isInitiator ? t('gamePlay.coffeeRoulette.voiceCall.initiating') : t('gamePlay.coffeeRoulette.voiceCall.incoming')}
              </DialogTitle>
            </DialogHeader>

            {/* Partner Info */}
            <div className="flex flex-col items-center gap-4 py-2">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1 }}
              >
                <Avatar className="h-20 w-20 border-2 border-gray-300 dark:border-gray-600">
                  <AvatarImage src={displayAvatar || undefined} alt={displayName} />
                  <AvatarFallback>
                    {(displayName || 'Unknown')
                      .split(' ')
                      .slice(0, 2)
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </motion.div>

              <div className="text-center">
                <DialogDescription className="text-base font-medium text-gray-900 dark:text-gray-100 mb-1">
                  {displayName || 'Unknown'}
                </DialogDescription>
                <p className={cn(
                  'text-sm',
                  isInitiator ? 'text-blue-600' : 'text-green-600'
                )}>
                  {data.message}
                </p>
              </div>
            </div>

            {/* Timeout Warning */}
            {timeoutWarning && data.type === 'receiver' && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="px-3 py-2 rounded bg-yellow-100 dark:bg-yellow-900 border border-yellow-300 dark:border-yellow-700"
              >
                <p className="text-xs font-medium text-yellow-800 dark:text-yellow-200">
                  {t('gamePlay.coffeeRoulette.voiceCall.expiringIn', { seconds: '5' })}
                </p>
              </motion.div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              {isInitiator ? (
                <>
                  {/* Initiator just waits — only the receiver needs to accept/decline */}
                  <div className="flex-1 flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                    <span className="animate-spin inline-block h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full flex-shrink-0" />
                    {t('gamePlay.coffeeRoulette.voiceCall.waitingForResponse')}
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => {
                      onCancel?.();
                      handleClose();
                    }}
                    className="gap-2"
                  >
                    {t('common.cancel')}
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    onClick={handleDecline}
                    disabled={isLoading}
                    className="flex-1 gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                  >
                    <PhoneOff className="h-4 w-4" />
                    {t('gamePlay.coffeeRoulette.voiceCall.decline')}
                  </Button>
                  <Button
                    onClick={handleAccept}
                    disabled={isLoading}
                    className={cn(
                      'flex-1 gap-2',
                      'bg-green-600 hover:bg-green-700 text-white'
                    )}
                  >
                    {isLoading ? (
                      <>
                        <span className="animate-spin inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                      </>
                    ) : (
                      <>
                        <Phone className="h-4 w-4" />
                        {t('gamePlay.coffeeRoulette.voiceCall.accept')}
                      </>
                    )}
                  </Button>
                </>
              )}
            </div>

          </DialogContent>
        </Dialog>
      )}
    </AnimatePresence>
  );
}
