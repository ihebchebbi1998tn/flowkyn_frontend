/**
 * Coffee Roulette Virtual Office - Room Themes
 * 5 carefully designed themes with complete color system and styling
 */

export type RoomTheme = 'cozy' | 'modern' | 'creative' | 'zen' | 'vibrant';

export interface RoomThemeConfig {
  name: RoomTheme;
  displayName: string;
  description: string;
  colors: {
    primary: string;
    primaryLight: string;
    primaryDark: string;
    secondary: string;
    accent: string;
    background: string;
    backgroundLight: string;
    surface: string;
    surfaceLight: string;
    text: string;
    textLight: string;
    wall: string;
    wallLight: string;
    floor: string;
    window: string;
    door: string;
    doorHandle: string;
  };
  gradient: {
    room: string;
    elevator: string;
    floor: string;
  };
  animation: {
    doorDuration: number;
    elevatorRiseDuration: number;
    elevatorBounce: number;
    particleOpacity: number;
  };
  window: {
    background: string;
    description: string;
    layers: string[];
  };
  typography: {
    headingFont: string;
    bodyFont: string;
  };
  parallax: {
    intensity: number;
    blur: number;
  };
}

const baseAnimationConfig = {
  doorDuration: 300,
  elevatorRiseDuration: 1500,
  elevatorBounce: 0.4,
  particleOpacity: 0.5,
};

/**
 * COZY THEME
 * Professional, inviting, comfortable
 * Color palette: App purple (#6C5CE7), soft lavenders, professional neutrals
 * Feeling: Polished professional environment
 */
export const cozyTheme: RoomThemeConfig = {
  name: 'cozy',
  displayName: 'Professional Purple',
  description: 'Professional, polished, and inviting',
  colors: {
    primary: '#6C5CE7', // App primary purple
    primaryLight: '#8B7AED',
    primaryDark: '#5844D0',
    secondary: '#5844D0', // Darker purple
    accent: '#A29BFE', // App accent light purple
    background: '#F8F9FC', // App background light
    backgroundLight: '#FCFDFF',
    surface: '#F3F2FB', // Soft purple tint
    surfaceLight: '#F9F8FD',
    text: '#2D2A3D', // Professional dark
    textLight: '#6B6B7D',
    wall: '#E8E5F5', // Light purple wall
    wallLight: '#F3F0FB',
    floor: '#D8D4E8', // Soft purple floor
    window: '#E0E5FF', // Light blue tint
    door: '#6C5CE7',
    doorHandle: '#A29BFE',
  },
  gradient: {
    room: 'linear-gradient(135deg, #F8F9FC 0%, #F3F2FB 50%, #E8E5F5 100%)',
    elevator: 'linear-gradient(180deg, #6C5CE7 0%, #5844D0 100%)',
    floor: 'linear-gradient(90deg, #D8D4E8 0%, #E0DDF0 50%, #D0CDE5 100%)',
  },
  animation: baseAnimationConfig,
  window: {
    background: '#E0E5FF',
    description: 'Professional skyline view',
    layers: ['#EEF0FF', '#E0E5FF', '#D0D8FF'],
  },
  typography: {
    headingFont: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
    bodyFont: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
  },
  parallax: {
    intensity: 0.03,
    blur: 1,
  },
};

/**
 * MODERN THEME
 * Clean, professional, sleek
 * Color palette: App purple tones with cool neutrals
 * Feeling: Contemporary professional workspace
 */
