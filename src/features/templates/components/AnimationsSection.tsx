import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Zap, ArrowRight, Check, Heart, Star, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Section, ShowcaseRow, ShowcaseGrid, CodeBlock } from './Primitives';

const staggerChildren = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};
const staggerItem = {
  hidden: { opacity: 0, y: 16, filter: 'blur(4px)' },
  show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
};

export function AnimationsSection() {
  const [showCards, setShowCards] = useState(true);
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(0);

  return (
    <Section id="animations" title="Animations & Motion" description="Framer Motion patterns for page transitions, stagger effects, micro-interactions.">

      {/* Stagger list */}
      <ShowcaseRow label="Staggered List (click to replay)">
        <div className="w-full">
          <Button variant="outline" size="sm" className="mb-4" onClick={() => { setShowCards(false); setTimeout(() => setShowCards(true), 50); }}>
            <Sparkles className="h-3.5 w-3.5 mr-1.5" /> Replay Animation
          </Button>
          <AnimatePresence mode="wait">
            {showCards && (
              <motion.div className="grid grid-cols-2 sm:grid-cols-4 gap-3" variants={staggerChildren} initial="hidden" animate="show" exit="hidden">
                {['Dashboard', 'Analytics', 'Events', 'Activities'].map((label, i) => (
                  <motion.div key={label} variants={staggerItem}
                    className="rounded-xl border border-border bg-card p-4 text-center hover:border-primary/30 hover:shadow-card-hover transition-all cursor-default">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-2">
                      <Zap className="h-4 w-4 text-primary" />
                    </div>
                    <p className="text-body-sm font-medium text-foreground">{label}</p>
                    <p className="text-label text-muted-foreground mt-0.5">Section {i + 1}</p>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </ShowcaseRow>

      {/* Micro-interactions */}
      <ShowcaseGrid label="Micro-interactions" cols={4}>
        {/* Like button */}
        <div className="flex flex-col items-center gap-2">
          <motion.button
            onClick={() => setLiked(!liked)}
            whileTap={{ scale: 0.85 }}
            className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-card hover:bg-muted/50 transition-colors"
          >
            <motion.div animate={liked ? { scale: [1, 1.4, 1] } : {}} transition={{ duration: 0.3 }}>
              <Heart className={`h-5 w-5 transition-colors ${liked ? 'fill-destructive text-destructive' : 'text-muted-foreground'}`} />
            </motion.div>
          </motion.button>
          <span className="text-label text-muted-foreground">Like</span>
        </div>

        {/* Counter */}
        <div className="flex flex-col items-center gap-2">
          <motion.button
            onClick={() => setCount(c => c + 1)}
            whileTap={{ scale: 0.9 }}
            className="flex h-12 min-w-[48px] items-center justify-center gap-1.5 rounded-2xl border border-border bg-card px-4 hover:bg-muted/50 transition-colors"
          >
            <Star className="h-4 w-4 text-warning" />
            <AnimatePresence mode="wait">
              <motion.span key={count} initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 10, opacity: 0 }} transition={{ duration: 0.15 }}
                className="text-body-sm font-semibold text-foreground tabular-nums">{count}</motion.span>
            </AnimatePresence>
          </motion.button>
          <span className="text-label text-muted-foreground">Counter</span>
        </div>

        {/* Spring button */}
        <div className="flex flex-col items-center gap-2">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button variant="brand" size="sm" className="gap-1.5">
              <ArrowRight className="h-3.5 w-3.5" /> Spring
            </Button>
          </motion.div>
          <span className="text-label text-muted-foreground">Hover + Tap</span>
        </div>

        {/* Success check */}
        <div className="flex flex-col items-center gap-2">
          <motion.div
            initial={false}
            animate={{ rotate: [0, -10, 10, 0] }}
            transition={{ duration: 0.4, repeat: Infinity, repeatDelay: 3 }}
            className="flex h-12 w-12 items-center justify-center rounded-2xl bg-success/10 border border-success/20"
          >
            <Check className="h-5 w-5 text-success" />
          </motion.div>
          <span className="text-label text-muted-foreground">Wiggle</span>
        </div>
      </ShowcaseGrid>

      {/* Page transition pattern */}
      <ShowcaseRow label="Page Transition Pattern">
        <CodeBlock code={`// Wrap pages in motion.div
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
>
  <PageContent />
</motion.div>`} />
      </ShowcaseRow>

      {/* Loading states */}
      <ShowcaseRow label="Animated Loading States">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
          <Loader2 className="h-5 w-5 text-primary" />
        </motion.div>

        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map(i => (
            <motion.div key={i} className="h-2 w-2 rounded-full bg-primary"
              animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }} />
          ))}
        </div>

        <motion.div className="h-1.5 w-32 rounded-full bg-muted overflow-hidden">
          <motion.div className="h-full rounded-full bg-primary"
            animate={{ width: ['0%', '100%'] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }} />
        </motion.div>

        <div className="flex items-center gap-1">
          {[0, 1, 2, 3].map(i => (
            <motion.div key={i} className="w-1 bg-primary rounded-full"
              animate={{ height: ['8px', '20px', '8px'] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.1 }} />
          ))}
        </div>
      </ShowcaseRow>
    </Section>
  );
}
