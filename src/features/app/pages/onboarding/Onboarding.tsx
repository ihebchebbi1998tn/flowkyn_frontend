/**
 * @fileoverview Onboarding Wizard — 5-step organization setup flow.
 *
 * Flow: Organization Info → Industry & Size → Goals → Language & Logo → Team Invites
 *
 * After completion, calls the backend to:
 * 1. Create the organization with all collected data
 * 2. Upload the logo (if provided)
 * 3. Send team invitations (if provided)
 * 4. Update the user's language preference
 * 5. Mark onboarding as completed
 *
 * Each step is a separate component in ./steps/ for maintainability.
 * The celebration screen is also extracted to CelebrationScreen.tsx.
 */

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import {
  Building2, Briefcase, Target, Globe, Users, ArrowRight, ArrowLeft,
  Check, Sparkles, AlertCircle, X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants/routes';
import { cn } from '@/lib/utils';
import { organizationsApi } from '@/features/app/api/organizations';
import { usersApi } from '@/features/app/api/users';
import { authApi } from '@/features/app/api/auth';
import { trackEvent, TRACK } from '@/hooks/useTracker';
import logoImg from '@/assets/logo.png';

import type { OnboardingData } from './types';
import { OrgInfoStep, IndustryStep, GoalsStep, BrandingStep, TeamInviteStep } from './steps';
import { CelebrationScreen } from './CelebrationScreen';

// ─── Constants ────────────────────────────────────────────────────────────────

const STEP_ICONS = [Building2, Briefcase, Target, Globe, Users];
const STEP_I18N_KEYS = ['org', 'industry', 'goals', 'branding', 'teamInvite'];

// ─── Component ────────────────────────────────────────────────────────────────

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
  const [onboardingError, setOnboardingError] = useState<string>('');
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
  });

  // ── Handlers ──────────────────────────────────────────────────────────────

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
    if (file) {
      updateData({ logoFile: file, logoPreview: URL.createObjectURL(file) });
    }
  };

  const canProceed = () => {
    switch (step) {
      case 0: return data.orgName.trim().length >= 2;
      case 1: return data.industry && data.companySize;
      case 2: return data.goals.length > 0;
      case 3: return true;
      case 4: return true; // Team invites are optional
      default: return false;
    }
  };

  const goNext = () => { if (step < STEP_ICONS.length - 1) { setDirection(1); setStep(s => s + 1); trackEvent(TRACK.ONBOARDING_STEP, { step: step + 1 }); } };
  const goBack = () => { if (step > 0) { setDirection(-1); setStep(s => s - 1); } };

  /** Submit all onboarding data to the backend */
  const handleComplete = async () => {
    setIsSubmitting(true);
    setOnboardingError('');
    try {
      i18n.changeLanguage(data.language);
      localStorage.setItem('i18nextLng', data.language);

      // 1. Create the organization
      const org = await organizationsApi.create({
        name: data.orgName,
        description: data.orgDescription || undefined,
        industry: data.industry || undefined,
        company_size: data.companySize || undefined,
        goals: data.goals.length > 0 ? data.goals : undefined,
      });

      if (!org?.id) throw new Error(t('onboarding.errors.createOrgFailed', { defaultValue: 'Failed to create organization' }));

      // Cache org ID for EventForm auto-population (do this IMMEDIATELY)
      localStorage.setItem('flowkyn_org_id', org.id);
      console.log('[Onboarding] Cached org ID in localStorage:', org.id);

      // Also update user state so components using useAuth() see it immediately
      if (user) {
        const updatedUser = { ...user, organization_id: org.id };
        setUser(updatedUser);
        console.log('[Onboarding] Updated user state with org ID:', org.id);
      }

      // 2. Upload logo (if provided)
      if (data.logoFile) {
        try {
          console.log('[Onboarding] uploading logo', { orgId: org.id, fileName: data.logoFile.name, fileSize: data.logoFile.size });
          await organizationsApi.uploadLogo(org.id, data.logoFile);
          console.log('[Onboarding] logo uploaded successfully');
        } catch (err) {
          console.error('[Onboarding] logo upload failed', err);
          throw err; // Re-throw to stop the flow
        }
      }

      // 2b. Fetch latest org data to ensure logo_url is up-to-date
      const latestOrg = await organizationsApi.getById(org.id);
      // Optionally update local state if needed (not strictly required for redirect)

      // 3. Send team invitations (if provided)
      if (data.teamInvites.length > 0) {
        try {
          const result = await usersApi.sendOnboardingInvites(org.id, data.teamInvites, data.language);
          setInviteResults(result);

          // Persist the attempted invite emails per-organization so we can
          // surface them as defaults when creating the first events.
          try {
            const attemptedEmails = data.teamInvites
              .map((i) => i.email?.trim().toLowerCase())
              .filter(Boolean);
            localStorage.setItem(
              `onboarding_team_invites_${org.id}`,
              JSON.stringify(attemptedEmails)
            );
          } catch {
            // Best-effort only; ignore storage errors
          }
        } catch (err) {
          console.warn('Team invites not sent:', err);
          // Don't fail the whole onboarding due to invites
        }
      }

      // 4. Update user language
      await usersApi.updateProfile({ language: data.language });

      // 5. Mark onboarding complete
      const updatedUser = await authApi.completeOnboarding();
      if (updatedUser) setUser(updatedUser);
      trackEvent(TRACK.ONBOARDING_COMPLETED, { 
        orgName: data.orgName, 
        industry: data.industry,
        teamInvitesCount: data.teamInvites.length
      });

      // Show celebration and navigate on SUCCESS only
      setShowCelebration(true);
      
      // Add a small delay to ensure auth context is updated before navigation
      navigationTimeoutRef.current = setTimeout(() => {
        // Before navigating, verify org ID is set
        const orgId = user?.organization_id || localStorage.getItem('flowkyn_org_id');
        console.log('[Onboarding] Navigating to dashboard with org ID:', orgId);
        
        if (!orgId) {
          console.error('[Onboarding] WARNING: Organization ID not found before navigation');
        }
        
        navigate(ROUTES.DASHBOARD);
      }, 2800);
    } catch (error: any) {
      console.error('Onboarding completion failed:', error);
      const errorMessage =
        error?.response?.data?.message
        || error?.message
        || t('onboarding.errors.setupFailed', { defaultValue: 'Setup failed. Please try again.' });
      setOnboardingError(errorMessage);
      // Do NOT navigate on failure
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cleanup timeout on unmount to prevent navigation after component unmounts
  useEffect(() => {
    return () => {
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
      }
    };
  }, []);

  // ── Celebration ───────────────────────────────────────────────────────────

  if (showCelebration) return <CelebrationScreen data={data} />;

  // ── Wizard ────────────────────────────────────────────────────────────────

  const progress = ((step + 1) / STEP_ICONS.length) * 100;
  const stepKey = STEP_I18N_KEYS[step];
  const StepIcon = STEP_ICONS[step];

  const slideVariants = {
    enter: (d: number) => ({ x: d > 0 ? 80 : -80, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? -80 : 80, opacity: 0 }),
  };

  /** Render the current step's content */
  const renderStep = () => {
    switch (step) {
      case 0: return <OrgInfoStep data={data} onChange={updateData} />;
      case 1: return <IndustryStep data={data} onChange={updateData} />;
      case 2: return <GoalsStep data={data} onToggleGoal={toggleGoal} />;
      case 3: return <BrandingStep data={data} onChange={updateData} onLogoUpload={handleLogoUpload} />;
      case 4: return <TeamInviteStep data={data} onChange={updateData} inviteResults={inviteResults} />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-xl sticky top-0 z-40">
          <div className="flex items-center justify-between px-6 h-14 max-w-3xl mx-auto w-full">
          <div className="flex items-center">
            <img src={logoImg} alt={t('brand.name', { defaultValue: 'Flowkyn' })} className="h-10 w-10 object-contain" />
          </div>
          <span className="text-label-xs text-muted-foreground font-medium">
            {t('onboarding.stepOf', { current: step + 1, total: STEP_ICONS.length })}
          </span>
        </div>
        <div className="h-[3px] bg-muted">
          <motion.div
            className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-r-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-2xl">
          {/* Error Banner */}
          {onboardingError && (
            <div className="mb-6 flex items-start gap-3 p-4 rounded-lg border border-destructive/30 bg-destructive/5">
              <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-[13px] font-medium text-destructive">{onboardingError}</p>
                <p className="text-[11px] text-destructive/60 mt-1">
                  {t('onboarding.errors.checkInfoAndRetry', { defaultValue: 'Please check your information and try again.' })}
                </p>
              </div>
              <button onClick={() => setOnboardingError('')} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
          {/* Step indicators */}
          <div className="flex items-center justify-center gap-3 mb-8">
            {STEP_ICONS.map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-label-xs font-bold transition-all duration-300",
                  i < step ? 'bg-success text-success-foreground' :
                  i === step ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25' :
                  'bg-muted text-muted-foreground'
                )}>
                  {i < step ? <Check className="h-4 w-4" /> : i + 1}
                </div>
                {i < STEP_ICONS.length - 1 && (
                  <div className={cn(
                    "hidden sm:block w-12 h-[2px] rounded-full transition-colors duration-300",
                    i < step ? 'bg-success' : 'bg-muted'
                  )} />
                )}
              </div>
            ))}
          </div>

          {/* Animated step content */}
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="text-center mb-8">
                <h1 className="text-page-title sm:text-3xl font-bold text-foreground tracking-tight">
                  {t(`onboarding.steps.${stepKey}.title`)}
                </h1>
                <p className="text-body-sm text-muted-foreground mt-2">{t(`onboarding.steps.${stepKey}.description`)}</p>
              </div>

              <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm">
                {renderStep()}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6">
            <Button variant="ghost" onClick={goBack} disabled={step === 0} className="gap-1.5">
              <ArrowLeft className="h-4 w-4" /> {t('onboarding.back')}
            </Button>

            {step < STEP_ICONS.length - 1 ? (
              <Button onClick={goNext} disabled={!canProceed()} className="gap-1.5 min-w-[140px]">
                {t('onboarding.continue')} <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleComplete} disabled={isSubmitting} className="gap-1.5 min-w-[180px]">
                {isSubmitting ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                    {t('onboarding.settingUp')}
                  </>
                ) : (
                  <>
                    {t('onboarding.launch')}
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
