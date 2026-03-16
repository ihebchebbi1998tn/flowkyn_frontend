/**
 * @fileoverview Celebration screen shown after onboarding completion.
 *
 * Displays a clean checkmark animation, the org name, selected preferences,
 * and a progress bar that fills as the user is redirected to the dashboard.
 */

import { motion } from 'framer-motion';
import { Check, Users, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import logoImg from '@/assets/logo.png';
import type { OnboardingData } from './types';

/** Industry icon mapping — duplicated here to avoid circular imports */
const INDUSTRY_ICONS: Record<string, React.ElementType> = {
  technology: () => <span>⚡</span>, healthcare: () => <span>❤️</span>,
  education: () => <span>🎓</span>, finance: () => <span>📊</span>,
  consulting: () => <span>💼</span>, startup: () => <span>🚀</span>,
  nonprofit: () => <span>🛡️</span>, other: () => <span>🏢</span>,
};

const LANGUAGES = [
  { key: 'en', label: 'English' },
  { key: 'fr', label: 'Français' },
  { key: 'de', label: 'Deutsch' },
];

interface CelebrationScreenProps {
  data: OnboardingData;
}

export function CelebrationScreen({ data }: CelebrationScreenProps) {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center relative overflow-hidden">
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 40%, hsl(var(--primary) / 0.06) 0%, transparent 100%)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      />

      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-lg">
        <motion.img src={logoImg} alt="Flowkyn" className="h-12 w-12 object-contain mb-10"
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} />

        <motion.div className="mb-8"
          initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 180, damping: 18, delay: 0.2 }}>
          <div className="h-16 w-16 rounded-full border-2 border-primary flex items-center justify-center">
            <motion.div initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} transition={{ duration: 0.4, delay: 0.5 }}>
              <Check className="h-7 w-7 text-primary" strokeWidth={2.5} />
            </motion.div>
          </div>
        </motion.div>

        <motion.h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight"
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.6 }}>
          {t('onboarding.celebrationTitle', 'Welcome to Flowkyn')}
        </motion.h1>

        {data.orgName && (
          <motion.p className="text-base text-muted-foreground mt-2"
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.8 }}>
            {t('onboarding.celebrationSubtitle', '{{org}} is ready to go.', { org: data.orgName })}
          </motion.p>
        )}

        <motion.div className="flex flex-wrap items-center justify-center gap-2 mt-6"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, delay: 1.0 }}>
          {data.industry && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted text-xs font-medium text-muted-foreground">
              {t(`onboarding.industries.${data.industry}`)}
            </span>
          )}
          {data.companySize && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted text-xs font-medium text-muted-foreground">
              <Users className="h-3 w-3" />
              {t(`onboarding.sizes.${data.companySize}.label`)}
            </span>
          )}
          {data.language && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted text-xs font-medium text-muted-foreground">
              <Globe className="h-3 w-3" />
              {LANGUAGES.find(l => l.key === data.language)?.label}
            </span>
          )}
        </motion.div>

        <motion.div className="w-full max-w-[200px] mt-10"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2, duration: 0.3 }}>
          <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
            <motion.div className="h-full bg-primary rounded-full"
              initial={{ width: '0%' }} animate={{ width: '100%' }}
              transition={{ duration: 2.4, delay: 0.2, ease: 'linear' }} />
          </div>
          <p className="text-[11px] text-muted-foreground/50 mt-3">
            {t('onboarding.redirecting', 'Preparing your dashboard…')}
          </p>
        </motion.div>
      </div>
    </div>
  );
}
