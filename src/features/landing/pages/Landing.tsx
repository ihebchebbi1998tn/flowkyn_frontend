/**
 * @fileoverview Landing page — composed from modular section components.
 * 
 * Each section is a self-contained component with its own animations,
 * state, and i18n, keeping this orchestrator file lightweight.
 * 
 * Sections (in order):
 * 1. SplashScreen — One-time animated intro
 * 2. LandingNavbar — Sticky nav with language switcher
 * 3. HeroSection — Headline, CTAs, mock dashboard
 * 4. ProblemSection — Pain points + business impact
 * 5. FeaturesSection — Alternating feature cards
 * 6. HowItWorksSection — Three-step process
 * 7. StatsSection — Animated stat counters
 * 8. TestimonialsSection — Customer quotes
 * 9. FAQSection — Accordion Q&A
 * 10. PricingSection — Pricing tiers
 * 11. CTASection — Final call-to-action
 * 12. ContactSection — Contact form
 * 13. LandingFooter — Links, legal, theme toggle
 */

import { useState, useCallback } from 'react';
import SplashScreen from '@/features/landing/components/SplashScreen';
import { LandingNavbar } from '@/features/landing/components/LandingNavbar';
import { HeroSection } from '@/features/landing/components/HeroSection';
import { ProblemSection } from '@/features/landing/components/ProblemSection';
import { FeaturesSection } from '@/features/landing/components/FeaturesSection';
import { HowItWorksSection } from '@/features/landing/components/HowItWorksSection';
import { FAQSection } from '@/features/landing/components/FAQSection';
import { PricingSection } from '@/features/landing/components/PricingSection';
import { CTASection } from '@/features/landing/components/CTASection';
import { ContactSection } from '@/features/landing/components/ContactSection';
import { LandingFooter } from '@/features/landing/components/LandingFooter';

export default function Landing() {
  const [showSplash, setShowSplash] = useState(true);

  const handleSplashFinish = useCallback(() => {
    setShowSplash(false);
    sessionStorage.setItem('flowkyn_splash_shown', '1');
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {showSplash && <SplashScreen onFinish={handleSplashFinish} />}
      <LandingNavbar />
      <HeroSection />
      <ProblemSection />
      <FeaturesSection />
      <HowItWorksSection />
      <FAQSection />
      <PricingSection />
      <CTASection />
      <ContactSection />
      <LandingFooter />
    </div>
  );
}
