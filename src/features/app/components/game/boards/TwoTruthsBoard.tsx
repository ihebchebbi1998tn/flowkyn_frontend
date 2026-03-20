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
import { usePhaseEndTimer } from '@/hooks/usePhaseEndTimer';
import { useGameSnapshot } from '@/hooks/useGameSnapshot';
import type { BaseGameBoardProps } from '@/features/app/components/game/types';
import { Button } from '@/components/ui/button';
import { HowItWorksModal } from '../shared/HowItWorksModal';

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

export interface TwoTruthsBoardProps extends BaseGameBoardProps {
  onRoundComplete?: (roundNumber: number) => void;
  participants: Array<{ id: string; name?: string; avatar?: string }>;
  currentUserName: string;
  currentUserAvatar: string;
  activeRoundId: string | null;
  onEmitAction: (actionType: string, payload?: unknown) => Promise<void>;
  isAdmin?: boolean;
}

function isTwoTruthsSnapshot(value: unknown): value is TwoTruthsSnapshot {
  if (!value || typeof value !== 'object') return false;
  return (value as Record<string, unknown>).kind === GAME_TYPES.TWO_TRUTHS;
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
  const [howOpen, setHowOpen] = useState(false);
  const snapshot = useGameSnapshot<TwoTruthsSnapshot>(gameData, initialSnapshot, isTwoTruthsSnapshot);

  const phase: GamePhase = (snapshot?.phase || 'waiting') as GamePhase;
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
  const [activeSubmissionPhase, setActiveSubmissionPhase] = useState<'input' | 'review' | null>(null);
  const [animatingReveal, setAnimatingReveal] = useState(false);

  // Presenter doesn't need to "select a lie" again during the vote phase.
  useEffect(() => {
    if (phase === 'vote' && isPresenter) {
      setSelectedVote(null);
    }
  }, [phase, isPresenter]);

  // During reveal, make sure the presenter sees the reveal as their own correct answer
  // (without requiring them to have voted).
  useEffect(() => {
    if (phase === 'reveal' && isPresenter && revealedLie && selectedVote === null) {
      setSelectedVote(revealedLie);
    }
  }, [phase, isPresenter, revealedLie, selectedVote]);

  // Use the new timer hook instead of manual interval
  const timeLeft = usePhaseEndTimer(
    phase === 'submit' ? submitEndsAt : phase === 'vote' ? voteEndsAt : null,
    phase === 'submit' ? 30 : 20,
    phase === 'submit' || phase === 'vote'
  );

  // State machine for submission UX
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

  
  const presenterName =
    participants.find((p) => p.id === presenterId)?.name || currentUserName;

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
    .map((p) => ({
      name: p.name,
      score: scores[p.id] || 0,
      avatar: p.avatar,
    }))
    .sort((a, b) => b.score - a.score)
    .map((r, i) => ({ ...r, rank: i + 1 }));

  return (
    <div className="space-y-4">
      <HowItWorksModal open={howOpen} onOpenChange={setHowOpen} baseKey="gameHowItWorks.twoTruths" />
      <CountdownOverlay active={showCountdown} onComplete={handleCountdownDone} />
      
      <TwoTruthsHeader
        round={round}
        totalRounds={totalRounds}
        phase={phase}
        timeLeft={timeLeft}
        maxTime={maxTime}
      />

      <div className="flex justify-end">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-[11px]"
          onClick={() => setHowOpen(true)}
        >
          {t('gameHowItWorks.common.title', { defaultValue: 'How this works' })}
        </Button>
      </div>

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
          onSelect={(id) => {
            if (isPresenter) return; // presenter shouldn't vote/select
            if (voted) return;
            if (id === 's0' || id === 's1' || id === 's2') setSelectedVote(id);
          }}
          onSubmitVote={submitVote}
          disableSubmit={!selectedVote || voted}
          isPresenter={isPresenter}
        />
      )}

      {phase === 'vote' && (isPresenter || isAdmin) && (
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

