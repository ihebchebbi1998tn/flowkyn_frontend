import { usePhaseEndTimer } from './usePhaseEndTimer';
import { useEffect, useRef } from 'react';

/**
 * Manages game phase countdown with precise server-side time synchronization
 * Prevents setInterval stacking and ensures accurate remaining time calculation
 */
export function useGamePhaseTimer(
  endTime: string | null,
  maxSeconds: number,
  onTimeUp?: () => void
) {
  const timeLeft = usePhaseEndTimer(endTime, maxSeconds, !!endTime);
  const didNotifyRef = useRef(false);
  useEffect(() => {
    if (!onTimeUp) return;
    if (!endTime) {
      didNotifyRef.current = false;
      return;
    }
    if (timeLeft <= 0 && !didNotifyRef.current) {
      didNotifyRef.current = true;
      onTimeUp();
    }
  }, [endTime, onTimeUp, timeLeft]);
  return timeLeft;
}
