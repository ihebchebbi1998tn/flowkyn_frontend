/**
 * Coffee Roulette - Animation Hooks
 * 6 core animation sequences with Framer Motion
 */

import { useEffect, useState, useCallback } from 'react';
import { Variants } from 'framer-motion';
import { useRoomTheme } from '../theme/RoomThemeContext';

/**
 * Animation configuration constants
 */
export const ANIMATION_CONFIG = {
  // Stage 1: Door Close (300ms)
  doorClose: {
    duration: 0.3,
    easing: [0.4, 0, 0.2, 1],
  },
  // Stage 2: Elevator Rise (1500ms)
  elevatorRise: {
    duration: 1.5,
    easing: [0.25, 0.46, 0.45, 0.94], // cubic-bezier for smooth rise
  },
  // Stage 3: Deceleration (500ms)
  decelerate: {
    duration: 0.5,
    easing: [0, 0.3, 0.8, 1],
  },
  // Stage 4: Bounce (300ms)
  bounce: {
    duration: 0.3,
    easing: [0.68, -0.55, 0.265, 1.55],
  },
  // Stage 5: Door Open (400ms)
  doorOpen: {
    duration: 0.4,
    easing: [0.17, 0.67, 0.83, 0.67],
  },
  // Stage 6: Room Fade In (500ms)
  fadeIn: {
    duration: 0.5,
    easing: [0.215, 0.61, 0.355, 1],
  },
};

// Total animation duration: 3.5 seconds
export const TOTAL_ANIMATION_DURATION = 0.3 + 1.5 + 0.5 + 0.3 + 0.4 + 0.5;

/**
 * Animation Sequence 1: Door Close Animation
 * Used in: Matching phase when elevator starts
 * Effect: Doors slide shut, creating anticipation
 */
export function useDoorCloseAnimation(): Variants {
  return {
    closed: {
      opacity: 1,
      x: 0,
      transition: { duration: ANIMATION_CONFIG.doorClose.duration },
    },
    closingLeft: {
      x: '-50%',
      transition: { duration: ANIMATION_CONFIG.doorClose.duration },
    },
    closingRight: {
      x: '50%',
      transition: { duration: ANIMATION_CONFIG.doorClose.duration },
    },
  };
}

/**
 * Animation Sequence 2: Elevator Rise Animation
 * Used in: Matching phase - main visual element
 * Effect: Smooth upward motion through floors, showing floor counter
 */
export function useElevatorRiseAnimation(): Variants {
  return {
    start: {
      y: 0,
      opacity: 1,
    },
    rise: {
      y: -500, // Rise up (you adjust this based on viewport)
      transition: {
        duration: ANIMATION_CONFIG.elevatorRise.duration,
        ease: ANIMATION_CONFIG.elevatorRise.easing as any,
      },
    },
  };
}

/**
 * Animation Sequence 3: Deceleration Animation
 * Used in: Matching phase - shows elevator slowing down
 * Effect: Smooth slowdown as elevator approaches destination floor
 */
export function useDecelerationAnimation(): Variants {
  return {
    rising: {
      y: -500,
      opacity: 1,
    },
    decelerating: {
      y: -520,
      transition: {
        duration: ANIMATION_CONFIG.decelerate.duration,
        ease: ANIMATION_CONFIG.decelerate.easing as any,
      },
    },
  };
}

/**
 * Animation Sequence 4: Bounce Animation
 * Used in: Matching phase - elevator arrival
 * Effect: Subtle bounce effect when reaching floor
 */
export function useBounceAnimation(): Variants {
  const { theme } = useRoomTheme();
  return {
    decelerating: {
      y: -520,
    },
    bounce: {
      y: -500,
      transition: {
        duration: ANIMATION_CONFIG.bounce.duration,
        ease: ANIMATION_CONFIG.bounce.easing as any,
      },
    },
  };
}

/**
 * Animation Sequence 5: Door Open Animation
 * Used in: Matching phase - elevator arrives, doors open
 * Effect: Doors slide open, revealing meeting room
 */
