import { useMemo, useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

type DecodedGuest = {
  participantId?: string;
  guestName?: string;
  eventId?: string;
  isGuest?: boolean;
  guestIdentityKey?: string;
};

function decodeJwtPayload(token: string): DecodedGuest | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const payloadPart = parts[1];
    const base64 = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
    const pad = base64.length % 4 === 0 ? 0 : 4 - (base64.length % 4);
    const normalized = base64 + '='.repeat(pad);
    const json = atob(normalized);
    const parsed = JSON.parse(json) as unknown;
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed as DecodedGuest;
  } catch {
    return null;
  }
}

export type IdentityDebugModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  /** Manually trigger game state sync (e.g. when stuck in wrong phase) */
  onSyncGameState?: () => void;
  canSyncGameState?: boolean;

  isGuest: boolean;
  userId: string;
  participantId: string | null;
  displayName: string;

  hasJoined: boolean;
  eventRoomJoined: boolean;
  sessionId: string | null;
  gameJoinAckReceived: boolean;

  eventsSocketStatus: string;
  gamesSocketStatus: string;

  // Tokens
  localGuestTokenExists: boolean;
  guestTokenValue: string | null;
  accessTokenExists: boolean;
  guestIdentityKey?: string | null;

  participantCount?: number;
  participants?: Array<{ id: string; name: string; avatarUrl?: string | null; isHost?: boolean }>;
  gameTypeKey?: string;
  gameDataPreview?: unknown;
  gamePhase?: string | null;
  coffeePairDebug?: {
    pairId: string;
    myRole: 'person1' | 'person2';
    meParticipantId: string;
    partnerParticipantId: string;
    topic: string;
    phase: string;
  } | null;
};

