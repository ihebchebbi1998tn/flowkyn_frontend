/**
 * useWinsPosts — Maps raw posts to UI shape, manages posting window timer.
 *
 * Extracted from GamePlay.tsx.
 */

import { useState, useEffect, useMemo } from 'react';
import { getSafeImageUrl } from '@/features/app/utils/assets';
import type { RawPost } from '@/features/app/types/socket';

interface UseWinsPostsOptions {
  postsData: unknown;
  eventPublicObj: Record<string, unknown> | null;
  guestParticipantId: string | null;
  memberParticipantId: string | null;
}

export interface MappedWinsPost {
  id: string;
  authorName: string;
  authorAvatar: string;
  authorAvatarUrl: string | null;
  content: string;
  timestamp: string;
  parentPostId: string | null;
  reactions: Array<{ type: string; count: number; reacted: boolean }>;
}

export function useWinsPosts({
  postsData,
  eventPublicObj,
  guestParticipantId,
  memberParticipantId,
}: UseWinsPostsOptions) {
  const rawPosts: RawPost[] = (postsData as Record<string, unknown>)?.data as RawPost[] || [];
  const postParticipantId = guestParticipantId || memberParticipantId || null;
  const winsEndTimeIso: string | null = (eventPublicObj?.end_time as string) || null;

  const winsEndsAtMs = useMemo(() => {
    if (!winsEndTimeIso) return null;
    const ms = new Date(winsEndTimeIso).getTime();
    return Number.isFinite(ms) ? ms : null;
  }, [winsEndTimeIso]);

  const [winsNowTick, setWinsNowTick] = useState(() => Date.now());
  useEffect(() => {
    if (!winsEndsAtMs) return;
    const interval = setInterval(() => setWinsNowTick(Date.now()), 30000);
    return () => clearInterval(interval);
  }, [winsEndsAtMs]);

  const winsPostingClosed = !!winsEndsAtMs && winsNowTick >= winsEndsAtMs;
  const canPostWins = !!postParticipantId && !winsPostingClosed;

  const winsPosts: MappedWinsPost[] = rawPosts.map((p) => ({
    id: p.id,
    authorName: p.author_name,
    authorAvatar: (p.author_name || '??').slice(0, 2).toUpperCase(),
    authorAvatarUrl: getSafeImageUrl(p.author_avatar) || null,
    content: p.content,
    timestamp: p.created_at,
    parentPostId: p.parent_post_id || null,
    reactions: (p.reactions || []).map((r) => ({
      type: r.type,
      count: r.count,
      reacted: !!r.reacted,
    })),
  }));

  return {
    winsPosts,
    canPostWins,
    winsEndTimeIso,
    winsPostingClosed,
    postParticipantId,
  };
}
