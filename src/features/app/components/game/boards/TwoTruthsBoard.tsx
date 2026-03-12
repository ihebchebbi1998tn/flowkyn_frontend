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

interface Statement {
  id: string;
  text: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  isLie?: boolean;
}

export interface TwoTruthsBoardProps {
  onRoundComplete?: (roundNumber: number) => void;
  participants: any[];
  currentUserId: string;
  currentUserName: string;
  currentUserAvatar: string;
}

export function TwoTruthsBoard({ onRoundComplete, participants, currentUserId, currentUserName, currentUserAvatar }: TwoTruthsBoardProps) {
  const { t } = useTranslation();
  const [phase, setPhase] = useState<GamePhase>('waiting');
  const [round, setRound] = useState(1);
  const totalRounds = 4;
  const [timeLeft, setTimeLeft] = useState(30);
  const [statements, setStatements] = useState(['', '', '']);
  const [submitted, setSubmitted] = useState(false);
  const [selectedVote, setSelectedVote] = useState<string | null>(null);
  const [voted, setVoted] = useState(false);
  const [revealedLie, setRevealedLie] = useState<string | null>(null);
  const [showCountdown, setShowCountdown] = useState(false);

  const [showDrumroll, setShowDrumroll] = useState(false);

  const handleSubmit = useCallback(() => {
    setSubmitted(true);
    setTimeout(() => { setPhase('vote'); setTimeLeft(20); }, 1500);
  }, []);

  const handleVote = useCallback(() => {
    setVoted(true);
    setTimeout(() => { 
      setPhase('reveal'); 
      setShowDrumroll(true);
      setTimeout(() => {
        setRevealedLie('s2'); 
        setShowDrumroll(false);
      }, 3500); // 3.5s dramatic delay
    }, 1500);
  }, []);

  useEffect(() => {
    if ((phase === 'submit' || phase === 'vote') && timeLeft > 0) {
      const t = setTimeout(() => setTimeLeft(tl => tl - 1), 1000);
      return () => clearTimeout(t);
    }
    if (timeLeft === 0 && phase === 'submit' && !submitted) handleSubmit();
    if (timeLeft === 0 && phase === 'vote' && !voted) handleVote();
  }, [phase, timeLeft, submitted, voted, handleSubmit, handleVote]);

  const handleNextRound = () => {
    if (round >= totalRounds) {
      setPhase('results');
    } else {
      onRoundComplete?.(round);
      setRound(r => r + 1);
      setPhase('submit');
      setTimeLeft(30);
      setSubmitted(false);
      setSelectedVote(null);
      setVoted(false);
      setRevealedLie(null);
      setShowDrumroll(false);
      setStatements(['', '', '']);
    }
  };

  const startGame = () => { setShowCountdown(true); };
  const handleCountdownDone = useCallback(() => {
    setShowCountdown(false);
    setPhase('submit');
    setTimeLeft(30);
  }, []);
  const maxTime = phase === 'submit' ? 30 : 20;

  const targetStatements: Statement[] = [
    { id: 's0', text: statements[0] || 'Statement 1', authorId: currentUserId, authorName: currentUserName, authorAvatar: currentUserAvatar },
    { id: 's1', text: statements[1] || 'Statement 2', authorId: currentUserId, authorName: currentUserName, authorAvatar: currentUserAvatar },
    { id: 's2', text: statements[2] || 'Statement 3 (Lie)', authorId: currentUserId, authorName: currentUserName, authorAvatar: currentUserAvatar, isLie: true },
  ];
  
  const mockTally = [
    { statementId: 's0', count: Math.floor(participants.length * 0.2), percentage: 20 },
    { statementId: 's1', count: Math.floor(participants.length * 0.3), percentage: 30 },
    { statementId: 's2', count: Math.max(1, Math.floor(participants.length * 0.5)), percentage: 50 },
  ];

  const results = participants.map((p, i) => ({
    name: p.name,
    score: p.id === currentUserId ? 300 : Math.floor(Math.random() * 200),
    avatar: p.avatar,
    rank: i + 1
  })).sort((a, b) => b.score - a.score).map((p, i) => ({ ...p, rank: i + 1 }));

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
        <TwoTruthsWaitingSection onStart={startGame} />
      )}

      {/* SUBMIT */}
      {phase === 'submit' && !submitted && (
        <TwoTruthsSubmitSection
          statements={statements}
          onChange={(index, value) => {
            const next = [...statements];
            next[index] = value;
            setStatements(next);
          }}
          onSubmit={handleSubmit}
          isSubmitDisabled={statements.some((s) => !s.trim())}
        />
      )}

      {/* Submitted waiting */}
      {phase === 'submit' && submitted && (
        <TwoTruthsSubmittedSection />
      )}

      {/* VOTE */}
      {phase === 'vote' && (
        <TwoTruthsVoteSection
          currentUserName={currentUserName}
          currentUserAvatar={currentUserAvatar}
          targetStatements={targetStatements}
          selectedVote={selectedVote}
          voted={voted}
          onSelect={(id) => !voted && setSelectedVote(id)}
          onSubmitVote={handleVote}
          disableSubmit={!selectedVote}
        />
      )}

      {/* REVEAL */}
      {phase === 'reveal' && (
        <TwoTruthsRevealSection
          targetStatements={targetStatements}
          mockTally={mockTally}
          revealedLie={revealedLie}
          selectedVote={selectedVote}
          showDrumroll={showDrumroll}
          onNextRound={handleNextRound}
          isLastRound={round >= totalRounds}
        />
      )}

      {/* RESULTS */}
      {phase === 'results' && (
        <GameResults
          subtitle={t('gamePlay.results.roundsPlayed', { count: totalRounds })}
          results={results}
          onPlayAgain={() => {
            setPhase('waiting');
            setRound(1);
            setTimeLeft(30);
            setSubmitted(false);
            setSelectedVote(null);
            setVoted(false);
            setRevealedLie(null);
            setStatements(['', '', '']);
          }}
        />
      )}
    </div>
  );
}
