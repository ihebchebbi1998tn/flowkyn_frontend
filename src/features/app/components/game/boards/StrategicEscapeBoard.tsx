import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles, Settings2 } from 'lucide-react';
import { PhaseBadge, type GamePhase } from '../shared';
import { GameActionButton } from '../shared';
import { HowItWorksModal } from '../shared/HowItWorksModal';
import { useGameSnapshot } from '@/hooks/useGameSnapshot';
import {
  type StrategicEscapeBoardProps,
  type StrategicEscapeSnapshot,
  type StrategicPhase,
  isStrategicEscapeSnapshot,
} from './strategicEscape.types';
import {
  StrategicPhaseStepper,
  StrategicSetupPhase,
  StrategicRolesPhase,
  StrategicDiscussionPhase,
  StrategicDebriefPhase,
} from './strategic-escape';

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
  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState(false);

  const snapshot = useGameSnapshot<StrategicEscapeSnapshot>(gameData, initialSnapshot, isStrategicEscapeSnapshot);
  const phase: StrategicPhase = (snapshot?.phase || 'setup') as StrategicPhase;
  const isHost = participants.some(p => p.id === currentUserId && p.isHost);

  const hostParticipant = useMemo(() => participants.find(p => p.isHost) || null, [participants]);

  return (
    <div className="space-y-4 lg:space-y-5">
      <HowItWorksModal
        open={isHowItWorksOpen}
        onOpenChange={setIsHowItWorksOpen}
        baseKey="gameHowItWorks.strategicEscape"
      />

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <PhaseBadge phase={phase as GamePhase} />
            {hostParticipant && (
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-[10px] font-medium text-muted-foreground">
                {t('strategic.meta.hostLabel', { defaultValue: 'Facilitator: {{name}}', name: hostParticipant.name })}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isHost && phase === 'setup' && (
            <GameActionButton variant="outline" size="sm" className="text-[11px] gap-1"
              onClick={() => {}}>
              <Settings2 className="h-3.5 w-3.5" />
              {t('strategic.modal.openLabel', { defaultValue: 'Configure scenario' })}
            </GameActionButton>
          )}
          <GameActionButton variant="ghost" size="sm" className="text-[11px]"
            onClick={() => setIsHowItWorksOpen(true)}>
            {t('gameHowItWorks.common.title', { defaultValue: 'How this works' })}
          </GameActionButton>
        </div>
      </div>

      {/* Phase stepper */}
      <StrategicPhaseStepper currentPhase={phase} t={t} />

      {/* Phase intro */}
      <div className="rounded-2xl border border-border bg-card px-4 py-3">
        <p className="text-[12px] font-medium text-foreground">
          {phase === 'setup'
            ? t('strategic.phaseIntro.setup', { defaultValue: 'The facilitator is configuring the scenario.' })
            : phase === 'roles_assignment'
              ? t('strategic.phaseIntro.rolesAssignment', { defaultValue: 'Secret roles are being assigned — check your inbox.' })
              : phase === 'discussion'
                ? t('strategic.phaseIntro.discussion', { defaultValue: 'Share perspectives and decisions over time.' })
                : t('strategic.phaseIntro.debrief', { defaultValue: 'Turn insights into concrete changes.' })}
        </p>
      </div>

      {/* Phase content */}
      {phase === 'setup' && (
        <StrategicSetupPhase
          isHost={isHost}
          eventId={eventId}
          sessionId={sessionId}
          snapshot={snapshot}
          onSessionCreated={onSessionCreated}
          onEmitSocketAction={onEmitSocketAction}
        />
      )}

      {phase === 'roles_assignment' && (
        <StrategicRolesPhase
          isHost={isHost}
          eventId={eventId}
          sessionId={sessionId}
          snapshot={snapshot}
          currentUserId={currentUserId}
          currentUserName={currentUserName}
          currentUserAvatar={currentUserAvatar}
          currentUserAvatarUrl={currentUserAvatarUrl}
          onEmitSocketAction={onEmitSocketAction}
        />
      )}

      {phase === 'discussion' && (
        <StrategicDiscussionPhase
          isHost={isHost}
          sessionId={sessionId}
          snapshot={snapshot}
          onEmitSocketAction={onEmitSocketAction}
        />
      )}

      {phase === 'debrief' && (
        <StrategicDebriefPhase
          isHost={isHost}
          eventId={eventId}
          sessionId={sessionId}
        />
      )}
    </div>
  );
}
