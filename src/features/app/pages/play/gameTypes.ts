import type { GameParticipant } from '@/features/app/components/game/shell';

// Central game type registry so boards and GamePlay stay in sync.
export const GAME_TYPES = {
  TWO_TRUTHS: 'two-truths',
  COFFEE_ROULETTE: 'coffee-roulette',
  WINS_OF_WEEK: 'wins-of-week',
  STRATEGIC_ESCAPE: 'strategic-escape',
} as const;

export type GameTypeKey = typeof GAME_TYPES[keyof typeof GAME_TYPES];

export const GAME_CONFIGS: Record<string, {
  titleKey: string;
  subtitleKey: string;
  type: 'sync' | 'async';
  gameTypeKey: GameTypeKey;
  promptKey?: string;
}> = {
  '1': { titleKey: 'gamePlay.configs.twoTruthsTitle', subtitleKey: 'gamePlay.configs.twoTruthsSubtitle', type: 'sync', gameTypeKey: GAME_TYPES.TWO_TRUTHS },
  '2': { titleKey: 'gamePlay.configs.coffeeRouletteTitle', subtitleKey: 'gamePlay.configs.coffeeRouletteSubtitle', type: 'sync', gameTypeKey: GAME_TYPES.COFFEE_ROULETTE },
  '3': { titleKey: 'gamePlay.configs.winsOfWeekTitle', subtitleKey: 'gamePlay.configs.winsOfWeekSubtitle', type: 'async', gameTypeKey: GAME_TYPES.WINS_OF_WEEK, promptKey: 'gamePlay.configs.defaultPrompt' },
  '4': {
    titleKey: 'gamePlay.configs.strategicEscapeTitle',
    subtitleKey: 'gamePlay.configs.strategicEscapeSubtitle',
    type: 'async',
    gameTypeKey: GAME_TYPES.STRATEGIC_ESCAPE,
    promptKey: 'gamePlay.configs.strategicEscapePrompt',
  },
};

export const GAME_KEY_TO_CONFIG_ID: Record<GameTypeKey, string> = {
  [GAME_TYPES.TWO_TRUTHS]: '1',
  [GAME_TYPES.COFFEE_ROULETTE]: '2',
  [GAME_TYPES.WINS_OF_WEEK]: '3',
  [GAME_TYPES.STRATEGIC_ESCAPE]: '4',
};

