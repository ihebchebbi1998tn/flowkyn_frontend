import { useEffect, useMemo, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, AlertTriangle, Flag, Clock, Shuffle, Settings2 } from 'lucide-react';
import type { GameParticipant } from '../shell';
import { PhaseBadge, PhaseTimer, type GamePhase } from '../shared';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { gamesApi } from '@/features/app/api/games';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { ApiError } from '@/lib/apiError';

type StrategicPhase = 'setup' | 'roles_assignment' | 'discussion' | 'debrief';

export interface StrategicEscapeSnapshot {
  kind: 'strategic-escape';
  phase: StrategicPhase;
  // New standardized fields (backend)
  industryKey?: string | null;
  crisisKey?: string | null;
  difficultyKey?: 'easy' | 'medium' | 'hard' | string | null;
  industryLabel?: string | null;
  crisisLabel?: string | null;
  difficultyLabel?: string | null;
  // Legacy fallbacks (older snapshots)
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
  const [createError, setCreateError] = useState<string | null>(null);
  const [assignError, setAssignError] = useState<string | null>(null);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState(false);
  const [myRoleKey, setMyRoleKey] = useState<string | null>(null);
  const [roleLoading, setRoleLoading] = useState(false);
  const [roleRevealOpen, setRoleRevealOpen] = useState(false);
  const [roleRevealShown, setRoleRevealShown] = useState(false);
  const [swapWindowSeconds, setSwapWindowSeconds] = useState<number | null>(null);
  const [discussionTimeLeft, setDiscussionTimeLeft] = useState<number>(0);
  const [revealStatus, setRevealStatus] = useState<{ total: number; acknowledged: number; allAcknowledged: boolean } | null>(null);

  const snapshot: StrategicEscapeSnapshot | null =
    gameData?.kind === 'strategic-escape'
      ? gameData
      : initialSnapshot?.kind === 'strategic-escape'
        ? initialSnapshot
        : null;

  const phase: StrategicPhase = (snapshot?.phase || 'setup') as StrategicPhase;
  const selectedIndustryLabel =
    (snapshot as any)?.industryLabel || (snapshot as any)?.industry || null;
  const selectedCrisisLabel =
    (snapshot as any)?.crisisLabel || (snapshot as any)?.crisisType || null;
  const selectedDifficulty =
    ((snapshot as any)?.difficultyKey ||
      (snapshot as any)?.difficulty ||
      'medium') as 'easy' | 'medium' | 'hard';
  const rolesAssigned = !!snapshot?.rolesAssigned;
  const discussionEndsAt = snapshot?.discussionEndsAt || null;

  const isHost = participants.some(p => p.id === currentUserId && p.isHost);
  console.log('[StrategicEscapeBoard] render', {
    isHost,
    currentUserId,
    participantsCount: participants.length,
    phase,
    rolesAssigned,
    sessionId,
    hasSnapshot: !!snapshot,
    hasGameData: !!gameData,
    hasInitialSnapshot: !!initialSnapshot,
  });

  const [localIndustry, setLocalIndustry] = useState<string | null>(null);
  const [localCrisis, setLocalCrisis] = useState<string | null>(null);
  const [localDifficulty, setLocalDifficulty] = useState<'easy' | 'medium' | 'hard'>(selectedDifficulty || 'medium');

  const hostParticipant = useMemo(
    () => participants.find(p => p.isHost) || null,
    [participants]
  );

  useEffect(() => {
    if (selectedDifficulty) {
      console.log('[StrategicEscapeBoard] sync localDifficulty from snapshot', { selectedDifficulty });
      setLocalDifficulty(selectedDifficulty as 'easy' | 'medium' | 'hard');
    }
  }, [selectedDifficulty]);

