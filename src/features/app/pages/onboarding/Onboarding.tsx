import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { ArrowRight, ArrowLeft, AlertCircle, X, HeartPulse } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/constants/routes';
import { organizationsApi } from '@/features/app/api/organizations';
import { usersApi } from '@/features/app/api/users';
import { authApi } from '@/features/app/api/auth';
import { trackEvent, TRACK } from '@/hooks/useTracker';
import logoImg from '@/assets/logo.png';

import type { OnboardingData } from './types';
import { OrgInfoStep, IndustryStep, GoalsStep, BrandingStep, TeamPulseStep, TeamInviteStep } from './steps';
import { CelebrationScreen } from './CelebrationScreen';

const STEP_I18N_KEYS = ['org', 'industry', 'goals', 'branding', 'pulse', 'teamInvite'];
const TOTAL_STEPS = STEP_I18N_KEYS.length;

export default function Onboarding() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inviteResults, setInviteResults] = useState<{
    success: string[];
    failed: Array<{ email: string; reason: string }>;
  } | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [onboardingError, setOnboardingError] = useState('');
  const navigationTimeoutRef = useRef<NodeJS.Timeout>();

  const [data, setData] = useState<OnboardingData>({
    orgName: '',
    orgDescription: '',
    industry: '',
    companySize: '',
    goals: [],
    language: i18n.language?.substring(0, 2) || 'en',
    logoFile: null,
    logoPreview: null,
    teamInvites: [],
    teamConnectedness: 5,
    relationshipQuality: 5,
    teamFamiliarity: 5,
    expectations: '',
  });

  const updateData = (partial: Partial<OnboardingData>) => {
    if (partial.language && partial.language !== data.language) {
      i18n.changeLanguage(partial.language);
    }
    setData(prev => ({ ...prev, ...partial }));
  };

  const toggleGoal = (key: string) => {
    setData(prev => ({
      ...prev,
      goals: prev.goals.includes(key)
        ? prev.goals.filter(g => g !== key)
        : [...prev.goals, key],
    }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) updateData({ logoFile: file, logoPreview: URL.createObjectURL(file) });
  };

  const canProceed = () => {
    switch (step) {
      case 0: return data.orgName.trim().length >= 2;
      case 1: return data.industry && data.companySize;
      case 2: return data.goals.length > 0;
      default: return true;
    }
  };

  const goNext = () => { if (step < TOTAL_STEPS - 1) { setDirection(1); setStep(s => s + 1); trackEvent(TRACK.ONBOARDING_STEP, { step: step + 1 }); } };
  const goBack = () => { if (step > 0) { setDirection(-1); setStep(s => s - 1); } };

  const handleComplete = async () => {
    setIsSubmitting(true);
    setOnboardingError('');
    try {
      i18n.changeLanguage(data.language);
      localStorage.setItem('i18nextLng', data.language);

      const org = await organizationsApi.create({
        name: data.orgName,
        description: data.orgDescription || undefined,
        industry: data.industry || undefined,
        company_size: data.companySize || undefined,
        goals: data.goals.length > 0 ? data.goals : undefined,
      });

      if (!org?.id) throw new Error(t('onboarding.errors.createOrgFailed', { defaultValue: 'Failed to create organization' }));

      localStorage.setItem('flowkyn_org_id', org.id);
      if (user) setUser({ ...user, organization_id: org.id });

      if (data.logoFile) {
        try { await organizationsApi.uploadLogo(org.id, data.logoFile); } catch (err) { console.error('[Onboarding] logo upload failed', err); throw err; }
      }

      await organizationsApi.getById(org.id);

      if (data.teamInvites.length > 0) {
        try {
          const result = await usersApi.sendOnboardingInvites(org.id, data.teamInvites, data.language);
          setInviteResults(result);
          try {
            const attemptedEmails = data.teamInvites.map(i => i.email?.trim().toLowerCase()).filter(Boolean);
            localStorage.setItem(`onboarding_team_invites_${org.id}`, JSON.stringify(attemptedEmails));
          } catch { /* best-effort */ }
        } catch (err) { console.warn('Team invites not sent:', err); }
      }

      try {
        await organizationsApi.savePulseSurvey(org.id, {
          team_connectedness: data.teamConnectedness,
          relationship_quality: data.relationshipQuality,
          team_familiarity: data.teamFamiliarity,
          expectations: data.expectations || undefined,
        });
      } catch (err) { console.warn('Pulse survey not saved:', err); }

      await usersApi.updateProfile({ language: data.language });

      const updatedUser = await authApi.completeOnboarding();
      if (updatedUser) setUser(updatedUser);
      trackEvent(TRACK.ONBOARDING_COMPLETED, { orgName: data.orgName, industry: data.industry, teamInvitesCount: data.teamInvites.length });

      setShowCelebration(true);
      navigationTimeoutRef.current = setTimeout(() => {
        navigate(ROUTES.DASHBOARD);
      }, 2800);
    } catch (error: any) {
      console.error('Onboarding completion failed:', error);
      setOnboardingError(error?.response?.data?.message || error?.message || t('onboarding.errors.setupFailed', { defaultValue: 'Setup failed. Please try again.' }));
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    return () => { if (navigationTimeoutRef.current) clearTimeout(navigationTimeoutRef.current); };
  }, []);

  if (showCelebration) return <CelebrationScreen data={data} />;

  const progress = ((step + 1) / TOTAL_STEPS) * 100;
  const stepKey = STEP_I18N_KEYS[step];

  const slideVariants = {
    enter: (d: number) => ({ x: d > 0 ? 60 : -60, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? -60 : 60, opacity: 0 }),
  };

  const renderStep = () => {
    switch (step) {
      case 0: return <OrgInfoStep data={data} onChange={updateData} />;
      case 1: return <IndustryStep data={data} onChange={updateData} />;
      case 2: return <GoalsStep data={data} onToggleGoal={toggleGoal} />;
      case 3: return <BrandingStep data={data} onChange={updateData} onLogoUpload={handleLogoUpload} />;
      case 4: return <TeamPulseStep data={data} onChange={updateData} />;
      case 5: return <TeamInviteStep data={data} onChange={updateData} inviteResults={inviteResults} />;
      default: return null;
    }
  };

  const STEP_LABELS = STEP_I18N_KEYS.map((k) => t(`onboarding.steps.${k}.title`));

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border/40 bg-background/90 backdrop-blur-lg sticky top-0 z-40">
        <div className="flex items-center justify-between px-6 h-14 max-w-2xl mx-auto w-full">
          <div className="flex items-center gap-2">
            <img src={logoImg} alt="Flowkyn" className="h-8 w-8 object-contain" />
            <span className="text-sm font-semibold text-foreground">Flowkyn</span>
          </div>
          {/* Step dots */}
          <div className="flex items-center gap-1.5">
            {STEP_I18N_KEYS.map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-2 rounded-full transition-all duration-300",
                  i === step ? 'w-6 bg-primary' : i < step ? 'w-2 bg-primary/40' : 'w-2 bg-muted-foreground/20'
                )}
              />
            ))}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-start sm:items-center justify-center px-4 py-10 sm:py-0">
        <div className="w-full max-w-lg">
          {/* Error */}
          {onboardingError && (
            <div className="mb-5 flex items-center gap-3 p-3 rounded-lg border border-destructive/30 bg-destructive/5 text-sm">
              <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
              <p className="flex-1 text-destructive text-[13px]">{onboardingError}</p>
              <button onClick={() => setOnboardingError('')} className="text-muted-foreground hover:text-foreground">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Animated step */}
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* Step label */}
              <p className="text-xs font-medium text-primary mb-2 tracking-wide uppercase">
                {t('onboarding.stepOf', { current: step + 1, total: TOTAL_STEPS })}
              </p>
              <div className="mb-5">
                <h1 className="text-xl sm:text-2xl font-semibold text-foreground tracking-tight">
                  {t(`onboarding.steps.${stepKey}.title`)}
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  {t(`onboarding.steps.${stepKey}.description`)}
                </p>
              </div>

              <div className="rounded-xl border border-border bg-card p-5 sm:p-6 shadow-sm">
                {renderStep()}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6">
            <Button variant="ghost" size="sm" onClick={goBack} disabled={step === 0} className="gap-1.5">
              <ArrowLeft className="h-3.5 w-3.5" /> {t('onboarding.back')}
            </Button>

            {step < TOTAL_STEPS - 1 ? (
              <Button onClick={goNext} disabled={!canProceed()} className="gap-1.5 min-w-[130px] h-9">
                {t('onboarding.continue')} <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            ) : (
              <Button onClick={handleComplete} disabled={isSubmitting} className="gap-1.5 min-w-[150px] h-9">
                {isSubmitting ? (
                  <>
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                    {t('onboarding.settingUp')}
                  </>
                ) : t('onboarding.launch')}
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
