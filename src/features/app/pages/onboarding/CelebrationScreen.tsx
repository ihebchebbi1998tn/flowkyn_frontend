import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import logoImg from '@/assets/logo.png';
import type { OnboardingData } from './types';

interface CelebrationScreenProps {
  data: OnboardingData;
}

export function CelebrationScreen({ data }: CelebrationScreenProps) {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center">
      <div className="flex flex-col items-center text-center px-6 max-w-md">
        <motion.img src={logoImg} alt="Flowkyn" className="h-10 w-10 object-contain mb-8"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }} />

        <motion.div className="mb-6"
          initial={{ scale: 0 }} animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.15 }}>
          <div className="h-14 w-14 rounded-full border-2 border-primary flex items-center justify-center">
            <Check className="h-6 w-6 text-primary" strokeWidth={2.5} />
          </div>
        </motion.div>

        <motion.h1 className="text-xl font-semibold text-foreground"
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          {t('onboarding.celebrationTitle', { defaultValue: 'Welcome to Flowkyn' })}
        </motion.h1>

        {data.orgName && (
          <motion.p className="text-sm text-muted-foreground mt-1.5"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
            {t('onboarding.celebrationSubtitle', '{{org}} is ready.', { org: data.orgName })}
          </motion.p>
        )}

        <motion.div className="w-36 mt-8"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
          <div className="h-0.5 w-full rounded-full bg-muted overflow-hidden">
            <motion.div className="h-full bg-primary rounded-full"
              initial={{ width: '0%' }} animate={{ width: '100%' }}
              transition={{ duration: 2.2, delay: 0.2, ease: 'linear' }} />
          </div>
          <p className="text-[11px] text-muted-foreground/50 mt-2">
            {t('onboarding.redirecting', 'Preparing your dashboard…')}
          </p>
        </motion.div>
      </div>
    </div>
  );
}
