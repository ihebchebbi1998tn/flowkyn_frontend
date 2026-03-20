/**
 * Returns seconds left until endDate (ISO string). Updates every second.
 * Returns 0 when past the end. Returns null when endDate is null/invalid.
 */
import { useState, useEffect } from 'react';

export function useTimeUntilEnd(endDate: string | null): number | null {
  const [secondsLeft, setSecondsLeft] = useState<number | null>(() => {
    if (!endDate) return null;
    const end = new Date(endDate).getTime();
    if (!Number.isFinite(end)) return null;
    return Math.max(0, Math.floor((end - Date.now()) / 1000));
  });

  useEffect(() => {
    if (!endDate) {
      setSecondsLeft(null);
      return;
    }
    const end = new Date(endDate).getTime();
    if (!Number.isFinite(end)) {
      setSecondsLeft(null);
      return;
    }

    const tick = () => {
      const left = Math.max(0, Math.floor((end - Date.now()) / 1000));
      setSecondsLeft(left);
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [endDate]);

  return secondsLeft;
}
