import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Shuffle, AlertTriangle } from 'lucide-react';
import { GameActionButton } from '../../shared';
import { gamesApi } from '@/features/app/api/games';
import { toast } from 'sonner';
import { ApiError } from '@/lib/apiError';
import { useCountdown } from '@/hooks/useCountdown';
import { StrategicRoleRevealCard } from './StrategicRoleRevealCard';
import type { StrategicEscapeSnapshot } from '../strategicEscape.types';

interface Props {
  isHost: boolean;
  eventId: string;
  sessionId: string | null;
  snapshot: StrategicEscapeSnapshot | null;
  currentUserId: string;
  currentUserName?: string;
  currentUserAvatar: string;
  currentUserAvatarUrl?: string | null;
  onEmitSocketAction: (actionType: string, payload?: unknown, opts?: { sessionId?: string }) => Promise<void>;
}

export function StrategicRolesPhase({
  isHost, eventId, sessionId, snapshot, currentUserId,
  currentUserName, currentUserAvatar, currentUserAvatarUrl,
  onEmitSocketAction,
}: Props) {
  const { t } = useTranslation();
  const rolesAssigned = !!snapshot?.rolesAssigned;

  const [myRoleKey, setMyRoleKey] = useState<string | null>(null);
  const [roleLoading, setRoleLoading] = useState(false);
  const [isAssigningRoles, setIsAssigningRoles] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);
  const [myReady, setMyReady] = useState(false);
  const [promptState, setPromptState] = useState<{ promptIndex: number; promptUpdatedAt: string | null } | null>(null);
  const [isAdvancingPrompt, setIsAdvancingPrompt] = useState(false);
  const [promptNextIn, setPromptNextIn] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [notesSaving, setNotesSaving] = useState(false);
  const [notesSavedAt, setNotesSavedAt] = useState<string | null>(null);
  const lastSavedNotesRef = useRef('');
  const [revealStatus, setRevealStatus] = useState<{ total: number; acknowledged: number; allAcknowledged: boolean } | null>(null);
  const [readyStatus, setReadyStatus] = useState<{ total: number; ready: number; allReady: boolean } | null>(null);

  const swapWindowSeconds = useCountdown(20, !!rolesAssigned);

  // Load role
  useEffect(() => {
    if (!sessionId || !rolesAssigned || !eventId) return;
    let cancelled = false;
    setRoleLoading(true);
    gamesApi.getMyStrategicRole(sessionId, eventId)
      .then(res => { if (!cancelled) setMyRoleKey(res?.roleKey || null); })
      .catch(() => { if (!cancelled) setMyRoleKey(null); })
      .finally(() => { if (!cancelled) setRoleLoading(false); });
    return () => { cancelled = true; };
  }, [sessionId, rolesAssigned, eventId]);

  // Load helpers
  useEffect(() => {
    if (!sessionId || !eventId || !myRoleKey) return;
    let cancelled = false;
    (async () => {
      try {
        const [role, ps, n] = await Promise.all([
          gamesApi.getMyStrategicRole(sessionId, eventId),
          gamesApi.getMyStrategicRolePromptState(sessionId, eventId).catch(() => null),
          gamesApi.getMyStrategicNotes(sessionId, eventId).catch(() => null),
        ]);
        if (cancelled) return;
        if (role?.readyAt) setMyReady(true);
        if (ps) setPromptState(ps);
        if (n) { setNotes(n.content || ''); lastSavedNotesRef.current = n.content || ''; setNotesSavedAt(n.updatedAt || null); }
      } catch {}
    })();
    return () => { cancelled = true; };
  }, [sessionId, eventId, myRoleKey]);

  const myRoleName = myRoleKey ? t(`strategic.roles.${myRoleKey}.name`) : '';
  const myRoleBrief = myRoleKey ? t(`strategic.roles.${myRoleKey}.brief`) : '';
  const myRoleSecret = myRoleKey ? t(`strategic.roles.${myRoleKey}.secret`) : '';

  const rolePrompts = useMemo(() => {
    if (!myRoleKey) return [];
    return [
      t(`strategic.rolePrompts.${myRoleKey}.p1`, { defaultValue: '' }),
      t(`strategic.rolePrompts.${myRoleKey}.p2`, { defaultValue: '' }),
      t(`strategic.rolePrompts.${myRoleKey}.p3`, { defaultValue: '' }),
    ].filter(Boolean);
  }, [myRoleKey, t]);

  const currentPrompt = useMemo(() => {
    if (!rolePrompts.length) return null;
    return rolePrompts[Math.max(0, promptState?.promptIndex ?? 0) % rolePrompts.length] || null;
  }, [rolePrompts, promptState?.promptIndex]);

  // Prompt timer
  useEffect(() => {
    if (!sessionId || !eventId || !myRoleKey || !currentPrompt) return;
    setPromptNextIn(90);
    let cancelled = false;
    const interval = setInterval(() => {
      setPromptNextIn(prev => {
        if (prev === null) return prev;
        const next = prev - 1;
        if (next > 0) return next;
        if (cancelled) return null;
        setIsAdvancingPrompt(true);
        gamesApi.advanceMyStrategicRolePrompt(sessionId, eventId)
          .then(ps => setPromptState(ps))
          .catch(() => {})
          .finally(() => setIsAdvancingPrompt(false));
        return 90;
      });
    }, 1000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [sessionId, eventId, myRoleKey, currentPrompt]);

  // Notes autosave
  useEffect(() => {
    if (!sessionId || !eventId || !myRoleKey || notes === lastSavedNotesRef.current) return;
    const timeout = setTimeout(() => {
      setNotesSaving(true);
      gamesApi.updateMyStrategicNotes(sessionId, notes, eventId)
        .then(res => { lastSavedNotesRef.current = res.content || ''; setNotesSavedAt(res.updatedAt || new Date().toISOString()); })
        .catch(() => {})
        .finally(() => setNotesSaving(false));
    }, 800);
    return () => clearTimeout(timeout);
  }, [notes, sessionId, eventId, myRoleKey]);

  // Host polls
  useEffect(() => {
    if (!isHost || !sessionId || !rolesAssigned) return;
    let cancelled = false;
    const tick = async () => {
      try {
        const [rv, rd] = await Promise.all([
          gamesApi.getStrategicRoleRevealStatus(sessionId, eventId),
          gamesApi.getStrategicRoleReadyStatus(sessionId, eventId),
        ]);
        if (!cancelled) { setRevealStatus(rv); setReadyStatus(rd); }
      } catch {}
    };
    tick();
    const interval = setInterval(tick, 2000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [isHost, sessionId, eventId, rolesAssigned]);

  const handleAssignRoles = useCallback(async () => {
    if (!isHost || !sessionId || rolesAssigned) return;
    setAssignError(null);
    setIsAssigningRoles(true);
    try {
      await gamesApi.assignStrategicRoles(sessionId);
      await onEmitSocketAction('strategic:assign_roles');
    } catch (err: unknown) {
      if (ApiError.is(err)) setAssignError(t(`apiErrors.${err.code}`, { defaultValue: err.message }));
      else if (err instanceof Error) setAssignError(err.message);
      else setAssignError(t('strategic.errors.assignFailed', { defaultValue: 'Failed to assign roles.' }));
    } finally {
      setIsAssigningRoles(false);
    }
  }, [isHost, sessionId, rolesAssigned, onEmitSocketAction, t]);

  const handleStartDiscussion = useCallback(async () => {
    if (!isHost || !sessionId || !rolesAssigned) return;
    await onEmitSocketAction('strategic:start_discussion').catch(() => {});
  }, [isHost, sessionId, rolesAssigned, onEmitSocketAction]);

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1.4fr)]">
      <div className="space-y-3">
        <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-foreground">{t('strategic.rolesSection.title', { defaultValue: 'Your secret role' })}</p>
              <p className="text-xs text-muted-foreground">{t('strategic.rolesSection.subtitle', { defaultValue: 'This role is private to you.' })}</p>
            </div>
            {swapWindowSeconds !== null && swapWindowSeconds > 0 && (
              <div className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-[10px] text-muted-foreground">
                <Shuffle className="h-3 w-3" />
                {t('strategic.rolesMeta.swapWindow', { defaultValue: 'Swap: {{seconds}}s', seconds: swapWindowSeconds })}
              </div>
            )}
          </div>

          {/* Animated flip card */}
          <StrategicRoleRevealCard
            myRoleKey={myRoleKey}
            myRoleName={myRoleName}
            myRoleBrief={myRoleBrief}
            myRoleSecret={myRoleSecret}
            currentUserName={currentUserName}
            currentUserAvatar={currentUserAvatar}
            currentUserAvatarUrl={currentUserAvatarUrl}
            t={t}
          />

          {roleLoading && (
            <p className="text-[11px] text-muted-foreground">{t('strategic.rolesMeta.refreshing', { defaultValue: 'Refreshing…' })}</p>
          )}

          {myRoleKey && (
            <div className="mt-3 space-y-3">
              {/* Prompt */}
              <div className="rounded-xl border border-border bg-muted/20 p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {t('strategic.afterReveal.promptsTitle', { defaultValue: 'Your focus prompt' })}
                  </p>
                  {typeof promptNextIn === 'number' && (
                    <span className="text-[10px] text-muted-foreground tabular-nums">
                      {t('strategic.afterReveal.nextPromptIn', { defaultValue: 'Next in {{seconds}}s', seconds: promptNextIn })}
                    </span>
                  )}
                </div>
                <p className="text-[12px] text-foreground whitespace-pre-wrap">
                  {currentPrompt || t('strategic.afterReveal.noPrompts', { defaultValue: 'No prompts yet.' })}
                </p>
                <GameActionButton size="sm" variant="outline" className="text-[11px]"
                  disabled={!sessionId || isAdvancingPrompt || !currentPrompt}
                  onClick={() => {
                    if (!sessionId) return;
                    setIsAdvancingPrompt(true);
                    gamesApi.advanceMyStrategicRolePrompt(sessionId, eventId)
                      .then(ps => setPromptState(ps))
                      .catch(() => {})
                      .finally(() => setIsAdvancingPrompt(false));
                  }}>
                  {isAdvancingPrompt ? t('strategic.afterReveal.advancingPrompt', { defaultValue: 'Updating…' }) : t('strategic.afterReveal.nextPrompt', { defaultValue: 'Next prompt' })}
                </GameActionButton>
              </div>

              {/* Ready */}
              <div className="rounded-xl border border-border bg-card p-3 space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {t('strategic.afterReveal.readyTitle', { defaultValue: 'Ready check' })}
                </p>
                <GameActionButton size="md" className="text-[12px]" disabled={!sessionId || myReady}
                  onClick={() => {
                    if (!sessionId) return;
                    gamesApi.readyMyStrategicRole(sessionId, eventId)
                      .then(() => setMyReady(true))
                      .catch(err => {
                        if (ApiError.is(err)) toast.error(t(`apiErrors.${err.code}`, { defaultValue: err.message }));
                        else toast.error(t('apiErrors.UNKNOWN'));
                      });
                  }}>
                  {myReady ? t('strategic.afterReveal.readyConfirmed', { defaultValue: '✓ Ready' }) : t('strategic.afterReveal.readyAction', { defaultValue: "I'm ready" })}
                </GameActionButton>
              </div>

              {/* Notes */}
              <div className="rounded-xl border border-border bg-card p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {t('strategic.afterReveal.notesTitle', { defaultValue: 'Private notes' })}
                  </p>
                  <span className="text-[10px] text-muted-foreground">
                    {notesSaving ? t('strategic.afterReveal.notesSaving', { defaultValue: 'Saving…' })
                      : notesSavedAt ? t('strategic.afterReveal.notesSaved', { defaultValue: 'Saved' })
                        : t('strategic.afterReveal.notesNotSaved', { defaultValue: 'Not saved yet' })}
                  </span>
                </div>
                <textarea value={notes} onChange={e => setNotes(e.target.value)}
                  placeholder={t('strategic.afterReveal.notesPlaceholder', { defaultValue: 'Write notes only you can see…' })}
                  className="min-h-[92px] w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-[12px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right column — swap info + host controls */}
      <div className="space-y-4">
        <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Shuffle className="h-4 w-4 text-info" />
            <p className="text-sm font-semibold text-foreground">{t('strategic.rolesMeta.swapTitle', { defaultValue: 'Quick swap & alignment' })}</p>
          </div>
          <p className="text-xs text-muted-foreground">{t('strategic.rolesMeta.swapBody', { defaultValue: 'Agree in chat to mentally trade perspectives before the challenge starts.' })}</p>
          {swapWindowSeconds !== null && swapWindowSeconds > 0 ? (
            <div className="rounded-xl bg-info/5 border border-info/30 px-3 py-2.5 text-[11px] text-info">
              {t('strategic.rolesMeta.swapCountdown', { defaultValue: 'Swap window closes in {{seconds}}s', seconds: swapWindowSeconds })}
            </div>
          ) : (
            <div className="rounded-xl bg-muted/40 border border-border px-3 py-2.5 text-[11px] text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="h-3 w-3" />
              <span>{t('strategic.rolesMeta.swapClosed', { defaultValue: 'Swap window closed.' })}</span>
            </div>
          )}

          {isHost && (
            <div className="space-y-2 pt-1">
              <GameActionButton variant="outline" size="md" className="w-full text-[12px]"
                disabled={!sessionId || rolesAssigned || isAssigningRoles}
                style={rolesAssigned && revealStatus?.allAcknowledged ? { display: 'none' } : undefined}
                onClick={handleAssignRoles}>
                {isAssigningRoles ? t('strategic.actions.assigningRoles', { defaultValue: 'Assigning…' }) : t('strategic.actions.assignRoles', { defaultValue: 'Assign roles' })}
              </GameActionButton>
              {assignError && <p className="text-[10px] text-destructive">{assignError}</p>}
              {rolesAssigned && readyStatus && !readyStatus.allReady && (
                <div className="rounded-xl border border-border bg-muted/30 px-3 py-2 text-[11px] text-muted-foreground flex justify-between">
                  <span>{t('strategic.afterReveal.readyProgress', { defaultValue: '{{ready}}/{{total}} ready', ready: readyStatus.ready, total: readyStatus.total })}</span>
                  <span className="font-medium tabular-nums text-foreground">{readyStatus.ready}/{readyStatus.total}</span>
                </div>
              )}
              <GameActionButton size="md" className="w-full text-[12px]"
                disabled={!sessionId || !rolesAssigned || !(readyStatus?.allReady ?? false)}
                onClick={handleStartDiscussion}>
                {t('strategic.actions.startDiscussion', { defaultValue: 'Start async discussion' })}
              </GameActionButton>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
