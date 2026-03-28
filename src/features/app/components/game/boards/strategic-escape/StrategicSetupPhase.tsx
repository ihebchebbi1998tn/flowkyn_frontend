import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Settings2, AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { GameActionButton } from '../../shared';
import { cn } from '@/lib/utils';
import { gamesApi } from '@/features/app/api/games';
import { toast } from 'sonner';
import { ApiError } from '@/lib/apiError';
import { INDUSTRY_OPTIONS, CRISIS_OPTIONS, DIFFICULTY_OPTIONS } from '../strategicEscape.constants';
import type { StrategicEscapeSnapshot } from '../strategicEscape.types';
import type { GameParticipant } from '../../shell';

interface Props {
  isHost: boolean;
  eventId: string;
  sessionId: string | null;
  snapshot: StrategicEscapeSnapshot | null;
  onSessionCreated: (sessionId: string) => void;
  onEmitSocketAction: (actionType: string, payload?: unknown, opts?: { sessionId?: string }) => Promise<void>;
}

export function StrategicSetupPhase({ isHost, eventId, sessionId, snapshot, onSessionCreated, onEmitSocketAction }: Props) {
  const { t } = useTranslation();
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

  const selectedDifficulty = ((snapshot?.difficultyKey || snapshot?.difficulty || 'medium') as 'easy' | 'medium' | 'hard');

  const [localIndustry, setLocalIndustry] = useState<string | null>(null);
  const [localCrisis, setLocalCrisis] = useState<string | null>(null);
  const [localDifficulty, setLocalDifficulty] = useState<'easy' | 'medium' | 'hard'>(selectedDifficulty);

  useEffect(() => {
    if (selectedDifficulty) setLocalDifficulty(selectedDifficulty as 'easy' | 'medium' | 'hard');
  }, [selectedDifficulty]);

  const isConfigured = !!localIndustry && !!localCrisis && !!localDifficulty;

  const difficultyLabelKey =
    localDifficulty === 'easy' ? 'strategic.difficulties.easy'
      : localDifficulty === 'hard' ? 'strategic.difficulties.hard'
        : 'strategic.difficulties.medium';

  const handleCreateSession = useCallback(async () => {
    if (!isHost || !eventId || sessionId || !isConfigured) return;
    setCreateError(null);
    setIsCreating(true);
    try {
      const industryLabel = t(`strategic.industries.${localIndustry}.label`);
      const crisisLabel = t(`strategic.crises.${localCrisis}.label`);
      const difficultyLabel = t(`${difficultyLabelKey}.label`);

      const res = await gamesApi.createStrategicSession(eventId, {
        industryKey: localIndustry!, crisisKey: localCrisis!, difficulty: localDifficulty,
        industry: industryLabel, crisisType: crisisLabel, difficultyLabel,
      });
      onSessionCreated(res.sessionId);
      onEmitSocketAction('strategic:configure', {
        industryKey: localIndustry!, crisisKey: localCrisis!, difficultyKey: localDifficulty,
        industryLabel, crisisLabel, difficultyLabel,
      }, { sessionId: res.sessionId }).catch(() => {});
      toast.success(t('games.toasts.launching', {
        defaultValue: 'Launching {{gameName}}…',
        gameName: t('activities.strategicEscape.name', { defaultValue: 'Strategic Escape Challenge' }),
      }));
    } catch (err: unknown) {
      if (ApiError.is(err)) setCreateError(t(`apiErrors.${err.code}`, { defaultValue: err.message }));
      else if (err instanceof Error) setCreateError(err.message);
      else setCreateError(t('strategic.errors.createFailed', { defaultValue: 'Failed to create session.' }));
    } finally {
      setIsCreating(false);
    }
  }, [isHost, eventId, sessionId, isConfigured, localIndustry, localCrisis, localDifficulty, onSessionCreated, onEmitSocketAction, t, difficultyLabelKey]);

  return (
    <>
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
              {t('strategic.modal.subtitle', { defaultValue: 'Choose the industry, crisis, and difficulty for this simulation.' })}
            </p>

            {/* Industry */}
            <div className="space-y-2">
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                {t('strategic.configure.industryLabel', { defaultValue: "What's your industry?" })}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {INDUSTRY_OPTIONS.map(opt => (
                  <button key={opt.value} type="button" onClick={() => isHost && setLocalIndustry(opt.value)}
                    className={cn(
                      'group flex flex-col items-start gap-1 rounded-xl border px-3 py-2.5 text-left text-[11px] transition-all bg-gradient-to-br from-background via-background to-muted/60',
                      localIndustry === opt.value ? 'border-primary/70 shadow-[0_0_0_1px_rgba(59,130,246,0.4)]' : 'border-border/60 hover:border-primary/40 hover:bg-muted/40',
                      !isHost && 'cursor-default opacity-80',
                    )}>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{opt.icon}</span>
                      <span className="font-semibold text-foreground">{t(`strategic.industries.${opt.value}.label`)}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground line-clamp-2">{t(`strategic.industries.${opt.value}.description`)}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Crisis */}
            <div className="space-y-2">
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                {t('strategic.configure.crisisLabel', { defaultValue: 'Choose your crisis type' })}
              </p>
              <div className="grid gap-2.5">
                {CRISIS_OPTIONS.map(opt => (
                  <button key={opt.value} type="button" onClick={() => isHost && setLocalCrisis(opt.value)}
                    className={cn(
                      'group flex flex-col items-start gap-1 rounded-xl border px-3 py-2.5 text-left text-[11px] transition-all',
                      localCrisis === opt.value ? 'border-primary/70 bg-primary/5 shadow-[0_0_0_1px_rgba(59,130,246,0.4)]' : 'border-border/60 hover:border-primary/40 hover:bg-muted/40',
                      !isHost && 'cursor-default opacity-80',
                    )}>
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-3.5 w-3.5 text-warning" />
                      <span className="font-semibold text-foreground">{t(`strategic.crises.${opt.value}.label`)}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground line-clamp-2">{t(`strategic.crises.${opt.value}.description`)}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty */}
            <div className="space-y-2">
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                {t('strategic.configure.difficultyLabel', { defaultValue: 'Difficulty level' })}
              </p>
              <div className="flex flex-wrap gap-2">
                {DIFFICULTY_OPTIONS.map(opt => {
                  const lk = opt.value === 'easy' ? 'strategic.difficulties.easy' : opt.value === 'hard' ? 'strategic.difficulties.hard' : 'strategic.difficulties.medium';
                  return (
                    <button key={opt.value} type="button" onClick={() => isHost && setLocalDifficulty(opt.value)}
                      className={cn(
                        'flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] transition-all',
                        localDifficulty === opt.value ? 'border-primary bg-primary/10 text-primary' : 'border-border/60 bg-muted/40 text-muted-foreground hover:border-primary/40',
                        !isHost && 'cursor-default opacity-80',
                      )}>
                      <span>{opt.icon}</span>
                      <span className="font-medium">{t(`${lk}.label`)}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col gap-2 border-t border-border pt-3">
              <GameActionButton size="lg" className="w-full text-[13px]"
                disabled={!isHost || !isConfigured || isCreating}
                onClick={async () => { await handleCreateSession(); setIsConfigModalOpen(false); }}>
                {isCreating ? t('strategic.actions.creating', { defaultValue: 'Creating…' })
                  : sessionId ? t('strategic.actions.sessionCreated', { defaultValue: 'Session already created' })
                    : t('strategic.actions.createSession', { defaultValue: 'Create strategic session' })}
              </GameActionButton>
              {createError && <p className="text-[10px] text-destructive">{createError}</p>}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)]">
        <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 space-y-3">
          <p className="text-sm font-semibold text-foreground">
            {t('strategic.preview.title', { defaultValue: 'What your team will experience' })}
          </p>
          <p className="text-xs text-muted-foreground">
            {t('strategic.preview.body', {
              defaultValue: 'Each participant receives a private email with their secret role. When they join, they see an animated role card they can reveal.',
            })}
          </p>
          <div className="rounded-xl border border-dashed border-primary/30 bg-primary/5 px-3 py-2.5 text-[11px] text-primary">
            {t('strategic.preview.hint', { defaultValue: 'This activity is async: people can join from any time zone.' })}
          </div>
          {isHost ? (
            <p className="text-[11px] text-muted-foreground">
              {t('strategic.preview.configureHint', { defaultValue: 'Use Configure to choose industry, crisis, and difficulty.' })}
            </p>
          ) : (
            <p className="text-[11px] text-muted-foreground">
              {t('strategic.preview.hostOnly', { defaultValue: 'Your facilitator is customizing the scenario.' })}
            </p>
          )}
        </div>

        {isHost && (
          <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {t('strategic.preview.summaryTitle', { defaultValue: 'Current configuration' })}
            </p>
            <div className="space-y-2 text-[11px] text-muted-foreground">
              {[
                { label: t('strategic.preview.summaryIndustry', { defaultValue: 'Industry' }), val: localIndustry ? t(`strategic.industries.${localIndustry}.label`) : null },
                { label: t('strategic.preview.summaryCrisis', { defaultValue: 'Crisis type' }), val: localCrisis ? t(`strategic.crises.${localCrisis}.label`) : null },
                { label: t('strategic.preview.summaryDifficulty', { defaultValue: 'Difficulty' }), val: localDifficulty ? t(`${difficultyLabelKey}.label`) : null },
              ].map(r => (
                <div key={r.label} className="flex items-center justify-between">
                  <span>{r.label}</span>
                  <span className="font-medium">{r.val || t('strategic.preview.summaryUnset', { defaultValue: 'Not set' })}</span>
                </div>
              ))}
            </div>
            <GameActionButton size="md" className="w-full text-[12px] mt-2" variant="outline"
              onClick={() => setIsConfigModalOpen(true)}>
              <Settings2 className="h-4 w-4 mr-1.5" />
              {t('strategic.modal.openLabel', { defaultValue: 'Configure scenario' })}
            </GameActionButton>
          </div>
        )}
      </div>
    </>
  );
}
