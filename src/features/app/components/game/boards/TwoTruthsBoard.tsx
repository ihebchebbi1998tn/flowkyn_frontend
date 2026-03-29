import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { GameResults, CountdownOverlay, type GamePhase, InsightsModal } from '../shared';
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
  submitSeconds?: number;
  voteSeconds?: number;
};

export interface TwoTruthsBoardProps extends BaseGameBoardProps {
  onRoundComplete?: (roundNumber: number) => void;
  participants: Array<{ id: string; name?: string; avatar?: string }>;
  currentUserName: string;
  currentUserAvatar: string;
  activeRoundId: string | null;
  onEmitAction: (actionType: string, payload?: unknown) => Promise<void>;
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
}: TwoTruthsBoardProps) {
  const { t } = useTranslation();
  const [howOpen, setHowOpen] = useState(false);
  const [insightsOpen, setInsightsOpen] = useState(false);
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
  const submitSeconds = Math.max(5, Number(snapshot?.submitSeconds || 30));
  const voteSeconds = Math.max(5, Number(snapshot?.voteSeconds || 20));

  const [localStatements, setLocalStatements] = useState(['', '', '']);
  const [selectedVote, setSelectedVote] = useState<'s0' | 's1' | 's2' | null>(null);
  const [lieIndex, setLieIndex] = useState(2);
  const voted = !!votes[currentUserId];
  const eligibleVoterCount = useMemo(
    () =>
      presenterId ? participants.filter((p) => p.id !== presenterId).length : 0,
    [participants, presenterId],
  );
  const voteCount = Object.keys(votes).length;
  const allNonPresentersHaveVoted =
    eligibleVoterCount === 0 || voteCount >= eligibleVoterCount;
  const [showCountdown, setShowCountdown] = useState(false);
  const [showStartingTransition, setShowStartingTransition] = useState(false);
  const [activeSubmissionPhase, setActiveSubmissionPhase] = useState<'input' | 'review' | null>(null);
  const [animatingReveal, setAnimatingReveal] = useState(false);

  const prevPhaseRef = useRef(phase);

  useEffect(() => {
    // If phase transitions from waiting to submit, and we didn't initiate it (we are not showing the host countdown)
    if (prevPhaseRef.current === 'waiting' && phase === 'submit' && !showCountdown) {
      setShowStartingTransition(true);
    }
    prevPhaseRef.current = phase;
  }, [phase, showCountdown]);

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
    phase === 'submit' ? submitSeconds : voteSeconds,
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

  const maxTime = phase === 'submit' ? submitSeconds : voteSeconds;

  
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
      <CountdownOverlay active={showStartingTransition} onComplete={() => setShowStartingTransition(false)} />
      
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
        <TwoTruthsWaitingSection onStart={startGame} rounds={totalRounds} />
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

      {phase === 'vote' && isPresenter && (
        <div className="flex flex-col items-end gap-1">
          <button
            type="button"
            disabled={!allNonPresentersHaveVoted}
            className="text-[11px] text-muted-foreground hover:text-foreground underline disabled:opacity-50 disabled:no-underline disabled:cursor-not-allowed"
            onClick={reveal}
          >
            {t('gamePlay.twoTruths.revealAnswers', { defaultValue: 'Reveal answers' })}
          </button>
          {!allNonPresentersHaveVoted && eligibleVoterCount > 0 && (
            <p className="text-[10px] text-muted-foreground text-right max-w-xs">
              {t('gamePlay.twoTruths.waitForAllVotes', {
                defaultValue: 'Wait for every player to vote ({{count}}/{{total}}).',
                count: voteCount,
                total: eligibleVoterCount,
              })}
            </p>
          )}
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
          canAdvance={isPresenter}
          isLastRound={round >= totalRounds}
        />
      )}

      {/* RESULTS */}
      {phase === 'results' && (
        <>
          <GameResults
            subtitle={t('gamePlay.results.roundsPlayed', { defaultValue: '{{count}} rounds played', count: totalRounds })}
            results={results}
            onPlayAgain={() => {
              onEmitAction('two_truths:start').catch(err => {
                console.error('[TwoTruthsBoard] Play again failed:', err);
              });
            }}
          />
          <div className="flex justify-center pt-4">
            <button
              onClick={() => setInsightsOpen(true)}
              className="text-sm text-primary hover:text-primary/80 underline"
            >
              {t('gamePlay.insights.viewDetails', { defaultValue: 'View Details' })}
            </button>
          </div>
        </>
      )}

      <InsightsModal
        open={insightsOpen}
        onOpenChange={setInsightsOpen}
        insights={{
          accuracy: results.length > 0 ? Math.round((results.filter(r => r.score > 0).length / results.length) * 100) : 0,
          previousAccuracy: null,
          bestGuess: null,
          trickiestStatement: null,
          trickiestFoolPercentage: null,
          percentile: null,
        }}
      />
    </div>
  );
}

