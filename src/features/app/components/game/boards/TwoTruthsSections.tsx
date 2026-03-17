import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Send,
  CheckCircle,
  ThumbsUp,
  ThumbsDown,
  AlertCircle,
  Trophy,
  ChevronRight,
  Sparkles,
  Target,
  Zap,
  Settings,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { RoundIndicator, PhaseTimer, PhaseBadge, type GamePhase } from '../shared';

export interface TwoTruthsHeaderProps {
  round: number;
  totalRounds: number;
  phase: GamePhase;
  timeLeft: number;
  maxTime: number;
}

export function TwoTruthsHeader({
  round,
  totalRounds,
  phase,
  timeLeft,
  maxTime,
}: TwoTruthsHeaderProps) {
  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="p-4 sm:p-5">
        <div className="flex items-center justify-between mb-4">
          <RoundIndicator currentRound={round} totalRounds={totalRounds} />
          <div className="flex items-center gap-3">
            <PhaseBadge phase={phase} />
            {(phase === 'submit' || phase === 'vote') && (
              <PhaseTimer timeLeft={timeLeft} maxTime={maxTime} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface WaitingSectionProps {
  onStart: () => void;
  isAdmin?: boolean;
  rounds: number;
}

export function TwoTruthsWaitingSection({
  onStart,
  isAdmin,
  rounds,
}: WaitingSectionProps) {
  const { t } = useTranslation();

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="relative p-8 sm:p-12 text-center">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
        <div className="relative">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 mx-auto mb-5 ring-4 ring-primary/10">
            <Target className="h-9 w-9 text-primary" />
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">
            {t('gamePlay.twoTruths.title', { defaultValue: 'Two Truths & a Lie' })}
          </h3>
          <p className="text-[13px] text-muted-foreground mb-8 max-w-md mx-auto leading-relaxed">
            {t(
              'gamePlay.twoTruths.description',
              'Take turns sharing two true facts and one that is made up. The team’s job is to spot which one doesn’t quite fit.',
            )}
          </p>

          {isAdmin && (
            <div className="mb-10 max-w-sm mx-auto p-5 rounded-2xl border border-primary/10 bg-primary/[0.02] backdrop-blur-sm animate-in fade-in slide-in-from-bottom-2 duration-700">
              <div className="flex items-center gap-2.5 mb-5 justify-center">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                  <Settings className="h-3.5 w-3.5 text-primary" />
                </div>
                <h4 className="text-[13px] font-bold text-foreground tracking-tight uppercase">
                  {t('gamePlay.twoTruths.roundSettings', { defaultValue: 'Round settings' })}
                </h4>
              </div>

              <div className="space-y-5">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[12px] font-medium text-muted-foreground">
                    {t('gamePlay.twoTruths.howManyRounds', { defaultValue: 'This activity is set to play:' })}
                  </span>
                  <Badge variant="brand" className="text-[11px] px-2.5 py-0.5 rounded-full shadow-sm">
                    {rounds} {t('common.rounds', { count: rounds })}
                  </Badge>
                </div>

                <p className="text-[11px] text-muted-foreground italic flex items-center justify-center gap-1.5 pt-1">
                  <Sparkles className="h-3 w-3 text-primary/60" />
                  {t('gamePlay.twoTruths.recommendedRounds', { defaultValue: 'Tip: 3–5 rounds works great for most teams.' })}
                </p>
                <p className="text-[11px] text-muted-foreground text-left">
                  {t('gamePlay.twoTruths.roundsFromEvent', { defaultValue: 'Rounds were configured when you created this activity.' })}
                </p>
              </div>
            </div>
          )}

          <Button
            variant="brand"
            onClick={onStart}
            size="xl"
            disabled={!isAdmin}
            className="px-10 gap-2.5 shadow-lg shadow-primary/20 transform hover:scale-105 active:scale-95 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            <Zap className="h-5 w-5" /> {t('gamePlay.twoTruths.startRound', { round: 1 })}
          </Button>

          {!isAdmin && (
            <p className="mt-3 text-[11px] text-muted-foreground">
              {t('gamePlay.twoTruths.waitingForHostToStart', { defaultValue: 'Waiting for the host to start the game…' })}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

interface SubmitSectionProps {
  statements: string[];
  onChange: (index: number, value: string) => void;
  onSubmit: () => void;
  isSubmitDisabled: boolean;
}

export function TwoTruthsSubmitSection({
  statements,
  onChange,
  onSubmit,
  isSubmitDisabled,
}: SubmitSectionProps) {
  const { t } = useTranslation();

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="px-5 py-4 border-b border-border bg-gradient-to-r from-primary/5 to-transparent">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
            <Send className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="text-[14px] font-semibold text-foreground">
              {t('gamePlay.twoTruths.yourTurn', { defaultValue: "It's your turn" })}
            </h3>
            <p className="text-[11px] text-muted-foreground">
              {t('gamePlay.twoTruths.makeItBelievable', { defaultValue: 'Write two truths and one lie. Make the lie believable.' })}
            </p>
          </div>
        </div>
      </div>
      <div className="p-5 space-y-3">
        {statements.map((s, i) => (
          <div key={i}>
            <div className="flex items-center gap-2 mb-1.5">
              <span
                className={cn(
                  'flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold',
                  s.trim() ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground',
                )}
              >
                {String.fromCharCode(65 + i)}
              </span>
              <label className="text-[11px] font-medium text-muted-foreground">
                {t('gamePlay.twoTruths.statementLabel', { defaultValue: 'Statement {{num}}', num: i + 1 })}
              </label>
            </div>
            <Textarea
              value={s}
              onChange={(e) => onChange(i, e.target.value)}
              placeholder={
                i === 2
                  ? t('gamePlay.twoTruths.liePlaceholder', { defaultValue: 'This could be your lie…' })
                  : t('gamePlay.twoTruths.truthPlaceholder', { defaultValue: 'Write a truth (or a lie)…' })
              }
              rows={1}
              className="text-[13px] resize-none min-h-[44px] rounded-xl border-border/60 focus:border-primary/40 transition-all"
            />
          </div>
        ))}
        <div className="flex justify-end pt-3">
          <Button
            onClick={onSubmit}
            disabled={isSubmitDisabled}
            className="h-10 px-6 text-[13px] gap-2 rounded-xl"
          >
            <Send className="h-4 w-4" /> {t('gamePlay.twoTruths.submit', { defaultValue: 'Submit' })}
          </Button>
        </div>
      </div>
    </div>
  );
}

interface SubmittedSectionProps {
  message?: ReactNode;
}

export function TwoTruthsSubmittedSection({ message }: SubmittedSectionProps) {
  const { t } = useTranslation();

  return (
    <div className="rounded-2xl border border-border bg-card p-8 text-center animate-scale-in">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-success/10 mx-auto mb-4 ring-4 ring-success/10">
        <CheckCircle className="h-8 w-8 text-success" />
      </div>
      <h3 className="text-[16px] font-bold text-foreground mb-1">
        {t('gamePlay.twoTruths.submitted', { defaultValue: 'Submitted!' })}
      </h3>
      <p className="text-[12px] text-muted-foreground">
        {message || t('gamePlay.twoTruths.waitingForVotes', { defaultValue: 'Please wait — voting starts soon…' })}
      </p>
      <div className="flex items-center justify-center gap-1 mt-4">
        {[0, 0.2, 0.4].map((d, i) => (
          <div
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse"
            style={{ animationDelay: `${d}s` }}
          />
        ))}
      </div>
    </div>
  );
}

export interface TwoTruthsVoteSectionProps {
  currentUserName: string;
  currentUserAvatar: string;
  targetStatements: { id: string; text: string }[];
  selectedVote: string | null;
  voted: boolean;
  onSelect: (id: string) => void;
  onSubmitVote: () => void;
  disableSubmit: boolean;
  /** When true, user is the presenter (host) and sees "Reveal" instead of "Lock In Vote" */
  isPresenter?: boolean;
}

export function TwoTruthsVoteSection({
  currentUserName,
  currentUserAvatar,
  targetStatements,
  selectedVote,
  voted,
  onSelect,
  onSubmitVote,
  disableSubmit,
  isPresenter = false,
}: TwoTruthsVoteSectionProps) {
  const { t } = useTranslation();

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="px-5 py-4 border-b border-border bg-gradient-to-r from-warning/5 to-transparent">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9 ring-2 ring-warning/20 ring-offset-2 ring-offset-card">
            <AvatarFallback className="bg-info/10 text-info text-[10px] font-bold">
              {currentUserAvatar}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-[14px] font-semibold text-foreground">
              {t('gamePlay.twoTruths.statementsOf', { defaultValue: "{{name}}'s statements", name: currentUserName })}
            </h3>
            <p className="text-[11px] text-muted-foreground">
              {t('gamePlay.twoTruths.spotTheLie', { defaultValue: 'Spot the lie — choose carefully!' })}
            </p>
          </div>
        </div>
      </div>
      <div className="p-5 space-y-2.5">
        {targetStatements.map((stmt, i) => (
          <motion.button
            key={stmt.id}
            onClick={() => !voted && onSelect(stmt.id)}
            disabled={voted}
            whileHover={!voted ? { scale: 1.015, y: -2 } : {}}
            whileTap={!voted ? { scale: 0.98 } : {}}
            className={cn(
              'w-full text-left p-4 rounded-xl border-2 transition-colors duration-200 group/vote relative overflow-hidden',
              selectedVote === stmt.id
                ? 'border-primary bg-primary/5 shadow-sm shadow-primary/10'
                : 'border-border hover:border-primary/30 hover:bg-accent/30 hover:shadow-sm',
              voted && 'cursor-default opacity-80',
            )}
          >
            <AnimatePresence>
              {selectedVote === stmt.id && (
                <motion.div
                  layoutId="selected-vote-bg"
                  className="absolute inset-0 bg-primary/5 pointer-events-none"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                />
              )}
            </AnimatePresence>

            <div className="flex items-start gap-3 relative z-10">
              <span
                className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-lg text-[12px] font-bold shrink-0 transition-all',
                  selectedVote === stmt.id
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-muted text-muted-foreground group/vote:hover:bg-primary/10 group/vote:hover:text-primary',
                )}
              >
                {String.fromCharCode(65 + i)}
              </span>
              <p className="text-[13px] text-foreground leading-relaxed pt-0.5">
                {stmt.text}
              </p>
              {selectedVote === stmt.id && (
                <motion.div
                  initial={{ scale: 0, rotate: -45 }}
                  animate={{ scale: 1, rotate: 0 }}
                  className="ml-auto"
                >
                  <CheckCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                </motion.div>
              )}
            </div>
          </motion.button>
        ))}

        {!isPresenter && !voted && (
          <div className="flex justify-end pt-3">
            <Button
              onClick={onSubmitVote}
              disabled={disableSubmit}
              className="h-10 px-6 text-[13px] gap-2 rounded-xl"
            >
              <ThumbsUp className="h-4 w-4" /> {t('gamePlay.twoTruths.lockVote', { defaultValue: 'Lock vote' })}
            </Button>
          </div>
        )}

        {isPresenter && (
          <div className="p-3 rounded-xl bg-info/[0.06] border border-info/20 text-center animate-fade-in">
            <p className="text-[12px] text-info font-medium">
              {t('gamePlay.twoTruths.revealAsHost', 'Reveal when ready — you don\'t need to lock')}
            </p>
          </div>
        )}

        {!isPresenter && voted && (
          <div className="p-3 rounded-xl bg-success/[0.06] border border-success/20 text-center animate-fade-in">
            <div className="flex items-center justify-center gap-2">
              <CheckCircle className="h-4 w-4 text-success" />
              <p className="text-[12px] text-success font-semibold">
                {t('gamePlay.twoTruths.voteLocked', { defaultValue: 'Vote locked' })}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export interface TwoTruthsRevealSectionProps {
  targetStatements: { id: string; text: string }[];
  mockTally: { statementId: string; count: number; percentage: number }[];
  revealedLie: string | null;
  selectedVote: string | null;
  showDrumroll: boolean;
  onNextRound: () => void;
  canAdvance?: boolean;
  isLastRound: boolean;
}

export function TwoTruthsRevealSection({
  targetStatements,
  mockTally,
  revealedLie,
  selectedVote,
  showDrumroll,
  onNextRound,
  canAdvance = true,
  isLastRound,
}: TwoTruthsRevealSectionProps) {
  const { t } = useTranslation();

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden animate-fade-in relative">
      <AnimatePresence>
        {showDrumroll && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.1, filter: 'blur(5px)' }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-card/90 backdrop-blur-md"
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 0.5 }}
              className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-6"
            >
              <Sparkles className="w-8 h-8 text-primary" />
            </motion.div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground mb-4">
              {t('gamePlay.twoTruths.findingTruth', 'Finding the truth...')}
            </h2>
            <div className="w-64 h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ duration: 3.5, ease: 'easeInOut' }}
                className="h-full bg-primary rounded-full"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="px-5 py-4 border-b border-border bg-gradient-to-r from-info/5 to-transparent">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-info/10">
            <Sparkles className="h-4 w-4 text-info" />
          </div>
          <div>
            <h3 className="text-[14px] font-semibold text-foreground">
              {t('gamePlay.twoTruths.theReveal', { defaultValue: 'The reveal' })}
            </h3>
            <p className="text-[11px] text-muted-foreground">
              {t('gamePlay.twoTruths.seeVotes', { defaultValue: 'See how everyone voted' })}
            </p>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-2.5">
        {targetStatements.map((stmt, i) => {
          const tally = mockTally.find((tallyItem) => tallyItem.statementId === stmt.id);
          const isLie = stmt.id === revealedLie;
          const wasMyVote = selectedVote === stmt.id;

          return (
            <motion.div
              key={stmt.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.15 + (showDrumroll ? 0 : 0.4) }}
              className={cn(
                'p-4 rounded-xl border-2 transition-all',
                isLie
                  ? 'border-destructive/40 bg-destructive/[0.04]'
                  : 'border-success/30 bg-success/[0.03]',
              )}
            >
              <div className="flex items-start justify-between gap-3 mb-2.5">
                <div className="flex items-start gap-3">
                  <span
                    className={cn(
                      'flex h-7 w-7 items-center justify-center rounded-lg text-[12px] font-bold shrink-0',
                      isLie
                        ? 'bg-destructive text-destructive-foreground'
                        : 'bg-success text-success-foreground',
                    )}
                  >
                    {String.fromCharCode(65 + i)}
                  </span>
                  <div>
                    <p className="text-[13px] text-foreground leading-relaxed">{stmt.text}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-[9px] gap-1',
                          isLie
                            ? 'border-destructive/30 text-destructive bg-destructive/5'
                            : 'border-success/30 text-success bg-success/5',
                        )}
                      >
                        {isLie ? (
                          <>
                            <AlertCircle className="h-2.5 w-2.5" /> {t('gamePlay.twoTruths.lie', { defaultValue: 'LIE' })}
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-2.5 w-2.5" /> {t('gamePlay.twoTruths.truth', { defaultValue: 'TRUTH' })}
                          </>
                        )}
                      </Badge>
                      {wasMyVote && (
                        <Badge
                          variant="outline"
                          className="text-[9px] border-primary/30 text-primary bg-primary/5 gap-1"
                        >
                          <Target className="h-2.5 w-2.5" /> {t('gamePlay.twoTruths.yourPick', { defaultValue: 'Your pick' })}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              {tally && (
                <div className="ml-10 mt-1">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all duration-1000',
                          isLie ? 'bg-destructive/60' : 'bg-success/50',
                        )}
                        style={{ width: `${tally.percentage}%` }}
                      />
                    </div>
                    <span className="text-[11px] text-muted-foreground font-medium w-16 text-right">
                      {t('gamePlay.twoTruths.votes', {
                        defaultValue: '{{count}} votes ({{pct}}%)',
                        count: tally.count,
                        pct: tally.percentage,
                      })}
                    </span>
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      <div className="px-5 py-4 border-t border-border flex items-center justify-between bg-muted/20">
        <div>
          {selectedVote === revealedLie ? (
            <div className="flex items-center gap-2 animate-scale-in">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-success/15">
                <Zap className="h-4 w-4 text-success" />
              </div>
              <div>
                <p className="text-[13px] font-bold text-success">
                  {t('gamePlay.twoTruths.correct', { defaultValue: 'Correct!' })}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {t('gamePlay.twoTruths.greatWork', { defaultValue: 'Nice work' })}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-destructive/10">
                <ThumbsDown className="h-4 w-4 text-destructive" />
              </div>
              <div>
                <p className="text-[13px] font-bold text-destructive">
                  {t('gamePlay.twoTruths.wrongGuess', { defaultValue: 'Not quite' })}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {t('gamePlay.twoTruths.betterLuck', { defaultValue: 'Better luck next time' })}
                </p>
              </div>
            </div>
          )}
        </div>
        {canAdvance ? (
          <Button onClick={onNextRound} className="h-10 px-6 text-[13px] gap-2 rounded-xl">
            {isLastRound ? (
              <>
                <Trophy className="h-4 w-4" /> {t('gamePlay.twoTruths.viewResults', { defaultValue: 'View results' })}
              </>
            ) : (
              <>
                <ChevronRight className="h-4 w-4" /> {t('gamePlay.twoTruths.nextRound', { defaultValue: 'Next round' })}
              </>
            )}
          </Button>
        ) : (
          <span className="text-[11px] text-muted-foreground">
            {t('gamePlay.twoTruths.waitForHost', { defaultValue: 'Waiting for the host…' })}
          </span>
        )}
      </div>
    </div>
  );
}

