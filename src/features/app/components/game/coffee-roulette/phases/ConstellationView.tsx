/**
 * Constellation / Orbit visualization for Coffee Roulette pairs.
 * Avatars float in concentric orbits; paired avatars are connected by glowing threads.
 */

import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getSafeImageUrl } from '@/features/app/utils/assets';

interface Participant {
  participantId: string;
  name: string;
  avatar: string;
  avatarUrl?: string | null;
}

export interface ChatBubble {
  id: string;
  participantId: string;
  message: string;
  senderName: string;
}

interface ConstellationViewProps {
  participants: Participant[];
  /** Width/height of the container — the orbit fills this square */
  size?: number;
  /** Active chat bubbles to show near participant avatars */
  chatBubbles?: ChatBubble[];
}

export function ConstellationView({ participants, size = 420, chatBubbles = [] }: ConstellationViewProps) {
  const center = size / 2;
  const count = participants.length;

  // Place participants on orbit(s)
  const nodes = useMemo(() => {
    if (count === 0) return [];
    const radius = size * 0.36;
    return participants.map((p, i) => {
      const angle = (2 * Math.PI * i) / count - Math.PI / 2;
      return {
        ...p,
        x: center + radius * Math.cos(angle),
        y: center + radius * Math.sin(angle),
        angle,
        index: i,
      };
    });
  }, [participants, count, center, size]);

  // Build pair connections (every 2 consecutive participants)
  const connections = useMemo(() => {
    const conns = [];
    for (let i = 0; i < nodes.length - 1; i += 2) {
      if (nodes[i + 1]) {
        conns.push({ from: nodes[i], to: nodes[i + 1], index: i / 2 });
      }
    }
    return conns;
  }, [nodes]);

  const avatarSize = count > 8 ? 40 : 52;
  const half = avatarSize / 2;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Orbit ring */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="absolute inset-0"
      >
        <svg width={size} height={size} className="absolute inset-0">
          {/* Orbit circle */}
          <circle
            cx={center}
            cy={center}
            r={size * 0.36}
            fill="none"
            stroke="hsl(var(--border))"
            strokeWidth="1"
            strokeDasharray="4 6"
            opacity={0.4}
          />
          {/* Inner glow ring */}
          <circle
            cx={center}
            cy={center}
            r={size * 0.12}
            fill="hsl(var(--primary) / 0.03)"
            stroke="hsl(var(--primary) / 0.1)"
            strokeWidth="1"
          />

          {/* Pair connection threads */}
          {connections.map((conn) => {
            const midX = (conn.from.x + conn.to.x) / 2;
            const midY = (conn.from.y + conn.to.y) / 2;
            // Curve control point — pull toward center for a nice arc
            const cpX = center + (midX - center) * 0.3;
            const cpY = center + (midY - center) * 0.3;

            return (
              <motion.path
                key={`conn-${conn.index}`}
                d={`M ${conn.from.x} ${conn.from.y} Q ${cpX} ${cpY} ${conn.to.x} ${conn.to.y}`}
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="1.5"
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.5 }}
                transition={{ duration: 1, delay: 0.3 + conn.index * 0.15 }}
              />
            );
          })}

          {/* Glow dots at connection midpoints */}
          {connections.map((conn) => {
            const midX = (conn.from.x + conn.to.x) / 2;
            const midY = (conn.from.y + conn.to.y) / 2;
            const cpX = center + (midX - center) * 0.3;
            const cpY = center + (midY - center) * 0.3;
            // Approximate quadratic bezier midpoint
            const bMidX = 0.25 * conn.from.x + 0.5 * cpX + 0.25 * conn.to.x;
            const bMidY = 0.25 * conn.from.y + 0.5 * cpY + 0.25 * conn.to.y;

            return (
              <motion.circle
                key={`glow-${conn.index}`}
                cx={bMidX}
                cy={bMidY}
                r="3"
                fill="hsl(var(--primary))"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.8, 0.3, 0.8] }}
                transition={{ duration: 3, repeat: Infinity, delay: conn.index * 0.3 }}
              />
            );
          })}
        </svg>
      </motion.div>

      {/* Center icon */}
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="absolute flex items-center justify-center"
        style={{
          left: center - 20,
          top: center - 20,
          width: 40,
          height: 40,
        }}
      >
        <div className="h-10 w-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
          <span className="text-sm">☕</span>
        </div>
      </motion.div>

      {/* Participant avatars on orbit */}
      {nodes.map((node, idx) => {
        const bubble = chatBubbles.find(b => b.participantId === node.participantId);
        // Position bubble above or below depending on avatar position
        const isTopHalf = node.y < center;

        return (
          <motion.div
            key={node.participantId}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35, delay: 0.1 + idx * 0.06 }}
            className="absolute group"
            style={{
              left: node.x - half,
              top: node.y - half,
              width: avatarSize,
              height: avatarSize,
            }}
          >
            <motion.div
              animate={{ y: [0, -3, 0] }}
              transition={{ duration: 3 + (idx % 3), repeat: Infinity, ease: 'easeInOut' }}
              className="relative"
            >
              <Avatar
                className="ring-2 ring-border/60 group-hover:ring-primary/50 transition-all shadow-lg shadow-black/20"
                style={{ width: avatarSize, height: avatarSize }}
              >
                <AvatarImage src={getSafeImageUrl(node.avatarUrl)} alt={node.name} />
                <AvatarFallback className="bg-primary/10 text-primary font-bold" style={{ fontSize: avatarSize * 0.28 }}>
                  {node.name?.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              {/* Chat bubble */}
              <AnimatePresence>
                {bubble && (
                  <motion.div
                    key={bubble.id}
                    initial={{ opacity: 0, scale: 0.7, y: isTopHalf ? 8 : -8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.7, y: isTopHalf ? 8 : -8 }}
                    transition={{ duration: 0.25 }}
                    className="absolute left-1/2 -translate-x-1/2 pointer-events-none z-20"
                    style={{
                      [isTopHalf ? 'top' : 'bottom']: avatarSize + 6,
                      maxWidth: 180,
                      minWidth: 60,
                    }}
                  >
                    <div className="relative bg-card border border-border/60 rounded-lg px-2.5 py-1.5 shadow-lg shadow-black/20">
                      <p className="text-[10px] font-medium text-foreground leading-snug line-clamp-3">
                        {bubble.message}
                      </p>
                      {/* Triangle pointer */}
                      <div
                        className="absolute left-1/2 -translate-x-1/2 w-2 h-2 bg-card border-border/60 rotate-45"
                        style={{
                          [isTopHalf ? 'top' : 'bottom']: -4,
                          borderWidth: '1px',
                          borderStyle: 'solid',
                          [isTopHalf ? 'borderRight' : 'borderLeft']: 'none',
                          [isTopHalf ? 'borderBottom' : 'borderTop']: 'none',
                        }}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Name tooltip */}
              <div className="absolute left-1/2 -translate-x-1/2 -bottom-5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <span className="text-[9px] font-medium text-muted-foreground bg-popover border border-border/60 px-1.5 py-0.5 rounded whitespace-nowrap shadow-sm">
                  {node.name}
                </span>
              </div>
            </motion.div>
          </motion.div>
        );
      })}
    </div>
  );
}
