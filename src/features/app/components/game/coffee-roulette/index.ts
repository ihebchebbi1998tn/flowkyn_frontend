/**
 * Coffee Roulette Virtual Office - Main Exports
 * Central export point for all components, hooks, and types
 */

// Main Component
export { CoffeeRouletteBoard, type CoffeeRouletteBoardProps } from './CoffeeRouletteBoard';

// Theme System
export {
  RoomThemeProvider,
  useRoomTheme,
  useThemeVariables,
} from './theme/RoomThemeContext';
export {
  ALL_THEMES,
  getThemeByName,
  getThemeForPair,
  type RoomTheme,
  type RoomThemeConfig,
} from './theme/roomThemes';

// Phase Components
export { OfficeLobby } from './phases/OfficeLobby';
export { ElevatorSequence } from './phases/ElevatorSequence';
export { MeetingRoom } from './phases/MeetingRoom';
export { OfficeExitAnimation } from './phases/OfficeExitAnimation';

// Animation Hooks
export {
  ANIMATION_CONFIG,
  TOTAL_ANIMATION_DURATION,
  useDoorCloseAnimation,
  useElevatorRiseAnimation,
  useDecelerationAnimation,
  useBounceAnimation,
  useDoorOpenAnimation,
  useRoomEntryAnimation,
  useCompleteElevatorSequence,
  useFloorCounter,
  useConfettiAnimation,
  useAvatarEntrance,
  usePromptAnimation,
  useTimerAnimation,
  useParallaxEffect,
} from './animations/useAnimations';

/**
 * Documentation
 * 
 * Start with: IMPLEMENTATION_COMPLETE.md
 * 
 * Key files:
 * - CoffeeRouletteBoard.tsx - Main orchestrator (THE ONLY FILE YOU NEED TO IMPORT)
 * - theme/roomThemes.ts - 5 themes with complete color system
 * - animations/useAnimations.ts - 6 animation sequences
 * - phases/*.tsx - 4 phase components
 * 
 * Usage:
 * 
 * import { CoffeeRouletteBoard } from '@/features/app/components/game/coffee-roulette';
 * 
 * <CoffeeRouletteBoard
 *   participants={participants}
 *   currentUserId={currentUserId}
 *   gameData={gameData}
 *   onEmitAction={onEmitAction}
 * />
 * 
 * That's it! All phases, themes, and animations are handled automatically.
 */