export function IdentityDebugModal({
  open,
  onOpenChange,
  eventId,
  onSyncGameState,
  canSyncGameState,
  isGuest,
  userId,
  participantId,
  displayName,
  hasJoined,
  eventRoomJoined,
  sessionId,
  gameJoinAckReceived,
  eventsSocketStatus,
  gamesSocketStatus,
  localGuestTokenExists,
  guestTokenValue,
  accessTokenExists,
  guestIdentityKey,
  participantCount = 0,
  participants = [],
  gameTypeKey,
  gameDataPreview,
  gamePhase,
  coffeePairDebug,
}: IdentityDebugModalProps) {
  const decoded = useMemo(() => {
    if (!guestTokenValue) return null;
    return decodeJwtPayload(guestTokenValue);
  }, [guestTokenValue]);

  const cookieBacked = !!guestTokenValue && !localGuestTokenExists;

  const payloadText = useMemo(() => {
    return JSON.stringify(
      {
        eventId,
        identity: { isGuest, userId, participantId, displayName },
        join: { hasJoined, eventRoomJoined },
        game: { sessionId, gameJoinAckReceived },
        gameContext: { gameTypeKey, hasGameData: !!gameDataPreview, phase: gamePhase ?? undefined },
        coffeePair: coffeePairDebug,
        sockets: { eventsSocketStatus, gamesSocketStatus },
        participants: {
          count: participantCount,
          ids: participants.map((p) => p.id),
        },
        tokens: {
          guestTokenLocal: localGuestTokenExists,
          guestIdentityKey: guestIdentityKey || null,
          guestTokenDecoded: decoded ? { participantId: decoded.participantId, guestName: decoded.guestName, eventId: decoded.eventId, isGuest: decoded.isGuest, guestIdentityKey: decoded.guestIdentityKey } : null,
          guestTokenCookieBackup: cookieBacked,
          accessTokenLocal: accessTokenExists,
        },
      },
      null,
      2,
    );
  }, [
    eventId,
    isGuest,
    userId,
    participantId,
    displayName,
    hasJoined,
    eventRoomJoined,
    sessionId,
    gameJoinAckReceived,
    eventsSocketStatus,
    gamesSocketStatus,
    gameTypeKey,
    gameDataPreview,
    gamePhase,
    coffeePairDebug,
    participantCount,
    participants,
    localGuestTokenExists,
    guestIdentityKey,
    decoded,
    cookieBacked,
    accessTokenExists,
  ]);

  const [copied, setCopied] = useState(false);
  const handleCopy = useCallback(async () => {
    const fullReport = [
      '─── Identity debug (copy for support) ───',
      '',
      'Stable IDs',
      `eventId: ${eventId}`,
      `isGuest: ${String(isGuest)}`,
      `userId (socket auth): ${userId || 'null'}`,
      `participantId: ${participantId || 'null'}`,
      `displayName: ${displayName}`,
      '',
      'Join + Game State',
      `hasJoined: ${String(hasJoined)} | eventRoomJoined: ${String(eventRoomJoined)}`,
      `sessionId: ${sessionId || 'null'} | gameJoinAckReceived: ${String(gameJoinAckReceived)}`,
      `gameType: ${gameTypeKey || 'unknown'} | hasGameData: ${String(!!gameDataPreview)} | phase: ${gamePhase ?? 'unknown'}`,
      `coffeePair: ${coffeePairDebug ? `${coffeePairDebug.pairId} (${coffeePairDebug.myRole}) -> ${coffeePairDebug.partnerParticipantId}` : 'none'}`,
      `eventsSocket: ${eventsSocketStatus}`,
      `gamesSocket: ${gamesSocketStatus}`,
      '',
      `Event Participants (${participantCount})`,
      participants.map((p) => `${p.id} | ${p.name}${p.isHost ? ' | host' : ''}`).join('\n') || 'No participants',
      '',
      'Tokens',
      `local guest token exists: ${String(localGuestTokenExists)} (cookie backup: ${String(cookieBacked)})`,
      `guest identity key: ${guestIdentityKey || 'null'}`,
      `access token exists: ${String(accessTokenExists)}`,
      '',
      '─── Full JSON ───',
      payloadText,
    ].join('\n');

    try {
      await navigator.clipboard.writeText(fullReport);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, [
    eventId, isGuest, userId, participantId, displayName,
    hasJoined, eventRoomJoined, sessionId, gameJoinAckReceived,
    gameTypeKey, gameDataPreview, gamePhase, coffeePairDebug,
    eventsSocketStatus, gamesSocketStatus,
    participantCount, participants,
    localGuestTokenExists, cookieBacked, guestIdentityKey, accessTokenExists,
    payloadText,
  ]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Identity debug
            <Badge variant="secondary" className="text-[11px]">Refresh to verify stability</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="rounded-lg border border-border bg-muted/20 p-3">
            <div className="text-sm font-semibold">Stable IDs</div>
            <div className="text-[12px] text-muted-foreground mt-1 space-y-1">
              <div>eventId: {eventId}</div>
              <div>isGuest: {String(isGuest)}</div>
              <div>userId (socket auth): {userId || 'null'}</div>
              <div>participantId: {participantId || 'null'}</div>
              <div>displayName: {displayName}</div>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-muted/20 p-3">
            <div className="text-sm font-semibold">Join + Game State</div>
            <div className="text-[12px] text-muted-foreground mt-1 space-y-1">
              <div>hasJoined: {String(hasJoined)} | eventRoomJoined: {String(eventRoomJoined)}</div>
              <div>sessionId: {sessionId || 'null'} | gameJoinAckReceived: {String(gameJoinAckReceived)}</div>
              <div>gameType: {gameTypeKey || 'unknown'} | hasGameData: {String(!!gameDataPreview)} | phase: {gamePhase ?? 'unknown'}</div>
              <div>
                coffeePair: {coffeePairDebug ? `${coffeePairDebug.pairId} (${coffeePairDebug.myRole}) -> ${coffeePairDebug.partnerParticipantId}` : 'none'}
              </div>
              <div>eventsSocket: {eventsSocketStatus}</div>
              <div>gamesSocket: {gamesSocketStatus}</div>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-muted/20 p-3">
            <div className="text-sm font-semibold">Event Participants ({participantCount})</div>
            <pre className="mt-2 text-[11px] leading-4 bg-black/5 rounded-lg p-3 border border-border max-h-40 overflow-y-auto whitespace-pre-wrap">
              {participants.map((p) => `${p.id} | ${p.name}${p.isHost ? ' | host' : ''}`).join('\n') || 'No participants'}
            </pre>
          </div>

          <div className="rounded-lg border border-border bg-muted/10 p-3">
            <div className="text-sm font-semibold">Tokens (no full secrets)</div>
            <div className="text-[12px] text-muted-foreground mt-1">
              local guest token exists: {String(localGuestTokenExists)} (cookie backup: {String(cookieBacked)})
            </div>
                        <div className="text-[12px] text-muted-foreground">
                          guest identity key: {guestIdentityKey || 'null'}
                        </div>
            <div className="text-[12px] text-muted-foreground">
              access token exists: {String(accessTokenExists)}
            </div>
            <pre className="mt-2 text-[11px] leading-4 bg-black/5 rounded-lg p-3 border border-border max-h-56 overflow-y-auto whitespace-pre-wrap">
              {payloadText}
            </pre>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1 min-w-[100px]"
              onClick={handleCopy}
            >
              {copied ? 'Copied!' : 'Copy all'}
            </Button>
            {onSyncGameState && (
              <Button
                type="button"
                variant="outline"
                onClick={onSyncGameState}
                disabled={!canSyncGameState}
              >
                Sync game state
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              className="flex-1 min-w-[100px]"
              onClick={() => onOpenChange(false)}
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

