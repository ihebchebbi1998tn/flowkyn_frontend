import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Sparkles } from 'lucide-react';

interface Props {
  myRoleKey: string | null;
  myRoleName: string;
  myRoleBrief: string;
  myRoleSecret: string;
  currentUserName?: string;
  currentUserAvatar: string;
  currentUserAvatarUrl?: string | null;
  t: (key: string, opts?: any) => string;
}

export function StrategicRoleRevealCard({
  myRoleKey, myRoleName, myRoleBrief, myRoleSecret,
  currentUserName, currentUserAvatar, currentUserAvatarUrl, t,
}: Props) {
  const [isFlipped, setIsFlipped] = useState(false);
  const hasRole = !!myRoleKey;

  return (
    <div className="relative w-full max-w-md mx-auto perspective-[1200px]" style={{ perspective: '1200px' }}>
      <motion.div
        className="relative w-full cursor-pointer"
        style={{ transformStyle: 'preserve-3d' }}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
        onClick={() => hasRole && setIsFlipped(f => !f)}
      >
        {/* Front — role overview */}
        <div
          className="w-full rounded-2xl border border-border bg-card shadow-lg overflow-hidden"
          style={{ backfaceVisibility: 'hidden' }}
        >
          {/* Decorative glow */}
          {hasRole && (
            <motion.div
              className="absolute inset-0 rounded-2xl"
              style={{
                background: 'radial-gradient(circle at 30% 20%, hsl(var(--primary) / 0.15), transparent 60%), radial-gradient(circle at 80% 80%, hsl(var(--accent) / 0.1), transparent 50%)',
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            />
          )}

          <div className="relative h-48 w-full p-4 flex flex-col justify-between">
            {/* Top row */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 overflow-hidden rounded-full bg-muted flex items-center justify-center ring-2 ring-primary/20">
                  {currentUserAvatarUrl ? (
                    <img src={currentUserAvatarUrl} alt={currentUserName || ''} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <span className="text-[11px] font-bold text-foreground">{currentUserAvatar}</span>
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-muted-foreground">{t('strategic.rolesMeta.playerLabel', { defaultValue: 'You' })}</span>
                  <span className="text-[12px] font-semibold text-foreground">{currentUserName || t('strategic.rolesMeta.unknownPlayer', { defaultValue: 'Participant' })}</span>
                </div>
              </div>
              <motion.span
                className="rounded-full bg-primary/10 border border-primary/30 px-2.5 py-1 text-[10px] font-semibold text-primary flex items-center gap-1"
                animate={hasRole ? { scale: [1, 1.05, 1] } : {}}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Sparkles className="h-3 w-3" />
                {t('strategic.rolesMeta.secret', { defaultValue: 'Secret role' })}
              </motion.span>
            </div>

            {/* Role name + brief */}
            <div className="space-y-1.5">
              <AnimatePresence mode="wait">
                <motion.div
                  key={myRoleKey || 'pending'}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.3 }}
                >
                  <p className="text-[11px] font-medium text-muted-foreground">
                    {hasRole ? t('strategic.rolesMeta.roleNameLabel', { defaultValue: 'Role' }) : t('strategic.rolesMeta.loading', { defaultValue: 'Waiting for your role…' })}
                  </p>
                  <p className="text-[16px] font-bold tracking-tight text-foreground">
                    {myRoleName || t('strategic.rolesMeta.pending', { defaultValue: 'Pending assignment' })}
                  </p>
                  <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">
                    {myRoleBrief || t('strategic.rolesMeta.pendingHint', { defaultValue: 'Your facilitator is assigning roles.' })}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Flip hint */}
            {hasRole && !isFlipped && (
              <motion.p
                className="text-[10px] text-muted-foreground/70 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0.4, 0.8, 0.4] }}
                transition={{ duration: 2.5, repeat: Infinity }}
              >
                {t('strategic.roleReveal.tapToFlip', { defaultValue: '↻ Tap to reveal secret details' })}
              </motion.p>
            )}
          </div>
        </div>

        {/* Back — secret details */}
        <div
          className="absolute inset-0 w-full rounded-2xl border border-primary/30 bg-card shadow-lg overflow-hidden"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <div className="absolute inset-0" style={{
            background: 'radial-gradient(circle at 70% 30%, hsl(var(--primary) / 0.08), transparent 60%)',
          }} />
          <div className="relative h-48 w-full p-4 flex flex-col justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-primary mb-1">
                {t('strategic.roleReveal.secretTitle', { defaultValue: 'Secret perspective' })}
              </p>
              <p className="text-[12px] text-foreground whitespace-pre-wrap leading-relaxed line-clamp-5">
                {myRoleSecret || t('strategic.rolesMeta.secretHint', { defaultValue: 'Think about what only you can see.' })}
              </p>
            </div>
            <motion.p
              className="text-[10px] text-muted-foreground/70 text-center"
              animate={{ opacity: [0.4, 0.8, 0.4] }}
              transition={{ duration: 2.5, repeat: Infinity }}
            >
              {t('strategic.roleReveal.tapToFlipBack', { defaultValue: '↻ Tap to flip back' })}
            </motion.p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
