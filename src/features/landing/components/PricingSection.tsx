import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { Check, ArrowRight } from 'lucide-react';
import { motion, useInView } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/constants/routes';

const HEADING_FONT = "'Space Grotesk', 'Inter', system-ui, sans-serif";

const PLANS = [
  {
    name: 'Starter',
    price: '0',
    period: 'forever',
    description: 'For small teams exploring team-building basics.',
    features: [
      'Up to 10 members',
      '5 events / month',
      '3 activity types',
      'Basic engagement reports',
      'Community support',
    ],
    cta: 'Get started',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '29',
    period: 'mo',
    description: 'Unlock the full toolkit for engaged, connected teams.',
    features: [
      'Up to 50 members',
      'Unlimited events',
      'All activity types',
      'Advanced analytics & exports',
      'Custom branding',
      'Priority support',
      'Leaderboards & seasons',
    ],
    cta: 'Start free trial',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: 'Tailored for large orgs with advanced requirements.',
    features: [
      'Unlimited members',
      'SSO & SAML',
      'Custom activity builder',
      'API access & webhooks',
      'Dedicated success manager',
      'SLA & uptime guarantee',
      'Custom integrations',
      'On-premise option',
    ],
    cta: 'Talk to us',
    highlighted: false,
  },
];

function FadeUp({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 24 }} animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }} className={className}>{children}</motion.div>
  );
}

export function PricingSection() {
  return (
    <section id="pricing" className="border-t border-border/30 relative overflow-hidden">
      <div className="mx-auto max-w-[1100px] px-4 sm:px-6 lg:px-8 py-20 sm:py-28 md:py-36 relative">
        {/* Header */}
        <FadeUp className="text-center mb-14 sm:mb-18">
          <span className="text-[11px] sm:text-[12px] uppercase tracking-[0.14em] font-semibold text-primary mb-3 block">
            Pricing
          </span>
          <h2
            className="text-[28px] sm:text-[38px] md:text-[46px] font-extrabold tracking-[-0.035em] leading-[1.08] mb-4"
            style={{ fontFamily: HEADING_FONT }}
          >
            Plans that grow{' '}
            <span className="brand-gradient-text">with you</span>
          </h2>
          <p className="text-[15px] sm:text-[16px] text-muted-foreground leading-[1.7] max-w-[440px] mx-auto">
            Start free. Upgrade when you're ready. No surprises.
          </p>
        </FadeUp>

        {/* Plans */}
        <div className="grid gap-5 md:grid-cols-3 items-start">
          {PLANS.map((plan, i) => (
            <FadeUp key={plan.name} delay={i * 0.08}>
              <div
                className={cn(
                  "relative rounded-2xl border flex flex-col transition-all duration-300",
                  plan.highlighted
                    ? "border-primary/25 bg-card shadow-2xl shadow-primary/8 ring-1 ring-primary/10 scale-[1.02] md:-mt-3 md:mb-3"
                    : "border-border/40 bg-card hover:border-border hover:shadow-lg hover:shadow-black/[0.03]"
                )}
              >
                {/* Popular pill */}
                {plan.highlighted && (
                  <div className="absolute -top-3.5 left-6">
                    <span className="inline-block text-[10px] font-bold tracking-wide uppercase bg-primary text-primary-foreground px-3 py-1 rounded-full">
                      Recommended
                    </span>
                  </div>
                )}

                <div className="p-6 sm:p-8">
                  {/* Plan name */}
                  <p
                    className="text-[13px] font-bold uppercase tracking-[0.08em] text-muted-foreground mb-5"
                    style={{ fontFamily: HEADING_FONT }}
                  >
                    {plan.name}
                  </p>

                  {/* Price */}
                  <div className="flex items-baseline gap-1.5 mb-2">
                    {plan.price !== 'Custom' ? (
                      <>
                        <span className="text-[11px] text-muted-foreground font-medium self-start mt-1.5">$</span>
                        <span
                          className="text-[44px] font-extrabold text-foreground tracking-[-0.04em] leading-none"
                          style={{ fontFamily: HEADING_FONT }}
                        >
                          {plan.price}
                        </span>
                        {plan.period && (
                          <span className="text-[13px] text-muted-foreground font-medium">
                            /{plan.period}
                          </span>
                        )}
                      </>
                    ) : (
                      <span
                        className="text-[36px] font-extrabold text-foreground tracking-[-0.03em] leading-none"
                        style={{ fontFamily: HEADING_FONT }}
                      >
                        Custom
                      </span>
                    )}
                  </div>

                  <p className="text-[13px] text-muted-foreground leading-relaxed mb-7">
                    {plan.description}
                  </p>

                  {/* Divider */}
                  <div className="h-px bg-border/60 mb-6" />

                  {/* Features */}
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2.5">
                        <Check
                          className={cn(
                            "h-4 w-4 shrink-0 mt-0.5",
                            plan.highlighted ? "text-primary" : "text-muted-foreground/60"
                          )}
                          strokeWidth={2.5}
                        />
                        <span className="text-[13px] text-foreground/80 leading-snug">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <Link to={plan.price === 'Custom' ? ROUTES.CONTACT : ROUTES.REGISTER} className="block">
                    <Button
                      className={cn(
                        "w-full h-11 text-[13px] font-semibold rounded-xl gap-2 transition-all",
                        plan.highlighted
                          ? "bg-primary text-primary-foreground hover:bg-primary/90"
                          : "bg-secondary text-foreground hover:bg-secondary/80"
                      )}
                    >
                      {plan.cta}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              </div>
            </FadeUp>
          ))}
        </div>

        {/* Bottom note */}
        <FadeUp delay={0.35}>
          <p className="text-center text-[12px] text-muted-foreground/40 mt-12 font-medium">
            All paid plans include a 14-day free trial · No credit card required · Cancel anytime
          </p>
        </FadeUp>
      </div>
    </section>
  );
}
