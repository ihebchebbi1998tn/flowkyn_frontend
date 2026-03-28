import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Globe, BarChart3, Sparkles } from 'lucide-react';
import logoImg from '@/assets/logo.png';
import authBg from '@/assets/auth-bg.jpg';

interface AuthBrandingPanelProps {
  mode: 'login' | 'register' | 'forgot' | 'reset';
}

export function AuthBrandingPanel({ mode }: AuthBrandingPanelProps) {
  const { t } = useTranslation();

  const features = [
    { icon: Users, text: t('auth.branding.features.activities') },
    { icon: Globe, text: t('auth.branding.features.liveAsync') },
    { icon: BarChart3, text: t('auth.branding.features.analytics') },
  ];

  const getBranding = (m: string) => ({
    badge: t(`auth.branding.${m}.tagline`, { defaultValue: t('auth.branding.tagline') }),
    title: t(`auth.branding.${m}.title`),
    subtitle: t(`auth.branding.${m}.description`),
  });

  const c = getBranding(mode);

  return (
    <div className="hidden lg:flex lg:w-[48%] relative flex-col overflow-hidden">
      {/* ── Full background image ── */}
      <img
        src={authBg}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />

      {/* ── Lighter overlay — more transparent ── */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/65 via-black/60 to-black/75" />

      {/* ── Subtle purple tint ── */}
      <div
        className="absolute inset-0 opacity-10"
        style={{ background: 'linear-gradient(135deg, hsl(265 60% 30%), hsl(280 50% 20%))' }}
      />

      {/* ── Content ── */}
      <div className="relative z-10 flex flex-col justify-between h-full p-10">
        {/* Logo */}
        <div>
          <img src={logoImg} alt="Flowkyn" className="h-24 w-24 object-contain brightness-0 invert" />
        </div>

        {/* Main content */}
        <div className="space-y-7">
          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-5"
            >
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="h-3.5 w-3.5 text-white/40" />
                  <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-white/40">
                    {c.badge}
                  </span>
                </div>
                <h2 className="text-[32px] font-extrabold leading-[1.1] tracking-[-0.03em] text-white">
                  {c.title}
                </h2>
              </div>
              <p className="text-[15px] max-w-[380px] leading-[1.7] text-white/50">
                {c.subtitle}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Feature list */}
          <div className="space-y-3">
            {features.map(({ icon: Icon, text }, i) => (
              <motion.div
                key={text}
                className="flex items-center gap-3"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.1 + i * 0.08 }}
              >
                <div className="h-9 w-9 rounded-xl flex items-center justify-center backdrop-blur-md bg-white/[0.08] border border-white/[0.06]">
                  <Icon className="h-4 w-4 text-white/70" />
                </div>
                <span className="text-[13px] font-medium text-white/55">
                  {text}
                </span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p className="text-[11px] text-white/20">
          {t('auth.branding.copyright')}
        </p>
      </div>
    </div>
  );
}