export const modernTheme: RoomThemeConfig = {
  name: 'modern',
  displayName: 'Modern Professional',
  description: 'Clean, sleek, and contemporary',
  colors: {
    primary: '#6C5CE7', // App primary
    primaryLight: '#7D6EF5',
    primaryDark: '#5A4DB0',
    secondary: '#4F46B8', // Deeper blue-purple
    accent: '#7C3AED', // Vibrant purple
    background: '#F8F9FC', // App light background
    backgroundLight: '#FCFDFF',
    surface: '#F0EDFF', // Soft lavender
    surfaceLight: '#F9F8FD',
    text: '#1F1B2E', // Dark neutral
    textLight: '#5B5A6F',
    wall: '#E8E5F5', // Professional light
    wallLight: '#F3F0FB',
    floor: '#D5CFEB', // Neutral-purple floor
    window: '#D4D8FF', // Cool light
    door: '#6C5CE7',
    doorHandle: '#7C3AED',
  },
  gradient: {
    room: 'linear-gradient(135deg, #F8F9FC 0%, #F0EDFF 50%, #E8E5F5 100%)',
    elevator: 'linear-gradient(180deg, #6C5CE7 0%, #5A4DB0 100%)',
    floor: 'linear-gradient(90deg, #D5CFEB 0%, #DFD8F0 50%, #CEC6E0 100%)',
  },
  animation: baseAnimationConfig,
  window: {
    background: '#D4D8FF',
    description: 'Clear professional cityscape',
    layers: ['#E8EBFF', '#D4D8FF', '#C0C8FF'],
  },
  typography: {
    headingFont: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
    bodyFont: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
  },
  parallax: {
    intensity: 0.04,
    blur: 0.5,
  },
};

/**
 * CREATIVE THEME
 * Professional yet creative, artistic
 * Color palette: Purple with indigo accents
 * Feeling: Creative workspace with polish
 */
export const creativeTheme: RoomThemeConfig = {
  name: 'creative',
  displayName: 'Creative Professional',
  description: 'Professional with creative edge',
  colors: {
    primary: '#7C3AED', // Vibrant purple
    primaryLight: '#8B5CF6',
    primaryDark: '#6D28D9',
    secondary: '#6D28D9', // Deep purple
    accent: '#A78BFA', // Light purple
    background: '#F8F9FC', // App background
    backgroundLight: '#FCFDFF',
    surface: '#F3E8FF', // Very light purple
    surfaceLight: '#FDFCFE',
    text: '#2E1065', // Deep dark purple
    textLight: '#5B4B8A',
    wall: '#E9D5FF', // Light purple wall
    wallLight: '#F5F0FF',
    floor: '#DDD6FE', // Soft purple
    window: '#EDE9FE', // Pale purple
    door: '#7C3AED',
    doorHandle: '#A78BFA',
  },
  gradient: {
    room: 'linear-gradient(135deg, #F8F9FC 0%, #F3E8FF 50%, #E9D5FF 100%)',
    elevator: 'linear-gradient(180deg, #7C3AED 0%, #6D28D9 100%)',
    floor: 'linear-gradient(90deg, #DDD6FE 0%, #E9D5FF 50%, #D8BFFF 100%)',
  },
  animation: baseAnimationConfig,
  window: {
    background: '#EDE9FE',
    description: 'Creative horizons view',
    layers: ['#F5F0FF', '#EDE9FE', '#E9D5FF'],
  },
  typography: {
    headingFont: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
    bodyFont: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
  },
  parallax: {
    intensity: 0.05,
    blur: 1.5,
  },
};

/**
 * ZEN THEME
 * Calm, peaceful, professional minimalist
 * Color palette: Cool blues with purple tones, naturals
 * Feeling: Peaceful professional space
 */
