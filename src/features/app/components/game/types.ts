export interface BaseGameBoardProps {
  currentUserId: string;
  sessionId?: string | null;
  initialSnapshot?: unknown;
  gameData?: unknown;
}

export type SnapshotGuard<T> = (value: unknown) => value is T;
