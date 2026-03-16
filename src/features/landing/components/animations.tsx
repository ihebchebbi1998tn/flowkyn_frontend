/**
 * @fileoverview Shared animation wrapper components for the landing page.
 * 
 * Provides reusable scroll-triggered animation primitives:
 * - FadeUp: Fades in + slides up on scroll
 * - FadeIn: Simple opacity fade on scroll
 * - ScaleIn: Scales up + fades in on scroll
 * - SlideIn: Slides in from left/right on scroll
 * - AnimatedCounter: Counts up to a target number on scroll
 */

import { useRef, useState, useEffect } from 'react';
import { motion, useInView, useMotionValue, useTransform, animate } from 'framer-motion';

/** Common easing curve used across all landing page animations */
const EASE_OUT_EXPO = [0.22, 1, 0.36, 1] as [number, number, number, number];

interface AnimationProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

/** Fade in + slide up on scroll into view */
export function FadeUp({ children, className, delay = 0 }: AnimationProps) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 28 }} animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 28 }}
      transition={{ duration: 0.6, delay, ease: EASE_OUT_EXPO }} className={className}>{children}</motion.div>
  );
}

/** Simple opacity fade on scroll into view */
export function FadeIn({ children, className, delay = 0 }: AnimationProps) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  return (
    <motion.div ref={ref} initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : { opacity: 0 }}
      transition={{ duration: 0.6, delay, ease: 'easeOut' }} className={className}>{children}</motion.div>
  );
}

/** Scale up + fade in on scroll into view */
export function ScaleIn({ children, className, delay = 0 }: AnimationProps) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, scale: 0.92 }} animate={inView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.92 }}
      transition={{ duration: 0.5, delay, ease: EASE_OUT_EXPO }} className={className}>{children}</motion.div>
  );
}

interface SlideInProps extends AnimationProps {
  from?: 'left' | 'right';
}

/** Slide in from left or right on scroll into view */
export function SlideIn({ children, className, delay = 0, from = 'left' }: SlideInProps) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const x = from === 'left' ? -40 : 40;
  return (
    <motion.div ref={ref} initial={{ opacity: 0, x }} animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x }}
      transition={{ duration: 0.6, delay, ease: EASE_OUT_EXPO }} className={className}>{children}</motion.div>
  );
}

/** Animated number counter that counts up when scrolled into view */
export function AnimatedCounter({ value, suffix = '' }: { value: number; suffix?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => Math.round(v));
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (inView) {
      const controls = animate(count, value, { duration: 2, ease: EASE_OUT_EXPO });
      const unsub = rounded.on('change', (v) => setDisplay(v));
      return () => { controls.stop(); unsub(); };
    }
  }, [inView, value, count, rounded]);

  return <span ref={ref}>{display}{suffix}</span>;
}

/** Heading font family used across the landing page */
export const HEADING_FONT = "'Space Grotesk', 'Inter', system-ui, sans-serif";