export const zenTheme: RoomThemeConfig = {
  name: 'zen',
  displayName: 'Zen Professional',
  description: 'Calm, peaceful, and professional',
  colors: {
    primary: '#4F46E5', // Indigo
    primaryLight: '#6366F1',
    primaryDark: '#4338CA',
    secondary: '#4338CA', // Deep indigo
    accent: '#A5B4FC', // Light indigo
    background: '#F8F9FC', // App light
    backgroundLight: '#FCFDFF',
    surface: '#EEF2FF', // Very light indigo
    surfaceLight: '#F8F9FE',
    text: '#312E81', // Dark indigo
    textLight: '#4F46E5',
    wall: '#E0E7FF', // Light indigo wall
    wallLight: '#F0F4FF',
    floor: '#C7D2FE', // Soft indigo
    window: '#D1D5DB', // Cool gray-blue
    door: '#4F46E5',
    doorHandle: '#A5B4FC',
  },
  gradient: {
    room: 'linear-gradient(135deg, #F8F9FC 0%, #EEF2FF 50%, #E0E7FF 100%)',
    elevator: 'linear-gradient(180deg, #4F46E5 0%, #4338CA 100%)',
    floor: 'linear-gradient(90deg, #C7D2FE 0%, #D1D5DB 50%, #BFDBFE 100%)',
  },
  animation: baseAnimationConfig,
  window: {
    background: '#D1D5DB',
    description: 'Serene minimalist horizon',
    layers: ['#E5E7EB', '#D1D5DB', '#C7D2FE'],
  },
  typography: {
    headingFont: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
    bodyFont: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
  },
  parallax: {
    intensity: 0.02,
    blur: 2,
  },
};

/**
 * VIBRANT THEME
 * Professional and energetic
 * Color palette: Bold purples, professional accents
 * Feeling: Energetic professional environment
 */
export const vibrantTheme: RoomThemeConfig = {
  name: 'vibrant',
  displayName: 'Vibrant Professional',
  description: 'Professional and energetic',
  colors: {
    primary: '#6C5CE7', // App primary
    primaryLight: '#9379E0',
    primaryDark: '#544BBD',
    secondary: '#E879F9', // Vibrant magenta
    accent: '#A29BFE', // App accent
    background: '#F8F9FC', // App light
    backgroundLight: '#FCFDFF',
    surface: '#F0E6FF', // Light purple
    surfaceLight: '#FDFCFE',
    text: '#3D1F47', // Deep purple
    textLight: '#6C5CE7',
    wall: '#E8D5F2', // Vibrant light purple
    wallLight: '#F4E6FF',
    floor: '#D8C3E8', // Vibrant soft
    window: '#F0DEFF', // Pale vibrant
    door: '#6C5CE7',
    doorHandle: '#E879F9',
  },
  gradient: {
    room: 'linear-gradient(135deg, #F8F9FC 0%, #F0E6FF 50%, #E8D5F2 100%)',
    elevator: 'linear-gradient(180deg, #6C5CE7 0%, #544BBD 100%)',
    floor: 'linear-gradient(90deg, #D8C3E8 0%, #E8D5F2 50%, #D0BDD8 100%)',
  },
  animation: baseAnimationConfig,
  window: {
    background: '#F0DEFF',
    description: 'Vibrant professional energy',
    layers: ['#F8E6FF', '#F0DEFF', '#E8D5F2'],
  },
  typography: {
    headingFont: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
    bodyFont: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
  },
  parallax: {
    intensity: 0.05,
    blur: 0.5,
  },
};

/**
 * All available themes
 */
export const ALL_THEMES: RoomThemeConfig[] = [
  cozyTheme,
  modernTheme,
  creativeTheme,
  zenTheme,
  vibrantTheme,
];

/**
 * Get theme by name
 */
export function getThemeByName(name: RoomTheme): RoomThemeConfig {
  const theme = ALL_THEMES.find(t => t.name === name);
  if (!theme) {
    console.warn(`Theme "${name}" not found, using cozy theme`);
    return cozyTheme;
  }
  return theme;
}

/**
 * Hash-based theme selection for consistency
 * Same pair ID will always get the same theme
 */
export function getThemeForPair(pairId: string): RoomTheme {
  let hash = 0;
  for (let i = 0; i < pairId.length; i++) {
    const char = pairId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  const themeNames: RoomTheme[] = ['cozy', 'modern', 'creative', 'zen', 'vibrant'];
  return themeNames[Math.abs(hash) % themeNames.length];
}
