import { useState, useEffect, useRef } from 'react';
import { playScoreTick } from './audio';

interface AnimatedScoreProps {
  target: number;
  duration?: number;
}

export function AnimatedScore({ target, duration = 1200 }: AnimatedScoreProps) {
  const [current, setCurrent] = useState(0);
  const ref = useRef<number | null>(null);

  useEffect(() => {
    const start = performance.now();
    let tickCount = 0;
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - (1 - progress) * (1 - progress);
      const value = Math.round(eased * target);
      setCurrent(value);

      if (Math.floor(eased * 20) > tickCount) {
        tickCount = Math.floor(eased * 20);
        playScoreTick();
      }

      if (progress < 1) {
        ref.current = requestAnimationFrame(animate);
      }
    };
    ref.current = requestAnimationFrame(animate);
    return () => { if (ref.current) cancelAnimationFrame(ref.current); };
  }, [target, duration]);

  return <span className="tabular-nums">{current}</span>;
}
