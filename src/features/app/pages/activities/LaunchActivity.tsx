import { useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import {
  Users, MessageSquare, Coffee, Trophy, Lightbulb, Crosshair, Flame, Mail, Send, Settings2, Target,
} from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import { eventsApi } from '@/features/app/api/events';
import { gamesApi } from '@/features/app/api/games';
import { useOrgDepartments } from '@/hooks/queries';
import type { Department } from '@/types';
import { ACTIVITIES as CATALOG_ACTIVITIES } from '@/features/app/data/activities';
import {
  LaunchComingSoon,
  LaunchHeader,
  LaunchStepIndicator,
  LaunchErrorBanner,
  ConfigureStepSection,
  InviteStepSection,
  ReviewStepSection,
} from './components/LaunchActivitySections';

const ACTIVITIES: Record<string, { name: string; icon: typeof MessageSquare; color: string; bgColor: string; type: 'sync' | 'async'; duration: string }> = {
  '1': { name: 'Two Truths & a Lie', icon: MessageSquare, color: 'text-primary', bgColor: 'bg-primary/10', type: 'sync', duration: '15' },
  '2': { name: 'Coffee Roulette', icon: Coffee, color: 'text-info', bgColor: 'bg-info/10', type: 'sync', duration: '30' },
  '3': { name: 'Wins of the Week', icon: Trophy, color: 'text-warning', bgColor: 'bg-warning/10', type: 'async', duration: '0' },
  '4': { name: 'Strategic Escape Challenge', icon: Target, color: 'text-destructive', bgColor: 'bg-destructive/10', type: 'async', duration: '45' },
  '5': { name: 'Team Scavenger Hunt', icon: Crosshair, color: 'text-destructive', bgColor: 'bg-destructive/10', type: 'sync', duration: '45' },
  '6': { name: 'Gratitude Circle', icon: Flame, color: 'text-destructive', bgColor: 'bg-destructive/10', type: 'async', duration: '0' },
  '7': { name: 'Decision Jam', icon: Users, color: 'text-primary', bgColor: 'bg-primary/10', type: 'sync', duration: '40' },
  '8': { name: 'Culture Snapshot', icon: Lightbulb, color: 'text-warning', bgColor: 'bg-warning/10', type: 'async', duration: '0' },
};

// Mapping from activity ID to backend game_types.key
const ACTIVITY_GAME_KEYS: Record<string, string> = {
  '1': 'two-truths',
  '2': 'coffee-roulette',
  '3': 'wins-of-week',
  '4': 'strategic-escape',
  '5': 'scavenger-hunt',
  '6': 'gratitude',
};

type Step = 'configure' | 'invite' | 'review';

export default function LaunchActivity() {
  const { t, i18n } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const activity = ACTIVITIES[id || '1'];
  const catalogActivity = useMemo(() => CATALOG_ACTIVITIES.find(a => a.id === (id || '1')), [id]);
  const isComingSoon = !!catalogActivity?.comingSoon;
  const activityName = catalogActivity?.i18nKey
    ? t(`${catalogActivity.i18nKey}.name`, { defaultValue: activity?.name })
    : (activity?.name || '');

  const [step, setStep] = useState<Step>('configure');
  const [eventTitle, setEventTitle] = useState(
    activity
      ? t('activities.launch.defaultEventTitle', {
        defaultValue: '{{activityName}} — Team Event',
        activityName,
      })
      : ''
  );
  const [description, setDescription] = useState('');
  const [maxParticipants, setMaxParticipants] = useState('20');
  const [duration, setDuration] = useState(activity?.duration || '15');
  const [visibility, setVisibility] = useState('workspace');
  const [scheduleType, setScheduleType] = useState<'now' | 'later'>('now');
  const [scheduledDate, setScheduledDate] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [totalRounds, setTotalRounds] = useState('4');
  const [emailInput, setEmailInput] = useState('');
  const [emails, setEmails] = useState<string[]>([]);
  const [enableDepartmentInvites, setEnableDepartmentInvites] = useState(true);
  const [enableUserInvites, setEnableUserInvites] = useState(false);
  const [selectedDepartmentIds, setSelectedDepartmentIds] = useState<string[]>([]);
  const [allowNickname, setAllowNickname] = useState(true);
  const [launching, setLaunching] = useState(false);
  const [error, setError] = useState('');
  const [invitationProgress, setInvitationProgress] = useState({ sent: 0, total: 0 });

  const { user } = useAuth();

  const orgId = user?.organization_id || '';
  const { data: departments, isLoading: departmentsLoading } = useOrgDepartments(orgId);
  
  // Prepopulate invite emails from onboarding (per-organization cache)
  useEffect(() => {
    if (!user?.organization_id) return;
    if (!enableUserInvites) return;
    try {
      const raw = localStorage.getItem(`onboarding_team_invites_${user.organization_id}`);
      if (!raw) return;
      const cached: string[] = JSON.parse(raw);
      if (Array.isArray(cached) && cached.length > 0 && emails.length === 0) {
        setEmails(cached);
      }
    } catch {
      // Best-effort only; ignore parse errors
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.organization_id, enableUserInvites]);

  // When department invites are enabled (default), select all departments by default.
  useEffect(() => {
    if (!enableDepartmentInvites) return;
    if (departmentsLoading) return;
    if (!departments || departments.length === 0) return;
    setSelectedDepartmentIds((prev) => (prev.length > 0 ? prev : (departments as Department[]).map((d) => d.id)));
  }, [departments, departmentsLoading, enableDepartmentInvites]);

  if (!activity) { navigate(ROUTES.GAMES); return null; }
  if (isComingSoon) {
    return (
      <LaunchComingSoon activityName={activityName} t={t} onBack={() => navigate(ROUTES.GAMES)} />
    );
  }

  const Icon = activity.icon;

  const addEmail = () => {
    const trimmed = emailInput.trim().toLowerCase();
    if (trimmed && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed) && !emails.includes(trimmed)) {
      const next = [...emails, trimmed];
      setEmails(next);
      setEmailInput('');
    }
  };

  const addBulk = (text: string) => {
    const parsed = text.split(/[,;\n\s]+/).filter(e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim().toLowerCase()));
    const unique = [...new Set([...emails, ...parsed.map(e => e.trim().toLowerCase())])];
    setEmails(unique);
    setEmailInput('');
  };

  const removeEmail = (email: string) => {
    setEmails(emails.filter(e => e !== email));
  };

  const handleLaunch = async () => {
    setError('');
    setLaunching(true);
    
    try {
      // Get organization ID from auth context
      if (!orgId) {
        throw new Error(
          t('activities.launch.errors.missingOrgId', {
            defaultValue: 'Organization ID not found. Please complete onboarding first.',
          })
        );
      }

      // Determine visibility value for backend
      const backendVisibility = visibility === 'workspace' ? 'public' : 'private';

      const startTimeIso =
        scheduleType === 'now'
          ? new Date().toISOString()
          : scheduledDate
            ? new Date(scheduledDate).toISOString()
            : undefined;

      const endTimeIso = endsAt ? new Date(endsAt).toISOString() : undefined;

      if (endTimeIso && startTimeIso) {
        const startMs = new Date(startTimeIso).getTime();
        const endMs = new Date(endTimeIso).getTime();
        if (Number.isFinite(startMs) && Number.isFinite(endMs) && endMs <= startMs) {
          throw new Error(
            t('activities.launch.errors.endsAtAfterStart', {
              defaultValue: 'End date/time must be after the start date/time.',
            })
          );
        }
      }

      // Create event
      const eventData = {
        organization_id: orgId,
        title: eventTitle || t('activities.launch.untitledEvent', { defaultValue: 'Untitled Event' }),
        description,
        event_mode: activity.type, // 'sync' or 'async'
        visibility: backendVisibility,
        max_participants: parseInt(maxParticipants, 10),
        start_time: startTimeIso,
        end_time: endTimeIso,
        allow_guests: allowNickname,
        ...(enableDepartmentInvites && selectedDepartmentIds.length > 0
          ? { invite_department_ids: selectedDepartmentIds }
          : {}),
        ...(enableUserInvites && emails.length > 0 ? { invites: emails } : {}),
        ...(id === '1' ? { max_rounds: parseInt(totalRounds, 10) } : {}),
      };

      const createdEvent = await eventsApi.create(eventData);

      // For "start now" flows, immediately activate the event and start a game session
      // for both sync and async activities so that GamePlay can resolve a live session.
      if (scheduleType === 'now') {
        try {
          // Ensure event is marked active so the backend allows starting sessions
          await eventsApi.update(createdEvent.id, { status: 'active' } as any);
        } catch (statusErr) {
          console.warn('[LaunchActivity] Failed to set event status to active:', (statusErr as any)?.message);
        }

        // If this activity is backed by a game type, create a game session now.
        try {
          const gameKey = ACTIVITY_GAME_KEYS[id || '1'];
          if (gameKey) {
            const types = await gamesApi.listTypes();
            const matchingType = types.find(t => t.key === gameKey);
            if (matchingType) {
              await gamesApi.startSession(createdEvent.id, matchingType.id, parseInt(totalRounds, 10));
            }
          }
        } catch (gameErr) {
          // Game session creation failures should not block event creation or navigation.
          console.warn('[LaunchActivity] Failed to create game session:', (gameErr as any)?.message);
        }
      }

      // Navigate to lobby first so creator joins, then they can enter play (fixes 404/403/500/409)
      navigate(ROUTES.EVENT_LOBBY(createdEvent.id) + (id ? `?game=${id}` : ''));
    } catch (err: any) {
      console.error('Launch failed:', err);
      const errorMessage =
        err?.response?.data?.message ||
        err?.message ||
        t('activities.launch.errors.generic', { defaultValue: 'Failed to launch activity. Please try again.' });
      setError(errorMessage);
      setLaunching(false);
    }
  };

  const steps: { key: Step; label: string; icon: typeof Settings2 }[] = [
    { key: 'configure', label: t('activities.launch.steps.configure', { defaultValue: 'Configure' }), icon: Settings2 },
    { key: 'invite', label: t('activities.launch.steps.invite', { defaultValue: 'Invite Team' }), icon: Mail },
    { key: 'review', label: t('activities.launch.steps.review', { defaultValue: 'Review & Launch' }), icon: Send },
  ];

  const currentStepIndex = steps.findIndex(s => s.key === step);

  return (
    <div className="space-y-3 sm:space-y-4 w-full">
      <LaunchHeader activity={activity} activityName={activityName} t={t} onBack={() => navigate(`/activities/${id}`)} />

      <LaunchStepIndicator steps={steps} step={step} currentStepIndex={currentStepIndex} onChange={setStep} />

      <LaunchErrorBanner error={error} onClose={() => setError('')} />

      {/* Step Content */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="h-1 w-full bg-gradient-to-r from-primary/60 to-primary" />

        {step === 'configure' && (
          <ConfigureStepSection
            t={t}
            id={id}
            activity={activity}
            eventTitle={eventTitle}
            setEventTitle={setEventTitle}
            description={description}
            setDescription={setDescription}
            maxParticipants={maxParticipants}
            setMaxParticipants={setMaxParticipants}
            duration={duration}
            setDuration={setDuration}
            totalRounds={totalRounds}
            setTotalRounds={setTotalRounds}
            visibility={visibility}
            setVisibility={setVisibility}
            scheduleType={scheduleType}
            setScheduleType={setScheduleType}
            scheduledDate={scheduledDate}
            setScheduledDate={setScheduledDate}
            endsAt={endsAt}
            setEndsAt={setEndsAt}
            onNextInvite={() => setStep('invite')}
          />
        )}

        {step === 'invite' && (
          <InviteStepSection
            t={t}
            enableDepartmentInvites={enableDepartmentInvites}
            setEnableDepartmentInvites={setEnableDepartmentInvites}
            enableUserInvites={enableUserInvites}
            setEnableUserInvites={setEnableUserInvites}
            departments={departments as Department[] | undefined}
            departmentsLoading={departmentsLoading}
            selectedDepartmentIds={selectedDepartmentIds}
            setSelectedDepartmentIds={setSelectedDepartmentIds}
            emailInput={emailInput}
            setEmailInput={setEmailInput}
            addEmail={addEmail}
            addBulk={addBulk}
            emails={emails}
            setEmails={setEmails}
            removeEmail={removeEmail}
            allowNickname={allowNickname}
            setAllowNickname={setAllowNickname}
            onBack={() => setStep('configure')}
            onNextReview={() => setStep('review')}
          />
        )}

        {step === 'review' && (
          <ReviewStepSection
            t={t}
            id={id}
            activity={activity}
            eventTitle={eventTitle}
            maxParticipants={maxParticipants}
            scheduleType={scheduleType}
            scheduledDate={scheduledDate}
            endsAt={endsAt}
            enableDepartmentInvites={enableDepartmentInvites}
            selectedDepartmentIds={selectedDepartmentIds}
            enableUserInvites={enableUserInvites}
            emails={emails}
            allowNickname={allowNickname}
            launching={launching}
            invitationProgress={invitationProgress}
            onBack={() => setStep('invite')}
            onLaunch={handleLaunch}
          />
        )}
      </div>
    </div>
  );
}