export function useDoorOpenAnimation(): Variants {
  return {
    open: {
      x: 0,
      opacity: 1,
      transition: { duration: ANIMATION_CONFIG.doorOpen.duration },
    },
    openingLeft: {
      x: '-50%',
      opacity: 0,
      transition: { duration: ANIMATION_CONFIG.doorOpen.duration },
    },
    openingRight: {
      x: '50%',
      opacity: 0,
      transition: { duration: ANIMATION_CONFIG.doorOpen.duration },
    },
  };
}

/**
 * Animation Sequence 6: Room Entry Fade & Scale
 * Used in: After doors open, room fades in with scale
 * Effect: Room appears with subtle scale and fade for immersion
 */
export function useRoomEntryAnimation(): Variants {
  return {
    hidden: {
      opacity: 0,
      scale: 0.95,
    },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: ANIMATION_CONFIG.fadeIn.duration,
        ease: ANIMATION_CONFIG.fadeIn.easing as any,
      },
    },
  };
}

/**
 * Complete elevator sequence orchestration
 * Combines all 6 animations into one cohesive sequence
 */
export function useCompleteElevatorSequence() {
  const [stage, setStage] = useState<'waiting' | 'animating' | 'complete'>('waiting');
  const [startTime, setStartTime] = useState<number | null>(null);

  const startAnimation = useCallback(() => {
    setStage('animating');
    setStartTime(Date.now());
  }, []);

  useEffect(() => {
    if (stage !== 'animating' || !startTime) return;

    const timer = setTimeout(() => {
      setStage('complete');
    }, TOTAL_ANIMATION_DURATION * 1000);

    return () => clearTimeout(timer);
  }, [stage, startTime]);

  return {
    stage,
    startAnimation,
    isAnimating: stage === 'animating',
    isComplete: stage === 'complete',
    totalDuration: TOTAL_ANIMATION_DURATION,
  };
}

/**
 * Hook for animating the floor counter during elevator rise
 * Shows current floor (1-N) as elevator rises
 */
export function useFloorCounter(startFloor: number = 1, endFloor: number = 10) {
  const [currentFloor, setCurrentFloor] = useState(startFloor);

  const animateFloors = useCallback(() => {
    let floor = startFloor;
    const interval = setInterval(() => {
      if (floor >= endFloor) {
        clearInterval(interval);
        return;
      }
      floor += 1;
      setCurrentFloor(floor);
    }, ANIMATION_CONFIG.elevatorRise.duration * 100);

    return () => clearInterval(interval);
  }, [startFloor, endFloor]);

  return { currentFloor, animateFloors };
}

/**
 * Hook for confetti animation on completion
 */
export function useConfettiAnimation() {
  const [isVisible, setIsVisible] = useState(false);

  const trigger = useCallback(() => {
    setIsVisible(true);
    const timer = setTimeout(() => setIsVisible(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  return { isVisible, trigger };
}

/**
 * Animation for avatar entrance into meeting room
 */
export function useAvatarEntrance(): Variants {
  return {
    hidden: {
      opacity: 0,
      x: -50,
    },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.6,
        ease: 'easeOut',
      },
    },
  };
}

/**
 * Animation for prompt display
 */
export function usePromptAnimation(): Variants {
  return {
    hidden: {
      opacity: 0,
      y: 20,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: 'easeOut',
      },
    },
    exit: {
      opacity: 0,
      y: -20,
      transition: {
        duration: 0.3,
      },
    },
  };
}

/**
 * Animation for timer display
 */
export function useTimerAnimation(): Variants {
  return {
    normal: {
      scale: 1,
    },
    warning: {
      scale: 1.1,
      transition: { duration: 0.2 },
    },
  };
}

/**
 * Parallax scroll effect for window background
 */
export function useParallaxEffect(offset: number = 0) {
  const { theme } = useRoomTheme();
  const [parallaxOffset, setParallaxOffset] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (typeof window !== 'undefined') {
        setParallaxOffset(window.scrollY * theme.parallax.intensity);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [theme]);

  return parallaxOffset + offset;
}
