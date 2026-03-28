import { useMemo } from 'react';
import type { SnapshotGuard } from '@/features/app/components/game/types';

export function useGameSnapshot<T>(
  gameData: unknown,
  initialSnapshot: unknown,
  isSnapshot: SnapshotGuard<T>
): T | null {
  return useMemo(() => {
    if (isSnapshot(gameData)) return gameData;
    if (isSnapshot(initialSnapshot)) return initialSnapshot;
    return null;
  }, [gameData, initialSnapshot, isSnapshot]);
}
