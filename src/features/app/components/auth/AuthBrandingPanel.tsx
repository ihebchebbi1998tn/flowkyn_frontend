import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Globe, BarChart3, Sparkles } from 'lucide-react';
import logoImg from '@/assets/logo.png';

interface AuthBrandingPanelProps {
  mode: 'login' | 'register' | 'forgot' | 'reset';
}

const featureIcons = {
  activities: Users,
  liveAsync: Globe,
  analytics: BarChart3,
};

export function AuthBrandingPanel({ mode }: AuthBrandingPanelProps) {
  const { t } = useTranslation();

  const features = [
    { icon: Users, text: t('auth.branding.features.activities') },
    { icon: Globe, text: t('auth.branding.features.liveAsync') },
    { icon: BarChart3, text: t('auth.branding.features.analytics') },
  ];

  // Helper to get branding data
  const getBranding = (m: string) => ({
    badge: t(`auth.branding.${m}.tagline`, { defaultValue: t('auth.branding.tagline') }),
    title: t(`auth.branding.${m}.title`),
    subtitle: t(`auth.branding.${m}.description`),
  });

  const c = getBranding(mode);

  return (
    <div
      className="hidden lg:flex lg:w-[45%] relative flex-col justify-between p-10 overflow-hidden"
      style={{ background: 'hsl(var(--auth-panel))' }}
    >
      {/* Dot grid */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, hsl(var(--auth-panel-foreground)) 1px, transparent 0)',
          backgroundSize: '24px 24px',
        }}
      />
      {/* Gradient orbs */}
      <div
        className="absolute -top-24 -left-24 w-80 h-80 rounded-full opacity-[0.08]"
        style={{ background: 'radial-gradient(circle, hsl(var(--primary-glow)), transparent 70%)' }}
      />
      <div
        className="absolute bottom-20 right-10 w-60 h-60 rounded-full opacity-[0.05]"
        style={{ background: 'radial-gradient(circle, hsl(var(--accent)), transparent 70%)' }}
      />

      <div className="relative z-10 flex flex-col justify-between h-full">
        {/* Logo */}
        <div className="flex items-center">
          <img src={logoImg} alt={t('brand.name', { defaultValue: 'Flowkyn' })} className="h-14 w-14 object-contain brightness-0 invert" />
        </div>

        {/* Animated content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 16 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-7"
          >
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span
                  className="text-[11px] font-semibold uppercase tracking-widest"
                  style={{ color: 'hsl(var(--auth-panel-foreground) / 0.4)' }}
                >
                  {c.badge}
                </span>
              </div>
              <h2
                className="text-[32px] font-extrabold leading-[1.15] tracking-[-0.02em]"
                style={{ color: 'hsl(var(--auth-panel-foreground))' }}
              >
                {c.title}
              </h2>
            </div>
            <p
              className="text-[15px] max-w-[360px] leading-[1.8]"
              style={{ color: 'hsl(var(--auth-panel-foreground) / 0.5)' }}
            >
              {c.subtitle}
            </p>
            <div className="space-y-3.5 pt-1">
              {features.map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-3">
                  <div
                    className="h-8 w-8 rounded-lg flex items-center justify-center"
                    style={{ background: 'hsl(0 0% 100% / 0.1)' }}
                  >
                    <Icon className="h-4 w-4" style={{ color: 'hsl(var(--auth-panel-foreground) / 0.8)' }} />
                  </div>
                  <span
                    className="text-[13px] font-medium"
                    style={{ color: 'hsl(var(--auth-panel-foreground) / 0.55)' }}
                  >
                    {text}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="flex items-center justify-between">
          <p className="text-[12px]" style={{ color: 'hsl(var(--auth-panel-foreground) / 0.2)' }}>
            {t('auth.branding.copyright')}
          </p>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map(i => (
              <div
                key={i}
                className="h-1 w-1 rounded-full"
                style={{ background: `hsl(var(--auth-panel-foreground) / ${0.05 + i * 0.03})` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
