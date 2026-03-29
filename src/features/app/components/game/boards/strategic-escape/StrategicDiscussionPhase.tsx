import { useCallback } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { Clock, MessageSquare } from 'lucide-react';
import { GameActionButton, PhaseTimer } from '../../shared';
import { usePhaseEndTimer } from '@/hooks/usePhaseEndTimer';
import type { StrategicEscapeSnapshot } from '../strategicEscape.types';

interface Props {
  isHost: boolean;
  sessionId: string | null;
  snapshot: StrategicEscapeSnapshot | null;
  onEmitSocketAction: (actionType: string) => Promise<void>;
}

export function StrategicDiscussionPhase({ isHost, sessionId, snapshot, onEmitSocketAction }: Props) {
  const { t } = useTranslation();
  const discussionEndsAt = snapshot?.discussionEndsAt || null;
  const discussionDurationMinutes = Math.max(1, Number(snapshot?.discussionDurationMinutes || 45));
  const discussionTimeLeft = usePhaseEndTimer(discussionEndsAt, discussionDurationMinutes * 60, true);

  const handleEndDiscussion = useCallback(async () => {
    if (!isHost || !sessionId) return;
    try {
      await onEmitSocketAction('strategic:end_discussion');
    } catch (err: unknown) {
      console.error('[StrategicDiscussionPhase] Failed to end discussion:', err);
      toast.error(t('strategic.errors.endDiscussionFailed', { defaultValue: 'Failed to end discussion. Please try again.' }));
    }
  }, [isHost, sessionId, onEmitSocketAction, t]);

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1.2fr)]">
      <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 space-y-4">
        {/* Timer banner */}
        {discussionEndsAt && (
          <div className="flex items-center gap-3 rounded-xl border border-warning/30 bg-warning/5 px-4 py-3">
            <Clock className="h-5 w-5 text-warning shrink-0" />
            <div className="flex-1">
              <p className="text-[12px] font-semibold text-foreground">
                {t('strategic.discussion.timerTitle', { defaultValue: 'Discussion in progress' })}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {t('strategic.discussion.timerHint', { defaultValue: 'Share perspectives before time runs out.' })}
              </p>
            </div>
            <PhaseTimer timeLeft={discussionTimeLeft} maxTime={discussionDurationMinutes * 60} />
          </div>
        )}

        <div>
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="h-4 w-4 text-primary" />
            <p className="text-sm font-semibold text-foreground">
              {t('strategic.discussion.title', { defaultValue: 'Async crisis discussion' })}
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            {t('strategic.discussion.subtitle', { defaultValue: 'Share updates, decisions, and trade‑offs. Use the chat panel to communicate.' })}
          </p>
        </div>

        <div className="rounded-xl border border-dashed border-primary/30 bg-primary/5 px-3 py-2.5 text-[11px] text-primary space-y-1">
          <p className="font-medium">
            {t('strategic.discussion.prompt', { defaultValue: 'Your team faces a last-minute crisis with competing priorities.' })}
          </p>
          <p className="text-[10px] text-primary/90">
            {t('strategic.discussion.promptHint', { defaultValue: 'Each role brings a unique lens. Capture decisions and risks.' })}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-muted/40 border border-border px-3 py-2.5 text-[11px] text-muted-foreground space-y-1">
            <p className="font-semibold text-foreground text-[12px]">
              {t('strategic.discussion.guidingQuestions', { defaultValue: 'Guiding questions' })}
            </p>
            <ul className="list-disc pl-4 space-y-0.5">
              <li>{t('strategic.discussion.q1', { defaultValue: 'What is the biggest risk if we do nothing in 7 days?' })}</li>
              <li>{t('strategic.discussion.q2', { defaultValue: 'Where are we mis-aligned across teams?' })}</li>
              <li>{t('strategic.discussion.q3', { defaultValue: 'What trade-off are you willing to own?' })}</li>
            </ul>
          </div>
          <div className="rounded-xl bg-muted/40 border border-border px-3 py-2.5 text-[11px] text-muted-foreground space-y-1">
            <p className="font-semibold text-foreground text-[12px]">
              {t('strategic.discussion.teamInstructions', { defaultValue: 'For your team' })}
            </p>
            <ul className="list-disc pl-4 space-y-0.5">
              <li>{t('strategic.discussion.i1', { defaultValue: 'Use the chat panel to share updates in real-time.' })}</li>
              <li>{t('strategic.discussion.i2', { defaultValue: 'Reply to each other rather than starting new threads.' })}</li>
              <li>{t('strategic.discussion.i3', { defaultValue: 'Capture one decision log for the debrief.' })}</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {isHost && (
          <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-semibold text-foreground">
                {t('strategic.discussion.hostToolsTitle', { defaultValue: 'Host controls' })}
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              {t('strategic.discussion.hostToolsBody', { defaultValue: 'End the discussion once enough perspectives have been explored.' })}
            </p>
            <GameActionButton variant="destructive" size="md" className="w-full text-[12px]" onClick={handleEndDiscussion}>
              {t('strategic.actions.endDiscussion', { defaultValue: 'End discussion & move to debrief' })}
            </GameActionButton>
          </div>
        )}
      </div>
    </div>
  );
}
