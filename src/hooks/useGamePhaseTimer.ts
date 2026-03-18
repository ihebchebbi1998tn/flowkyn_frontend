import { useState, useEffect } from 'react';

/**
 * Manages game phase countdown with precise server-side time synchronization
 * Prevents setInterval stacking and ensures accurate remaining time calculation
 */
export function useGamePhaseTimer(
  endTime: string | null,
  maxSeconds: number,
  onTimeUp?: () => void
) {
  const [timeLeft, setTimeLeft] = useState(maxSeconds);

  useEffect(() => {
    if (!endTime) {
      setTimeLeft(maxSeconds);
      return;
    }

    // Calculate remaining seconds from server time
    const calculateRemaining = () => {
      const remaining = Math.max(0, Math.ceil((new Date(endTime).getTime() - Date.now()) / 1000));
      return remaining;
    };

    // Initial update
    const initialRemaining = calculateRemaining();
    setTimeLeft(initialRemaining);

    // Only set interval if time remains
    if (initialRemaining <= 0) {
      onTimeUp?.();
      return;
    }

    // Update every 500ms for smooth UI
    const interval = setInterval(() => {
      const remaining = calculateRemaining();
      setTimeLeft(remaining);

      // Clear interval when time is up
      if (remaining <= 0) {
        clearInterval(interval);
        onTimeUp?.();
      }
    }, 500);

    // Cleanup function to prevent interval stacking
    return () => {
      clearInterval(interval);
    };
  }, [endTime, maxSeconds, onTimeUp]);

  return timeLeft;
}
