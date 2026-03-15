import { useEffect, useMemo, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles, AlertTriangle, Flag, Clock, Shuffle } from 'lucide-react';
import type { GameParticipant } from '../shell';
import { PhaseBadge, PhaseTimer, type GamePhase } from '../shared';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { gamesApi } from '@/features/app/api/games';

type StrategicPhase = 'setup' | 'roles_assignment' | 'discussion' | 'debrief';

export interface StrategicEscapeSnapshot {
  kind: 'strategic-escape';
  phase: StrategicPhase;
  industry?: string | null;
  crisisType?: string | null;
  difficulty?: 'easy' | 'medium' | 'hard' | string | null;
  rolesAssigned?: boolean;
  discussionEndsAt?: string | null;
}

export interface StrategicEscapeBoardProps {
  participants: GameParticipant[];
  currentUserId: string;
  currentUserName?: string;
  currentUserAvatar: string;
  currentUserAvatarUrl?: string | null;
  eventId: string;
  sessionId: string | null;
  initialSnapshot?: any;
  gameData?: any;
  onSessionCreated: (sessionId: string) => void;
  onEmitSocketAction: (actionType: string, payload?: any) => Promise<void>;
}

const INDUSTRY_OPTIONS = [
  { value: 'techSaaS', icon: '💻' },
  { value: 'finance', icon: '💰' },
  { value: 'healthcare', icon: '🏥' },
  { value: 'retail', icon: '🛒' },
  { value: 'manufacturing', icon: '🏭' },
  { value: 'education', icon: '📚' },
] as const;

const CRISIS_OPTIONS = [
  { value: 'marketDisruption' },
  { value: 'productLaunchCrisis' },
  { value: 'budgetCuts' },
  { value: 'teamConflict' },
] as const;

const DIFFICULTY_OPTIONS: Array<{ value: 'easy' | 'medium' | 'hard'; icon: string }> = [
  { value: 'easy', icon: '😊' },
  { value: 'medium', icon: '🎯' },
  { value: 'hard', icon: '🔥' },
];

