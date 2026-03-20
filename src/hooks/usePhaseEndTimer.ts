import { useEffect, useState } from 'react';

export function usePhaseEndTimer(
  endTime: string | null,
  fallbackSeconds: number,
  active = true
): number {
  const [left, setLeft] = useState(fallbackSeconds);

  useEffect(() => {
    if (!active) {
      setLeft(fallbackSeconds);
      return;
    }
    if (!endTime) {
      setLeft(fallbackSeconds);
      return;
    }

    const endMs = new Date(endTime).getTime();
    if (!Number.isFinite(endMs)) {
      setLeft(fallbackSeconds);
      return;
    }

    const tick = () => {
      const remaining = Math.max(0, Math.ceil((endMs - Date.now()) / 1000));
      setLeft(remaining);
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [active, endTime, fallbackSeconds]);

  return left;
}
