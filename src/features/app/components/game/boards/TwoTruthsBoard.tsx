import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { GameResults, CountdownOverlay, type GamePhase } from '../shared';
import {
  TwoTruthsHeader,
  TwoTruthsWaitingSection,
  TwoTruthsSubmitSection,
  TwoTruthsSubmittedSection,
  TwoTruthsVoteSection,
  TwoTruthsRevealSection,
} from './TwoTruthsSections';
import { GAME_TYPES } from '@/features/app/pages/play/gameTypes';

type TwoTruthsSnapshot = {
  kind: typeof GAME_TYPES.TWO_TRUTHS;
  phase: GamePhase;
  round: number;
  totalRounds: number;
  presenterParticipantId: string | null;
  statements: { id: 's0' | 's1' | 's2'; text: string }[] | null;
  votes: Record<string, 's0' | 's1' | 's2'>;
  revealedLie: 's0' | 's1' | 's2' | null;
  scores?: Record<string, number>;
  submitEndsAt?: string;
  voteEndsAt?: string;
};

export interface TwoTruthsBoardProps {
  onRoundComplete?: (roundNumber: number) => void;
  participants: any[];
  currentUserId: string;
  currentUserName: string;
  currentUserAvatar: string;
  sessionId: string | null;
  activeRoundId: string | null;
  initialSnapshot?: any;
  onEmitAction: (actionType: string, payload?: any) => Promise<void>;
  gameData?: any;
  isAdmin?: boolean;
}