export function StrategicEscapeBoard({
  participants,
  currentUserId,
  currentUserName,
  currentUserAvatar,
  currentUserAvatarUrl,
  eventId,
  sessionId,
  initialSnapshot,
  gameData,
  onSessionCreated,
  onEmitSocketAction,
}: StrategicEscapeBoardProps) {
  const { t } = useTranslation();
  const [isCreating, setIsCreating] = useState(false);
  const [isAssigningRoles, setIsAssigningRoles] = useState(false);
  const [myRoleKey, setMyRoleKey] = useState<string | null>(null);
  const [roleLoading, setRoleLoading] = useState(false);
  const [swapWindowSeconds, setSwapWindowSeconds] = useState<number | null>(null);

  const snapshot: StrategicEscapeSnapshot | null =
    gameData?.kind === 'strategic-escape'
      ? gameData
      : initialSnapshot?.kind === 'strategic-escape'
        ? initialSnapshot
        : null;

  const phase: StrategicPhase = (snapshot?.phase || 'setup') as StrategicPhase;
  const selectedIndustryLabel = snapshot?.industry || null;
  const selectedCrisisLabel = snapshot?.crisisType || null;
  const selectedDifficulty = (snapshot?.difficulty as 'easy' | 'medium' | 'hard' | null) || 'medium';
  const rolesAssigned = !!snapshot?.rolesAssigned;
  const discussionEndsAt = snapshot?.discussionEndsAt || null;

  const isHost = participants.some(p => p.id === currentUserId && p.isHost);

  const [localIndustry, setLocalIndustry] = useState<string | null>(null);
  const [localCrisis, setLocalCrisis] = useState<string | null>(null);
  const [localDifficulty, setLocalDifficulty] = useState<'easy' | 'medium' | 'hard'>(selectedDifficulty || 'medium');

  useEffect(() => {
    if (selectedDifficulty) setLocalDifficulty(selectedDifficulty as 'easy' | 'medium' | 'hard');
  }, [selectedDifficulty]);

  // Auto-load my strategic role once a session exists and roles are assigned
  useEffect(() => {
    if (!sessionId || !rolesAssigned || !eventId) return;
    let cancelled = false;
    setRoleLoading(true);
    gamesApi
      .getMyStrategicRole(sessionId, eventId)
      .then(res => {
        if (!cancelled) setMyRoleKey(res?.roleKey || null);
      })
      .catch(() => {
        if (!cancelled) setMyRoleKey(null);
      })
      .finally(() => {
        if (!cancelled) setRoleLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [sessionId, rolesAssigned, eventId]);

  // Local 20s "swap window" after roles are assigned (purely UX-level)
  useEffect(() => {
    if (!rolesAssigned) {
      setSwapWindowSeconds(null);
      return;
    }
    setSwapWindowSeconds(20);
  }, [rolesAssigned]);

  useEffect(() => {
    if (swapWindowSeconds === null || swapWindowSeconds <= 0) return;
    const interval = setInterval(() => {
      setSwapWindowSeconds(prev => (prev !== null ? prev - 1 : prev));
    }, 1000);
    return () => clearInterval(interval);
  }, [swapWindowSeconds]);

  const isConfigured = !!localIndustry && !!localCrisis && !!localDifficulty;

  const handleCreateSession = useCallback(async () => {
    if (!isHost || !eventId || sessionId || !isConfigured) return;
    console.log('[StrategicEscapeBoard] handleCreateSession', {
      eventId,
      localIndustry,
      localCrisis,
      localDifficulty,
    });
    setIsCreating(true);
    try {
      const industryLabel = t(`strategic.industries.${localIndustry}.label`);
      const crisisLabel = t(`strategic.crises.${localCrisis}.label`);
      const difficultyLabel =
        localDifficulty === 'easy'
          ? t('strategic.difficulties.easy.label')
          : localDifficulty === 'hard'
            ? t('strategic.difficulties.hard.label')
            : t('strategic.difficulties.medium.label');

      const res = await gamesApi.createStrategicSession(eventId, {
        industry: industryLabel,
        crisisType: crisisLabel,
        difficulty: localDifficulty,
      });
      console.log('[StrategicEscapeBoard] createStrategicSession success', {
        sessionId: res.sessionId,
        config: res.config,
      });
      onSessionCreated(res.sessionId);
    } catch {
      // Errors surfaced via global handler
    } finally {
      setIsCreating(false);
    }
  }, [isHost, eventId, sessionId, isConfigured, localIndustry, localCrisis, localDifficulty, onSessionCreated]);

  const handleAssignRoles = useCallback(async () => {
    if (!isHost || !sessionId || rolesAssigned) return;
    console.log('[StrategicEscapeBoard] handleAssignRoles', {
      sessionId,
      rolesAssigned,
    });
    setIsAssigningRoles(true);
    try {
      await gamesApi.assignStrategicRoles(sessionId);
      await onEmitSocketAction('strategic:assign_roles');
    } catch {
      // Errors handled globally
    } finally {
      setIsAssigningRoles(false);
    }
  }, [isHost, sessionId, rolesAssigned, onEmitSocketAction]);

  const handleStartDiscussion = useCallback(async () => {
    if (!isHost || !sessionId || !rolesAssigned) return;
    console.log('[StrategicEscapeBoard] handleStartDiscussion', {
      sessionId,
      rolesAssigned,
    });
    await onEmitSocketAction('strategic:start_discussion');
  }, [isHost, sessionId, rolesAssigned, onEmitSocketAction]);

  const handleEndDiscussion = useCallback(async () => {
    if (!isHost || !sessionId) return;
    console.log('[StrategicEscapeBoard] handleEndDiscussion', {
      sessionId,
    });
    await onEmitSocketAction('strategic:end_discussion');
  }, [isHost, sessionId, onEmitSocketAction]);

  const discussionEndsAtDate = useMemo(
    () => (discussionEndsAt ? new Date(discussionEndsAt) : null),
    [discussionEndsAt]
  );

  const difficultyLabelKey =
    selectedDifficulty === 'easy'
      ? 'strategic.difficulties.easy'
      : selectedDifficulty === 'hard'
        ? 'strategic.difficulties.hard'
        : 'strategic.difficulties.medium';

  const myRoleName = myRoleKey ? t(`strategic.roles.${myRoleKey}.name`) : '';
  const myRoleBrief = myRoleKey ? t(`strategic.roles.${myRoleKey}.brief`) : '';
  const myRoleSecret = myRoleKey ? t(`strategic.roles.${myRoleKey}.secret`) : '';

  return (
    <div className="space-y-5">
      {/* Header with phase + scenario chips */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t('strategic.label', 'Strategic Escape Challenge')}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <PhaseBadge phase={phase as GamePhase} />
            {selectedIndustryLabel && (
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-[10px] font-medium text-muted-foreground">
                <span>🏢</span>
                {selectedIndustryLabel}
              </span>
            )}
            {selectedCrisisLabel && (
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-[10px] font-medium text-muted-foreground">
                <AlertTriangle className="h-3 w-3 text-warning" />
                {selectedCrisisLabel}
              </span>
            )}
            {selectedDifficulty && (
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-[10px] font-medium text-muted-foreground">
                <Flag className="h-3 w-3 text-destructive" />
                {t(`${difficultyLabelKey}.label`)}
              </span>
            )}
          </div>
        </div>

        {phase === 'discussion' && discussionEndsAtDate && (
          <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/40 px-3 py-2">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            <PhaseTimer targetTime={discussionEndsAtDate.toISOString()} />
          </div>
        )}
      </div>

      {/* Phase: setup — host configures scenario */}
      {phase === 'setup' && (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)]">
          <div className="space-y-4">
            <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 space-y-4">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">
                  {t('strategic.configure.title', 'Customize your scenario')}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t(
                    'strategic.configure.subtitle',
                    'Choose the industry, crisis, and difficulty so the challenge feels real for your team.'
                  )}
                </p>
              </div>

              <div className="space-y-3">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  {t('strategic.configure.industryLabel', "What's your industry?")}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {INDUSTRY_OPTIONS.map(option => {
                    const active = localIndustry === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => isHost && setLocalIndustry(option.value)}
                        className={cn(
                          'group relative flex flex-col items-start gap-1 rounded-xl border px-3 py-2.5 text-left text-[11px] transition-all',
                          'bg-gradient-to-br from-background via-background to-muted/60',
                          active
                            ? 'border-primary/70 shadow-[0_0_0_1px_rgba(59,130,246,0.4)]'
                            : 'border-border/60 hover:border-primary/40 hover:bg-muted/40',
                          !isHost && 'cursor-default opacity-80'
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{option.icon}</span>
                          <span className="font-semibold text-foreground">
                            {t(`${option.value}.label`)}
                          </span>
                        </div>
                        <p className="text-[10px] text-muted-foreground line-clamp-2">
                          {t(`${option.value}.description`)}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  {t('strategic.configure.crisisLabel', 'Choose your crisis type')}
                </p>
                <div className="grid gap-2.5">
                  {CRISIS_OPTIONS.map(option => {
                    const active = localCrisis === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => isHost && setLocalCrisis(option.value)}
                        className={cn(
                          'group relative flex flex-col items-start gap-1 rounded-xl border px-3 py-2.5 text-left text-[11px] transition-all',
                          active
                            ? 'border-primary/70 bg-primary/5 shadow-[0_0_0_1px_rgba(59,130,246,0.4)]'
                            : 'border-border/60 hover:border-primary/40 hover:bg-muted/40',
                          !isHost && 'cursor-default opacity-80'
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-3.5 w-3.5 text-warning" />
                          <span className="font-semibold text-foreground">
                            {t(`${option.value}.label`)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                          <span>{t(`${option.value}.meta`)}</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground line-clamp-2">
                          {t(`${option.value}.description`)}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  {t('strategic.configure.difficultyLabel', 'Difficulty level')}
                </p>
                <div className="flex flex-wrap gap-2">
                  {DIFFICULTY_OPTIONS.map(option => {
                    const active = localDifficulty === option.value;
                    const labelKey =
                      option.value === 'easy'
                        ? 'strategic.difficulties.easy'
                        : option.value === 'hard'
                          ? 'strategic.difficulties.hard'
                          : 'strategic.difficulties.medium';
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => isHost && setLocalDifficulty(option.value)}
                        className={cn(
                          'flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] transition-all',
                          active
                            ? 'border-primary bg-primary/10 text-primary-foreground'
                            : 'border-border/60 bg-muted/40 text-muted-foreground hover:border-primary/40',
                          !isHost && 'cursor-default opacity-80'
                        )}
                      >
                        <span>{option.icon}</span>
                        <span className="font-medium">{t(`${labelKey}.label`)}</span>
                        <span className="hidden sm:inline text-[10px] text-muted-foreground">
                          {t(`${labelKey}.hint`)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-border bg-gradient-to-b from-primary/5 via-background to-background p-4 sm:p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <p className="text-sm font-semibold text-foreground">
                  {t('strategic.preview.title', 'What your team will experience')}
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                {t(
                  'strategic.preview.body',
                  'Each participant receives a private email with their secret role and instructions. When they join, they see a 3D role card they can reveal and discuss before diving into the crisis.'
                )}
              </p>
              <div className="rounded-xl border border-dashed border-primary/30 bg-primary/5 px-3 py-2.5 text-[11px] text-primary">
                {t(
                  'strategic.preview.hint',
                  'This activity is async: people can join from any time zone, share perspectives, and come back later with decisions.'
                )}
              </div>

              {isHost ? (
                <div className="space-y-2 pt-1">
                  <Button
                    className="w-full h-10 text-[13px]"
                    disabled={!isConfigured || !!sessionId || isCreating}
                    onClick={handleCreateSession}
                  >
                    {isCreating
                      ? t('strategic.actions.creating', 'Creating session…')
                      : t('strategic.actions.createSession', 'Create strategic session')}
                  </Button>
                  <p className="text-[10px] text-muted-foreground">
                    {t(
                      'strategic.actions.createHelp',
                      'Once created, you can assign roles, trigger emails, and start the async discussion.'
                    )}
                  </p>
                </div>
              ) : (
                <p className="text-[11px] text-muted-foreground">
                  {t(
                    'strategic.preview.hostOnly',
                    'Your facilitator is customizing the scenario. You will see your secret role once the challenge is launched.'
                  )}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Phase: roles_assignment — secret role cards + swap window UX */}
      {phase === 'roles_assignment' && (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1.4fr)]">
          <div className="space-y-3">
            <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {t('strategic.roles.title', 'Your secret role')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t(
                      'strategic.roles.subtitle',
                      'Check your inbox for a detailed email. This card is a quick visual summary.'
                    )}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {swapWindowSeconds !== null && swapWindowSeconds > 0 && (
                    <div className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-[10px] text-muted-foreground">
                      <Shuffle className="h-3 w-3" />
                      {t('strategic.roles.swapWindow', {
                        defaultValue: 'Role swap window: {{seconds}}s',
                        seconds: swapWindowSeconds,
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div
                className={cn(
                  'relative mt-2 w-full max-w-md mx-auto perspective-1000',
                  !myRoleKey && 'opacity-60'
                )}
              >
                <div className="relative h-44 w-full rounded-2xl bg-gradient-to-br from-primary/80 via-primary to-primary/60 shadow-xl shadow-primary/40 overflow-hidden border border-primary/40">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_0_0,rgba(255,255,255,0.25),transparent_55%),radial-gradient(circle_at_100%_0,rgba(129,230,217,0.25),transparent_55%)]" />
                  <div className="relative h-full w-full p-4 flex flex-col justify-between">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-background/10 flex items-center justify-center text-[11px] font-bold text-primary-foreground">
                          {currentUserAvatar}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[11px] text-primary-foreground/80">
                            {t('strategic.roles.playerLabel', 'You')}
                          </span>
                          <span className="text-[12px] font-semibold text-primary-foreground">
                            {currentUserName || t('strategic.roles.unknownPlayer', 'Participant')}
                          </span>
                        </div>
                      </div>
                      <span className="rounded-full bg-background/10 px-2 py-1 text-[10px] font-semibold text-primary-foreground">
                        {t('strategic.roles.secret', 'Secret role')}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <p className="text-[11px] font-medium text-primary-foreground/70">
                        {myRoleKey
                          ? t('strategic.roles.roleNameLabel', 'Role')
                          : t('strategic.roles.loading', 'Waiting for your role…')}
                      </p>
                      <p className="text-[15px] font-semibold tracking-tight text-primary-foreground">
                        {myRoleName || t('strategic.roles.pending', 'Pending assignment')}
                      </p>
                      <p className="text-[11px] text-primary-foreground/85 line-clamp-2">
                        {myRoleBrief ||
                          t(
                            'strategic.roles.pendingHint',
                            'Your facilitator is assigning roles. Stay tuned — your perspective will be crucial.'
                          )}
                      </p>
                    </div>

                    <p className="text-[10px] text-primary-foreground/70 line-clamp-2">
                      {myRoleSecret ||
                        t(
                          'strategic.roles.secretHint',
                          'Once you know your role, think about what only you can see that others might miss.'
                        )}
                    </p>
                  </div>
                </div>
              </div>

              {roleLoading && (
                <p className="text-[11px] text-muted-foreground mt-1">
                  {t('strategic.roles.refreshing', 'Refreshing your role…')}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Shuffle className="h-4 w-4 text-info" />
                <p className="text-sm font-semibold text-foreground">
                  {t('strategic.roles.swapTitle', 'Quick swap & alignment')}
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                {t(
                  'strategic.roles.swapBody',
                  'Use the next few seconds to align in chat: if two people feel their roles should be swapped, they can agree and mentally trade perspectives before the challenge starts.'
                )}
              </p>

              {swapWindowSeconds !== null && swapWindowSeconds > 0 ? (
                <div className="rounded-xl bg-info/5 border border-info/30 px-3 py-2.5 text-[11px] text-info flex items-center justify-between gap-2">
                  <span>
                    {t(
                      'strategic.roles.swapCountdown',
                      'Swap window closes in {{seconds}}s',
                      { seconds: swapWindowSeconds }
                    )}
                  </span>
                </div>
              ) : (
                <div className="rounded-xl bg-muted/40 border border-border px-3 py-2.5 text-[11px] text-muted-foreground flex items-center gap-2">
                  <AlertTriangle className="h-3 w-3" />
                  <span>
                    {t(
                      'strategic.roles.swapClosed',
                      'Role swap window has closed. Stick with your current role for the discussion.'
                    )}
                  </span>
                </div>
              )}

              {isHost && (
                <div className="space-y-2 pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full h-9 text-[12px]"
                    disabled={!sessionId || rolesAssigned || isAssigningRoles}
                    onClick={handleAssignRoles}
                  >
                    {isAssigningRoles
                      ? t('strategic.actions.assigningRoles', 'Assigning roles and sending emails…')
                      : t('strategic.actions.assignRoles', 'Assign roles & send emails')}
                  </Button>
                  <Button
                    className="w-full h-9 text-[12px]"
                    disabled={!sessionId || !rolesAssigned}
                    onClick={handleStartDiscussion}
                  >
                    {t('strategic.actions.startDiscussion', 'Start async discussion')}
                  </Button>
                  <p className="text-[10px] text-muted-foreground">
                    {t(
                      'strategic.actions.assignHelp',
                      'First, assign roles so everyone receives their email. Then start the async discussion when you are ready.'
                    )}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Phase: discussion */}
      {phase === 'discussion' && (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1.2fr)]">
          <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {t('strategic.discussion.title', 'Async crisis discussion')}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t(
                    'strategic.discussion.subtitle',
                    'Share updates, decisions, and trade‑offs in your existing channels. Use this space to keep the scenario top‑of‑mind.'
                  )}
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-dashed border-primary/30 bg-primary/5 px-3 py-2.5 text-[11px] text-primary space-y-1">
              <p className="font-medium">
                {t(
                  'strategic.discussion.prompt',
                  'Your team faces a last‑minute product launch crisis with competing priorities and limited resources.'
                )}
              </p>
              <p className="text-[10px] text-primary/90">
                {t(
                  'strategic.discussion.promptHint',
                  'Each role brings a unique lens. Capture points of tension, decisions, and risks as you go.'
                )}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-muted/40 border border-border px-3 py-2.5 text-[11px] text-muted-foreground space-y-1">
                <p className="font-semibold text-foreground text-[12px]">
                  {t('strategic.discussion.guidingQuestions', 'Guiding questions')}
                </p>
                <ul className="list-disc pl-4 space-y-0.5">
                  <li>
                    {t(
                      'strategic.discussion.q1',
                      'What is the single biggest risk if we do nothing in the next 7 days?'
                    )}
                  </li>
                  <li>
                    {t(
                      'strategic.discussion.q2',
                      'Where are we mis‑aligned across product, marketing, and operations?'
                    )}
                  </li>
                  <li>
                    {t(
                      'strategic.discussion.q3',
                      'What trade‑off are you personally willing to own?'
                    )}
                  </li>
                </ul>
              </div>

              <div className="rounded-xl bg-muted/40 border border-border px-3 py-2.5 text-[11px] text-muted-foreground space-y-1">
                <p className="font-semibold text-foreground text-[12px]">
                  {t('strategic.discussion.teamInstructions', 'For your team')}
                </p>
                <ul className="list-disc pl-4 space-y-0.5">
                  <li>
                    {t(
                      'strategic.discussion.i1',
                      'Post updates in your existing tools (Slack, Teams, Notion).'
                    )}
                  </li>
                  <li>
                    {t(
                      'strategic.discussion.i2',
                      'Reply to each other in‑thread rather than starting new ones.'
                    )}
                  </li>
                  <li>
                    {t(
                      'strategic.discussion.i3',
                      'Capture one decision log that you will review together in the debrief.'
                    )}
                  </li>
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
                    {t('strategic.discussion.hostToolsTitle', 'Host controls')}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  {t(
                    'strategic.discussion.hostToolsBody',
                    'You can end the async discussion once you feel the team has explored enough perspectives.'
                  )}
                </p>
                <Button
                  variant="destructive"
                  className="w-full h-9 text-[12px]"
                  onClick={handleEndDiscussion}
                >
                  {t('strategic.actions.endDiscussion', 'End discussion & move to debrief')}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Phase: debrief */}
      {phase === 'debrief' && (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1.2fr)]">
          <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Flag className="h-4 w-4 text-success" />
              <p className="text-sm font-semibold text-foreground">
                {t('strategic.debrief.title', 'Debrief: what did we learn?')}
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              {t(
                'strategic.debrief.subtitle',
                'Use your regular meeting or retro to reflect on how decisions were made, what was missed, and what this means for real work.'
              )}
            </p>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-muted/40 border border-border px-3 py-2.5 text-[11px] text-muted-foreground space-y-1">
                <p className="font-semibold text-foreground text-[12px]">
                  {t('strategic.debrief.questionsTitle', 'Suggested debrief questions')}
                </p>
                <ul className="list-disc pl-4 space-y-0.5">
                  <li>
                    {t(
                      'strategic.debrief.q1',
                      'Where did we move too fast, and where did we move too slow?'
                    )}
                  </li>
                  <li>
                    {t(
                      'strategic.debrief.q2',
                      'Which roles saw risk earliest, and were they heard?'
                    )}
                  </li>
                  <li>
                    {t(
                      'strategic.debrief.q3',
                      'What would we do differently in a real incident starting tomorrow?'
                    )}
                  </li>
                </ul>
              </div>

              <div className="rounded-xl bg-muted/40 border border-border px-3 py-2.5 text-[11px] text-muted-foreground space-y-1">
                <p className="font-semibold text-foreground text-[12px]">
                  {t('strategic.debrief.actionsTitle', 'Turn insights into actions')}
                </p>
                <ul className="list-disc pl-4 space-y-0.5">
                  <li>
                    {t(
                      'strategic.debrief.a1',
                      'Capture 2–3 concrete changes you will make to process, communication, or ownership.'
                    )}
                  </li>
                  <li>
                    {t(
                      'strategic.debrief.a2',
                      'Assign clear owners and deadlines for each action.'
                    )}
                  </li>
                  <li>
                    {t(
                      'strategic.debrief.a3',
                      'Schedule a follow‑up check‑in in 4–6 weeks to review impact.'
                    )}
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 space-y-2">
              <p className="text-sm font-semibold text-foreground">
                {t('strategic.debrief.summaryTitle', 'Summary for leadership')}
              </p>
              <p className="text-xs text-muted-foreground">
                {t(
                  'strategic.debrief.summaryBody',
                  'Share 3 bullets: what we simulated, what we learned about how we work under pressure, and what we commit to changing.'
                )}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