  // Auto-load my strategic role once a session exists and roles are assigned
  useEffect(() => {
    if (!sessionId || !rolesAssigned || !eventId) {
      console.log('[StrategicEscapeBoard] skip getMyStrategicRole', {
        sessionId,
        rolesAssigned,
        eventId,
      });
      return;
    }
    let cancelled = false;
    setRoleLoading(true);
    console.log('[StrategicEscapeBoard] getMyStrategicRole start', { sessionId, eventId });
    gamesApi
      .getMyStrategicRole(sessionId, eventId)
      .then(res => {
        console.log('[StrategicEscapeBoard] getMyStrategicRole success', res);
        if (!cancelled) setMyRoleKey(res?.roleKey || null);
      })
      .catch((err) => {
        console.error('[StrategicEscapeBoard] getMyStrategicRole error', err);
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
      console.log('[StrategicEscapeBoard] swap window cleared (roles not assigned)');
      setSwapWindowSeconds(null);
      return;
    }
    console.log('[StrategicEscapeBoard] swap window started (20s)');
    setSwapWindowSeconds(20);
  }, [rolesAssigned]);

  useEffect(() => {
    if (swapWindowSeconds === null || swapWindowSeconds <= 0) return;
    const interval = setInterval(() => {
      setSwapWindowSeconds(prev => (prev !== null ? prev - 1 : prev));
    }, 1000);
    console.log('[StrategicEscapeBoard] swap window ticking', { swapWindowSeconds });
    return () => clearInterval(interval);
  }, [swapWindowSeconds]);

  const isConfigured = !!localIndustry && !!localCrisis && !!localDifficulty;
  console.log('[StrategicEscapeBoard] local config state', {
    localIndustry,
    localCrisis,
    localDifficulty,
    isConfigured,
  });

  const handleCreateSession = useCallback(async () => {
    if (!isHost || !eventId || sessionId || !isConfigured) return;
    setCreateError(null);
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
        industryKey: localIndustry!,
        crisisKey: localCrisis!,
        difficulty: localDifficulty,
        industry: industryLabel,
        crisisType: crisisLabel,
        difficultyLabel,
      });
      console.log('[StrategicEscapeBoard] createStrategicSession success', {
        sessionId: res.sessionId,
        config: res.config,
      });
      onSessionCreated(res.sessionId);
      
      // Immediately emit to ensure game state syncs
      onEmitSocketAction('strategic:configure', {
        industryKey: localIndustry!,
        crisisKey: localCrisis!,
        difficultyKey: localDifficulty,
        industryLabel,
        crisisLabel,
        difficultyLabel,
      }).catch(err => {
        console.warn('[StrategicEscapeBoard] strategic:configure emit failed:', err);
      });
      
      toast.success(
        t('games.toasts.launching', {
          defaultValue: 'We’re launching {{gameName}} for this event. Hang tight — your screen will update in a moment.',
          gameName: t('activities.strategicEscape.name', { defaultValue: 'Strategic Escape Challenge' }),
        })
      );
    } catch (err: any) {
      console.error('[StrategicEscapeBoard] createStrategicSession error', err);
      const message =
        err?.response?.data?.message ||
        err?.message ||
        t(
          'strategic.errors.createFailed',
          { defaultValue: 'Failed to create strategic session. Please check your permissions and try again.' }
        );
      setCreateError(message);
    } finally {
      setIsCreating(false);
    }
  }, [isHost, eventId, sessionId, isConfigured, localIndustry, localCrisis, localDifficulty, onSessionCreated]);

  const handleAssignRoles = useCallback(async () => {
    if (!isHost || !sessionId || rolesAssigned) return;
    setAssignError(null);
    console.log('[StrategicEscapeBoard] handleAssignRoles', {
      sessionId,
      rolesAssigned,
    });
    setIsAssigningRoles(true);
    try {
      await gamesApi.assignStrategicRoles(sessionId);
      await onEmitSocketAction('strategic:assign_roles');
    } catch (err: any) {
      console.error('[StrategicEscapeBoard] assignStrategicRoles error', err);
      const message =
        err?.response?.data?.message ||
        err?.message ||
        t(
          'strategic.errors.assignFailed',
          { defaultValue: 'Failed to assign roles. Make sure participants have joined and you are the facilitator.' }
        );
      setAssignError(message);
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
    try {
      await onEmitSocketAction('strategic:start_discussion');
      console.log('[StrategicEscapeBoard] strategic:start_discussion emitted');
    } catch (err) {
      console.error('[StrategicEscapeBoard] strategic:start_discussion error', err);
    }
  }, [isHost, sessionId, rolesAssigned, onEmitSocketAction]);

  const handleEndDiscussion = useCallback(async () => {
    if (!isHost || !sessionId) return;
    console.log('[StrategicEscapeBoard] handleEndDiscussion', {
      sessionId,
    });
    try {
      await onEmitSocketAction('strategic:end_discussion');
      console.log('[StrategicEscapeBoard] strategic:end_discussion emitted');
    } catch (err) {
      console.error('[StrategicEscapeBoard] strategic:end_discussion error', err);
    }
  }, [isHost, sessionId, onEmitSocketAction]);

  const discussionEndsAtDate = useMemo(
    () => (discussionEndsAt ? new Date(discussionEndsAt) : null),
    [discussionEndsAt]
  );

  useEffect(() => {
    if (!discussionEndsAtDate) return;
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const end = discussionEndsAtDate.getTime();
      const timeLeft = Math.max(0, Math.floor((end - now) / 1000));
      setDiscussionTimeLeft(timeLeft);
      if (timeLeft <= 0) clearInterval(interval);
    }, 1000);
    console.log('[StrategicEscapeBoard] discussion timer started', { discussionEndsAtDate });
    return () => clearInterval(interval);
  }, [discussionEndsAtDate]);

  const difficultyLabelKey =
    selectedDifficulty === 'easy'
      ? 'strategic.difficulties.easy'
      : selectedDifficulty === 'hard'
        ? 'strategic.difficulties.hard'
        : 'strategic.difficulties.medium';

  const myRoleName = myRoleKey ? t(`strategic.roles.${myRoleKey}.name`) : '';
  const myRoleBrief = myRoleKey ? t(`strategic.roles.${myRoleKey}.brief`) : '';
  const myRoleSecret = myRoleKey ? t(`strategic.roles.${myRoleKey}.secret`) : '';

  useEffect(() => {
    // When roles are assigned and this participant has a role, reveal it once via a modal.
    if (phase !== 'roles_assignment') return;
    if (!myRoleKey) return;
    if (roleRevealShown) return;
    setRoleRevealOpen(true);
    setRoleRevealShown(true);
  }, [phase, myRoleKey, roleRevealShown]);

  // Host-only: poll reveal acknowledgement status once roles are assigned.
  useEffect(() => {
    if (!isHost) return;
    if (!sessionId) return;
    if (!rolesAssigned) return;

    let cancelled = false;
    const tick = async () => {
      try {
        const s = await gamesApi.getStrategicRoleRevealStatus(sessionId, eventId);
        if (!cancelled) setRevealStatus(s);
      } catch (err) {
        console.warn('[StrategicEscapeBoard] getStrategicRoleRevealStatus failed', err);
      }
    };

    tick();
    const interval = setInterval(tick, 2000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [isHost, sessionId, eventId, rolesAssigned]);

  return (
    <div className="space-y-4 lg:space-y-5">
      <Dialog open={roleRevealOpen} onOpenChange={setRoleRevealOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {t('strategic.roleReveal.title', { defaultValue: 'Your secret role' })}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="rounded-xl border border-border bg-muted/20 p-3 space-y-1">
              <p className="text-sm font-semibold text-foreground">
                {myRoleName || t('strategic.roleReveal.pending', { defaultValue: 'Pending assignment' })}
              </p>
              <p className="text-xs text-muted-foreground">
                {myRoleBrief || t('strategic.roleReveal.pendingHint', { defaultValue: 'Waiting for role assignment…' })}
              </p>
            </div>
            {myRoleSecret && (
              <div className="rounded-xl border border-border bg-card p-3">
                <p className="text-xs text-muted-foreground whitespace-pre-wrap">{myRoleSecret}</p>
              </div>
            )}
            <Button
              className="w-full"
              onClick={() => {
                setRoleRevealOpen(false);
                if (sessionId) {
                  gamesApi.acknowledgeMyStrategicRole(sessionId, eventId).catch((err) => {
                    console.warn('[StrategicEscapeBoard] acknowledgeMyStrategicRole failed', err);
                    if (ApiError.is(err)) {
                      toast.error(t(`apiErrors.${err.code}`, { defaultValue: err.message }));
                    } else {
                      toast.error(t('apiErrors.UNKNOWN'));
                    }
                  });
                }
              }}
            >
              {t('strategic.roleReveal.close', { defaultValue: 'Got it' })}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Header with phase + scenario chips */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t('strategic.label', { defaultValue: 'Strategic Escape Challenge' })}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <PhaseBadge phase={phase as GamePhase} />
            {hostParticipant && (
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-[10px] font-medium text-muted-foreground">
                {t('strategic.meta.hostLabel', {
                  defaultValue: 'Facilitator: {{name}}',
                  name: hostParticipant.name || t('strategic.rolesMeta.unknownPlayer', { defaultValue: 'Participant' }),
                })}
              </span>
            )}
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-[10px] font-medium text-muted-foreground">
              {t('strategic.meta.phaseLabel', {
                defaultValue: 'Phase: {{phase}}',
                phase:
                  phase === 'roles_assignment'
                    ? t('strategic.phases.rolesAssignment')
                    : t(`strategic.phases.${phase}`),
              })}
            </span>
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

        <div className="flex items-center gap-2">
          {phase === 'discussion' && discussionEndsAtDate && (
            <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/40 px-3 py-2">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              <PhaseTimer 
                timeLeft={discussionTimeLeft}
                maxTime={30 * 60}
              />
            </div>
          )}

          {isHost && phase === 'setup' && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-[11px] gap-1"
              onClick={() => setIsConfigModalOpen(true)}
            >
              <Settings2 className="h-3.5 w-3.5" />
              {t('strategic.modal.openLabel', { defaultValue: 'Configure scenario' })}
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-[11px]"
            onClick={() => setIsHowItWorksOpen(v => !v)}
          >
            {t('strategic.howItWorks.label', { defaultValue: 'How this works' })}
          </Button>
        </div>
      </div>

      {/* How it works */}
      {isHowItWorksOpen && (
        <div className="rounded-2xl border border-border bg-muted/30 px-4 py-3 text-[11px] text-muted-foreground">
          <ul className="list-disc pl-4 space-y-1">
            <li>{t('strategic.howItWorks.point1', { defaultValue: 'Everyone gets a secret role.' })}</li>
            <li>{t('strategic.howItWorks.point2', { defaultValue: 'You’ll get an email + in‑app card with instructions.' })}</li>
            <li>{t('strategic.howItWorks.point3', { defaultValue: 'We’ll debrief what we learned at the end.' })}</li>
          </ul>
        </div>
      )}

      {/* Phase intro */}
      <div className="rounded-2xl border border-border bg-card px-4 py-3">
        <p className="text-[12px] font-medium text-foreground">
          {phase === 'setup'
            ? t('strategic.phaseIntro.setup', { defaultValue: 'Right now, the facilitator is configuring the scenario.' })
            : phase === 'roles_assignment'
              ? t('strategic.phaseIntro.rolesAssignment', { defaultValue: 'Right now, secret roles are being assigned — check your inbox.' })
              : phase === 'discussion'
                ? t('strategic.phaseIntro.discussion', { defaultValue: 'Right now, share perspectives and decisions over time.' })
                : t('strategic.phaseIntro.debrief', { defaultValue: 'Right now, turn insights into concrete changes.' })}
        </p>
      </div>

      {/* Config modal (host only, setup phase) */}
      <Dialog open={isConfigModalOpen} onOpenChange={setIsConfigModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Settings2 className="h-4 w-4 text-primary" />
              {t('strategic.modal.title', { defaultValue: 'Configure strategic scenario' })}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 pt-1">
            <p className="text-xs text-muted-foreground">
              {t('strategic.modal.subtitle', {
                defaultValue: 'Choose the industry, crisis, and difficulty for this async simulation.',
              })}
            </p>

            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  {t('strategic.configure.industryLabel', { defaultValue: "What's your industry?" })}
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
                            {t(`strategic.industries.${option.value}.label`)}
                          </span>
                        </div>
                        <p className="text-[10px] text-muted-foreground line-clamp-2">
                          {t(`strategic.industries.${option.value}.description`)}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  {t('strategic.configure.crisisLabel', { defaultValue: 'Choose your crisis type' })}
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
                            {t(`strategic.crises.${option.value}.label`)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                          <span>{t(`strategic.crises.${option.value}.meta`)}</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground line-clamp-2">
                          {t(`strategic.crises.${option.value}.description`)}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  {t('strategic.configure.difficultyLabel', { defaultValue: 'Difficulty level' })}
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
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border/60 bg-muted/40 text-muted-foreground hover:border-primary/40',
                          !isHost && 'cursor-default opacity-80'
                        )}
                      >
                        <span>{option.icon}</span>
                        <span className="font-medium">{t(`${labelKey}.label`)}</span>
                        <span
                          className={cn(
                            'hidden sm:inline text-[10px]',
                            active ? 'text-primary/80' : 'text-muted-foreground'
                          )}
                        >
                          {t(`${labelKey}.hint`)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 border-t border-border pt-3">
              <Button
                className="w-full h-10 text-[13px]"
                disabled={!isHost || !isConfigured || isCreating}
                onClick={async () => {
                  await handleCreateSession();
                  setIsConfigModalOpen(false);
                }}
              >
                {isCreating
                  ? t('strategic.actions.creating', { defaultValue: 'Creating session…' })
                  : sessionId 
                    ? t('strategic.actions.sessionCreated', { defaultValue: 'Session already created' })
                    : t('strategic.actions.createSession', { defaultValue: 'Create strategic session' })}
              </Button>
              {createError && (
                <p className="text-[10px] text-destructive">
                  {createError}
                </p>
              )}
              <p className="text-[10px] text-muted-foreground">
                {t(
                  'strategic.actions.createHelp',
                  'Once created, you can assign roles, trigger emails, and start the async discussion.'
                )}
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Phase: setup — host configures scenario */}
      {phase === 'setup' && (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)]">
          <div className="space-y-4">
            <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-foreground">
                    {t('strategic.preview.title', { defaultValue: 'What your team will experience' })}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t('strategic.preview.body', {
                      defaultValue: 'Each participant receives a private email with their secret role and instructions. When they join, they see a 3D role card they can reveal and discuss before diving into the crisis.',
                    })}
                  </p>
                </div>
              </div>
              <div className="rounded-xl border border-dashed border-primary/30 bg-primary/5 px-3 py-2.5 text-[11px] text-primary">
                {t('strategic.preview.hint', {
                  defaultValue: 'This activity is async: people can join from any time zone, share perspectives, and come back later with decisions.',
                })}
              </div>

              {isHost ? (
                <div className="space-y-2 pt-1">
                  <p className="text-[11px] text-muted-foreground">
                    {t('strategic.preview.configureHint', {
                      defaultValue: 'Use the Configure button to choose industry, crisis, and difficulty before you launch.',
                    })}
                  </p>
                </div>
              ) : (
                <p className="text-[11px] text-muted-foreground">
                  {t('strategic.preview.hostOnly', {
                    defaultValue: 'Your facilitator is customizing the scenario. You will see your secret role once the challenge is launched.',
                  })}
                </p>
              )}
            </div>
          </div>

          {isHost && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 space-y-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {t('strategic.preview.summaryTitle', { defaultValue: 'Current configuration' })}
                </p>
                <div className="space-y-2 text-[11px] text-muted-foreground">
                  <div className="flex items-center justify-between">
                    <span>{t('strategic.preview.summaryIndustry', { defaultValue: 'Industry' })}</span>
                    <span className="font-medium">
                      {localIndustry
                        ? t(`strategic.industries.${localIndustry}.label`)
                        : t('strategic.preview.summaryUnset', { defaultValue: 'Not set' })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>{t('strategic.preview.summaryCrisis', { defaultValue: 'Crisis type' })}</span>
                    <span className="font-medium">
                      {localCrisis
                        ? t(`strategic.crises.${localCrisis}.label`)
                        : t('strategic.preview.summaryUnset', { defaultValue: 'Not set' })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>{t('strategic.preview.summaryDifficulty', { defaultValue: 'Difficulty' })}</span>
                    <span className="font-medium">
                      {localDifficulty
                        ? t(`${difficultyLabelKey}.label`)
                        : t('strategic.preview.summaryUnset', { defaultValue: 'Not set' })}
                    </span>
                  </div>
                </div>

                <Button
                  className="w-full h-9 text-[12px] mt-2"
                  variant="outline"
                  onClick={() => setIsConfigModalOpen(true)}
                >
                  <Settings2 className="h-4 w-4 mr-1.5" />
                  {t('strategic.modal.openLabel', { defaultValue: 'Configure scenario' })}
                </Button>

                <Button
                  className="w-full h-9 text-[12px]"
                  disabled={!sessionId || rolesAssigned || isAssigningRoles || !isConfigured}
                  style={rolesAssigned && revealStatus?.allAcknowledged ? { display: 'none' } : undefined}
                  onClick={handleAssignRoles}
                >
                  {isAssigningRoles
                    ? t('strategic.actions.assigningRoles', { defaultValue: 'Assigning roles…' })
                    : t('strategic.actions.assignRoles', { defaultValue: 'Assign roles' })}
                </Button>
                {isHost && rolesAssigned && revealStatus && !revealStatus.allAcknowledged && (
                  <div className="inline-flex items-center justify-between gap-2 rounded-xl border border-border bg-muted/30 px-3 py-2 text-[11px] text-muted-foreground">
                    <span>
                      {t('strategic.roleReveal.progress', {
                        defaultValue: '{{acknowledged}}/{{total}} roles revealed',
                        acknowledged: revealStatus.acknowledged,
                        total: revealStatus.total,
                      })}
                    </span>
                    <span className="font-medium tabular-nums text-foreground">
                      {revealStatus.acknowledged}/{revealStatus.total}
                    </span>
                  </div>
                )}
                {assignError && (
                  <p className="text-[10px] text-destructive">
                    {assignError}
                  </p>
                )}
              </div>
            </div>
          )}
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
                    {t('strategic.rolesSection.title', { defaultValue: 'Your secret role' })}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t(
                      'strategic.rolesSection.subtitle',
                      'This role is private to you. Keep it secret and use it to guide your decisions.'
                    )}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {swapWindowSeconds !== null && swapWindowSeconds > 0 && (
                    <div className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-[10px] text-muted-foreground">
                      <Shuffle className="h-3 w-3" />
                      {t('strategic.rolesMeta.swapWindow', {
                        defaultValue: 'Role swap window: {{seconds}}s',
                        seconds: swapWindowSeconds,
                      })}
                    </div>
                  )}
                </div>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={myRoleKey ? 'role-revealed' : 'role-pending'}
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.98 }}
                  transition={{ duration: 0.22, ease: 'easeOut' }}
                  className={cn(
                    'relative mt-2 w-full max-w-md mx-auto',
                    !myRoleKey && 'opacity-70'
                  )}
                >
                  <div className="relative h-44 w-full rounded-2xl bg-card border border-border shadow-sm">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_0_0,rgba(148,163,184,0.18),transparent_55%),radial-gradient(circle_at_100%_0,rgba(59,130,246,0.16),transparent_55%)]" />
                    <div className="relative h-full w-full p-4 flex flex-col justify-between">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-[11px] font-bold text-foreground">
                          {currentUserAvatar}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[11px] text-muted-foreground">
                            {t('strategic.rolesMeta.playerLabel', { defaultValue: 'You' })}
                          </span>
                          <span className="text-[12px] font-semibold text-foreground">
                            {currentUserName || t('strategic.rolesMeta.unknownPlayer', { defaultValue: 'Participant' })}
                          </span>
                        </div>
                      </div>
                      <span className="rounded-full bg-muted px-2 py-1 text-[10px] font-semibold text-foreground">
                        {t('strategic.rolesMeta.secret', { defaultValue: 'Secret role' })}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <p className="text-[11px] font-medium text-muted-foreground">
                        {myRoleKey
                          ? t('strategic.rolesMeta.roleNameLabel', { defaultValue: 'Role' })
                          : t('strategic.rolesMeta.loading', { defaultValue: 'Waiting for your role…' })}
                      </p>
                      <p className="text-[15px] font-semibold tracking-tight text-foreground">
                        {myRoleName || t('strategic.rolesMeta.pending', { defaultValue: 'Pending assignment' })}
                      </p>
                      <p className="text-[11px] text-muted-foreground line-clamp-2">
                        {myRoleBrief ||
                          t(
                            'strategic.rolesMeta.pendingHint',
                            'Your facilitator is assigning roles. Stay tuned — your perspective will be crucial.'
                          )}
                      </p>
                    </div>

                    <p className="text-[10px] text-muted-foreground line-clamp-2">
                      {myRoleSecret ||
                        t(
                          'strategic.rolesMeta.secretHint',
                          'Once you know your role, think about what only you can see that others might miss.'
                        )}
                    </p>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>

              {roleLoading && (
                <p className="text-[11px] text-muted-foreground mt-1">
                  {t('strategic.rolesMeta.refreshing', { defaultValue: 'Refreshing your role…' })}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Shuffle className="h-4 w-4 text-info" />
                <p className="text-sm font-semibold text-foreground">
                  {t('strategic.rolesMeta.swapTitle', { defaultValue: 'Quick swap & alignment' })}
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                  {t(
                      'strategic.rolesMeta.swapBody',
                  'Use the next few seconds to align in chat: if two people feel their roles should be swapped, they can agree and mentally trade perspectives before the challenge starts.'
                )}
              </p>

              {swapWindowSeconds !== null && swapWindowSeconds > 0 ? (
                <div className="rounded-xl bg-info/5 border border-info/30 px-3 py-2.5 text-[11px] text-info flex items-center justify-between gap-2">
                  <span>
                    {t(
                      'strategic.rolesMeta.swapCountdown',
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
                      'strategic.rolesMeta.swapClosed',
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
                    style={rolesAssigned && revealStatus?.allAcknowledged ? { display: 'none' } : undefined}
                    onClick={handleAssignRoles}
                  >
                    {isAssigningRoles
                      ? t('strategic.actions.assigningRoles', { defaultValue: 'Assigning roles…' })
                      : t('strategic.actions.assignRoles', { defaultValue: 'Assign roles' })}
                  </Button>
                  {assignError && (
                    <p className="text-[10px] text-destructive">
                      {assignError}
                    </p>
                  )}
                  <Button
                    className="w-full h-9 text-[12px]"
                    disabled={!sessionId || !rolesAssigned}
                    onClick={handleStartDiscussion}
                  >
                    {t('strategic.actions.startDiscussion', { defaultValue: 'Start async discussion' })}
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
                  {t('strategic.discussion.title', { defaultValue: 'Async crisis discussion' })}
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
                  {t('strategic.discussion.guidingQuestions', { defaultValue: 'Guiding questions' })}
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
                  {t('strategic.discussion.teamInstructions', { defaultValue: 'For your team' })}
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
                    {t('strategic.discussion.hostToolsTitle', { defaultValue: 'Host controls' })}
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
                  {t('strategic.actions.endDiscussion', { defaultValue: 'End discussion & move to debrief' })}
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
                {t('strategic.debrief.title', { defaultValue: 'Debrief: what did we learn?' })}
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
                  {t('strategic.debrief.questionsTitle', { defaultValue: 'Suggested debrief questions' })}
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
                  {t('strategic.debrief.actionsTitle', { defaultValue: 'Turn insights into actions' })}
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
                {t('strategic.debrief.summaryTitle', { defaultValue: 'Summary for leadership' })}
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