export function TwoTruthsBoard({
  onRoundComplete,
  participants,
  currentUserId,
  currentUserName,
  currentUserAvatar,
  sessionId,
  activeRoundId,
  initialSnapshot,
  onEmitAction,
  gameData,
  isAdmin = false,
}: TwoTruthsBoardProps) {
  const { t } = useTranslation();
  const snapshot: TwoTruthsSnapshot | null = (gameData?.kind === GAME_TYPES.TWO_TRUTHS
    ? gameData
    : (initialSnapshot?.kind === GAME_TYPES.TWO_TRUTHS ? initialSnapshot : null)) as any;

  const phase: GamePhase = (snapshot?.phase || 'waiting') as any;
  const round = snapshot?.round || 1;
  const totalRounds = snapshot?.totalRounds || 4;
  const presenterId = snapshot?.presenterParticipantId || null;
  const isPresenter = !!presenterId && presenterId === currentUserId;
  const statements = snapshot?.statements || null;
  const votes = snapshot?.votes || {};
  const revealedLie = snapshot?.revealedLie || null;
  const scores = snapshot?.scores || {};
  const submitEndsAt = snapshot?.submitEndsAt || null;
  const voteEndsAt = snapshot?.voteEndsAt || null;

  const [localStatements, setLocalStatements] = useState(['', '', '']);
  const [selectedVote, setSelectedVote] = useState<'s0' | 's1' | 's2' | null>(null);
  const [lieIndex, setLieIndex] = useState(2);
  const voted = !!votes[currentUserId];
  const [showCountdown, setShowCountdown] = useState(false);

  const startGame = () => { setShowCountdown(true); };
  const handleCountdownDone = useCallback(async () => {
    setShowCountdown(false);
    await onEmitAction('two_truths:start');
  }, [onEmitAction]);

  const submit = useCallback(async () => {
    if (!sessionId || !activeRoundId) return;
    await onEmitAction('two_truths:submit', { statements: localStatements, lieIndex });
  }, [sessionId, activeRoundId, localStatements, lieIndex, onEmitAction]);

  const submitVote = useCallback(async () => {
    if (!selectedVote) return;
    await onEmitAction('two_truths:vote', { statementId: selectedVote });
  }, [selectedVote, onEmitAction]);

  const reveal = useCallback(async () => {
    await onEmitAction('two_truths:reveal', {});
  }, [onEmitAction]);

  const nextRound = useCallback(async () => {
    onRoundComplete?.(round);
    await onEmitAction('two_truths:next_round', {});
    setLocalStatements(['', '', '']);
    setSelectedVote(null);
    setLieIndex(2);
  }, [onEmitAction, onRoundComplete, round]);

  const maxTime = phase === 'submit' ? 30 : 20;

  const [timeLeft, setTimeLeft] = useState(maxTime);

  useEffect(() => {
    let targetTime: string | null = null;
    if (phase === 'submit' && submitEndsAt) targetTime = submitEndsAt;
    else if (phase === 'vote' && voteEndsAt) targetTime = voteEndsAt;

    if (!targetTime) {
      setTimeLeft(maxTime);
      return;
    }

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((new Date(targetTime).getTime() - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining === 0) clearInterval(interval);
    }, 500);

    return () => clearInterval(interval);
  }, [phase, submitEndsAt, voteEndsAt, maxTime]);

  const presenterName =
    participants.find((p: any) => p.id === presenterId)?.name || currentUserName;

  const targetStatements = (statements || [
    { id: 's0' as const, text: t('gamePlay.twoTruths.defaultStatement1', { defaultValue: 'Statement 1' }) },
    { id: 's1' as const, text: t('gamePlay.twoTruths.defaultStatement2', { defaultValue: 'Statement 2' }) },
    { id: 's2' as const, text: t('gamePlay.twoTruths.defaultStatement3', { defaultValue: 'Statement 3' }) },
  ]).map((s) => ({ id: s.id, text: s.text }));

  const tallyCounts: Record<'s0' | 's1' | 's2', number> = { s0: 0, s1: 0, s2: 0 };
  Object.values(votes).forEach((v) => { tallyCounts[v] = (tallyCounts[v] || 0) + 1; });
  const totalVotes = Math.max(1, Object.keys(votes).length);
  const mockTally = (['s0', 's1', 's2'] as const).map((id) => ({
    statementId: id,
    count: tallyCounts[id],
    percentage: Math.round((tallyCounts[id] / totalVotes) * 100),
  }));

  const results = participants
    .map((p: any) => ({
      name: p.name,
      score: scores[p.id] || 0,
      avatar: p.avatar,
    }))
    .sort((a: any, b: any) => b.score - a.score)
    .map((r: any, i: number) => ({ ...r, rank: i + 1 }));

  return (
    <div className="space-y-4">
      <CountdownOverlay active={showCountdown} onComplete={handleCountdownDone} />
      <TwoTruthsHeader
        round={round}
        totalRounds={totalRounds}
        phase={phase}
        timeLeft={timeLeft}
        maxTime={maxTime}
      />

      {/* WAITING */}
      {phase === 'waiting' && (
        <TwoTruthsWaitingSection 
          onStart={startGame} 
          isAdmin={isAdmin}
          rounds={totalRounds}
        />
      )}

      {/* SUBMIT */}
      {phase === 'submit' && isPresenter && (
        <TwoTruthsSubmitSection
          statements={localStatements}
          onChange={(index, value) => {
            const next = [...localStatements];
            next[index] = value;
            setLocalStatements(next);
          }}
          lieIndex={lieIndex}
          onLieIndexChange={setLieIndex}
          onSubmit={submit}
          isSubmitDisabled={localStatements.some((s) => !s.trim())}
        />
      )}

      {/* Submitted waiting */}
      {phase === 'submit' && !isPresenter && (
        <TwoTruthsSubmittedSection
          message={t('gamePlay.twoTruths.waitingForPresenter', { defaultValue: 'Waiting for the presenter to submit statements...' })}
        />
      )}

      {/* VOTE */}
      {phase === 'vote' && (
        <TwoTruthsVoteSection
          currentUserName={presenterName}
          currentUserAvatar={currentUserAvatar}
          targetStatements={targetStatements}
          selectedVote={selectedVote}
          voted={voted}
          onSelect={(id) => !voted && setSelectedVote(id as any)}
          onSubmitVote={submitVote}
          disableSubmit={!selectedVote || voted}
          isPresenter={isPresenter}
        />
      )}

      {phase === 'vote' && isAdmin && (
        <div className="flex justify-end">
          <button
            className="text-[11px] text-muted-foreground hover:text-foreground underline"
            onClick={reveal}
          >
            {t('gamePlay.twoTruths.revealHost', { defaultValue: 'Reveal (host)' })}
          </button>
        </div>
      )}

      {/* REVEAL */}
      {phase === 'reveal' && (
        <TwoTruthsRevealSection
          targetStatements={targetStatements}
          mockTally={mockTally}
          revealedLie={revealedLie}
          selectedVote={votes[currentUserId] || selectedVote}
          showDrumroll={false}
          onNextRound={nextRound}
          canAdvance={isAdmin}
          isLastRound={round >= totalRounds}
        />
      )}

      {/* RESULTS */}
      {phase === 'results' && (
        <GameResults
          subtitle={t('gamePlay.results.roundsPlayed', { defaultValue: '{{count}} rounds played', count: totalRounds })}
          results={results}
          onPlayAgain={() => {
            onEmitAction('two_truths:start');
          }}
        />
      )}
    </div>
  );
}
