/**
 * Simple countdown from initialSeconds to 0, tick every 1s.
 * Returns current seconds left. Resets when initialSeconds or active changes.
 */
import { useState, useEffect } from 'react';

export function useCountdown(initialSeconds: number, active: boolean): number | null {
  const [secondsLeft, setSecondsLeft] = useState<number | null>(active ? initialSeconds : null);

  useEffect(() => {
    if (!active || initialSeconds <= 0) {
      setSecondsLeft(null);
      return;
    }
    setSecondsLeft(initialSeconds);
  }, [active, initialSeconds]);

  useEffect(() => {
    if (secondsLeft === null || secondsLeft <= 0) return;
    const interval = setInterval(() => {
      setSecondsLeft((prev) => (prev !== null && prev > 1 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [secondsLeft]);

  return active ? secondsLeft : null;
}
