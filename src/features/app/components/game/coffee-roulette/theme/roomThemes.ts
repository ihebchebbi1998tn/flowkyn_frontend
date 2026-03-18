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
 * Warm, inviting, comfortable
 * Color palette: Warm tans, soft browns, terracotta accents
 * Feeling: Like a café you'd actually want to sit in
 */
export const cozyTheme: RoomThemeConfig = {
  name: 'cozy',
  displayName: 'Cozy Café',
  description: 'Warm, inviting, and comfortable like a local café',
  colors: {
    primary: '#D4A574', // Warm tan
    primaryLight: '#E8C4A0',
    primaryDark: '#B88860',
    secondary: '#8B6F47', // Deeper brown
    accent: '#D4644E', // Warm terracotta
    background: '#F5EFE7', // Cream
    backgroundLight: '#FAF8F3',
    surface: '#EDE6DB', // Soft tan
    surfaceLight: '#F8F5F0',
    text: '#4A3F35', // Dark brown
    textLight: '#6B5F55',
    wall: '#E8D5C4',
    wallLight: '#F0E8E0',
    floor: '#C9A877',
    window: '#A8D8EA', // Soft sky blue
    door: '#8B6F47',
    doorHandle: '#D4A574',
  },
  gradient: {
    room: 'linear-gradient(135deg, #F5EFE7 0%, #EDE6DB 50%, #E8D5C4 100%)',
    elevator: 'linear-gradient(180deg, #D4A574 0%, #B88860 100%)',
    floor: 'linear-gradient(90deg, #C9A877 0%, #D4A574 50%, #B88860 100%)',
  },
  animation: baseAnimationConfig,
  window: {
    background: '#A8D8EA',
    description: 'Gentle morning light through café windows',
    layers: ['#E0F7FF', '#B8DFFF', '#90C7FF'],
  },
  typography: {
    headingFont: 'Georgia, serif',
    bodyFont: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
  },
  parallax: {
    intensity: 0.03,
    blur: 1,
  },
};

/**
 * MODERN THEME
 * Clean, professional, contemporary
 * Color palette: Cool blues, crisp whites, silver accents
 * Feeling: Sleek corporate but not sterile
 */
export const modernTheme: RoomThemeConfig = {
  name: 'modern',
  displayName: 'Modern Office',
  description: 'Clean, professional, and contemporary',
  colors: {
    primary: '#1E88E5', // Modern blue
    primaryLight: '#42A5F5',
    primaryDark: '#1565C0',
    secondary: '#0D47A1', // Deep blue
    accent: '#00BCD4', // Cyan accent
    background: '#F5F7FA', // Off-white
    backgroundLight: '#FCFCFC',
    surface: '#EAEEF5', // Light blue-gray
    surfaceLight: '#F8FAFB',
    text: '#1A237E', // Dark navy
    textLight: '#37474F',
    wall: '#E3F2FD', // Very light blue
    wallLight: '#F8F9FA',
    floor: '#CFD8DC', // Cool gray
    window: '#87CEEB', // Sky blue
    door: '#1E88E5',
    doorHandle: '#00BCD4',
  },
  gradient: {
    room: 'linear-gradient(135deg, #F5F7FA 0%, #EAEEF5 50%, #E3F2FD 100%)',
    elevator: 'linear-gradient(180deg, #1E88E5 0%, #1565C0 100%)',
    floor: 'linear-gradient(90deg, #CFD8DC 0%, #E0E7FF 50%, #C5D9F1 100%)',
  },
  animation: baseAnimationConfig,
  window: {
    background: '#87CEEB',
    description: 'Crystal clear city skyline view',
    layers: ['#B0E0E6', '#ADD8E6', '#87CEEB'],
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
 * Vibrant, artistic, imaginative
 * Color palette: Purple, magenta, lime accents
 * Feeling: Artistic studio with creative energy
 */
export const creativeTheme: RoomThemeConfig = {
  name: 'creative',
  displayName: 'Creative Studio',
  description: 'Vibrant, artistic, and imaginative',
  colors: {
    primary: '#9C27B0', // Purple
    primaryLight: '#BA68C8',
    primaryDark: '#7B1FA2',
    secondary: '#6A1B9A', // Deep purple
    accent: '#00E676', // Lime green
    background: '#F3E5F5', // Light purple
    backgroundLight: '#FAF6FF',
    surface: '#EDE7F6', // Lavender
    surfaceLight: '#F8F5FA',
    text: '#4A148C', // Very dark purple
    textLight: '#5E35B1',
    wall: '#F3E5F5', // Light lavender
    wallLight: '#FCE4EC',
    floor: '#D1C4E9', // Soft purple
    window: '#BA68C8', // Medium purple
    door: '#9C27B0',
    doorHandle: '#00E676',
  },
  gradient: {
    room: 'linear-gradient(135deg, #F3E5F5 0%, #EDE7F6 50%, #F8F5FA 100%)',
    elevator: 'linear-gradient(180deg, #9C27B0 0%, #7B1FA2 100%)',
    floor: 'linear-gradient(90deg, #D1C4E9 0%, #E1BEE7 50%, #CE93D8 100%)',
  },
  animation: baseAnimationConfig,
  window: {
    background: '#BA68C8',
    description: 'Sunset over an artistic city',
    layers: ['#E1BEE7', '#CE93D8', '#BA68C8'],
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
 * Calm, peaceful, minimalist
 * Color palette: Soft greens, whites, natural tones
 * Feeling: Meditation room meets office
 */
export const zenTheme: RoomThemeConfig = {
  name: 'zen',
  displayName: 'Zen Garden',
  description: 'Calm, peaceful, and minimalist',
  colors: {
    primary: '#2E7D32', // Natural green
    primaryLight: '#43A047',
    primaryDark: '#1B5E20',
    secondary: '#1B5E20', // Deep forest
    accent: '#81C784', // Light green
    background: '#F1F8E9', // Very light green
    backgroundLight: '#FFFDE7',
    surface: '#DCEDC8', // Soft green
    surfaceLight: '#F5F5F5',
    text: '#1B5E20', // Forest green
    textLight: '#388E3C',
    wall: '#E8F5E9', // Very light green
    wallLight: '#F5F5F5',
    floor: '#A1887F', // Natural stone
    window: '#B5D6F9', // Pale sky
    door: '#558B2F',
    doorHandle: '#81C784',
  },
  gradient: {
    room: 'linear-gradient(135deg, #F1F8E9 0%, #DCEDC8 50%, #E8F5E9 100%)',
    elevator: 'linear-gradient(180deg, #2E7D32 0%, #1B5E20 100%)',
    floor: 'linear-gradient(90deg, #A1887F 0%, #BCAAA4 50%, #8D6E63 100%)',
  },
  animation: baseAnimationConfig,
  window: {
    background: '#B5D6F9',
    description: 'Serene mountain landscape',
    layers: ['#D0E8F2', '#B5D6F9', '#87CEEB'],
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
 * Energetic, bold, exciting
 * Color palette: Red, orange, yellow - warm and energetic
 * Feeling: Exciting lounge with high energy
 */
export const vibrantTheme: RoomThemeConfig = {
  name: 'vibrant',
  displayName: 'Vibrant Lounge',
  description: 'Energetic, bold, and exciting',
  colors: {
    primary: '#E53935', // Vibrant red
    primaryLight: '#EF5350',
    primaryDark: '#C62828',
    secondary: '#F57C00', // Vibrant orange
    accent: '#FDD835', // Golden yellow
    background: '#FFEBEE', // Light red
    backgroundLight: '#FFF8E1',
    surface: '#FFCCBC', // Light orange
    surfaceLight: '#FFF5E1',
    text: '#B71C1C', // Dark red
    textLight: '#D32F2F',
    wall: '#FFE0B2', // Light orange
    wallLight: '#FFF5E1',
    floor: '#D7CCC8', // Warm gray
    window: '#FFCA28', // Golden
    door: '#E53935',
    doorHandle: '#FDD835',
  },
  gradient: {
    room: 'linear-gradient(135deg, #FFEBEE 0%, #FFCCBC 50%, #FFE0B2 100%)',
    elevator: 'linear-gradient(180deg, #E53935 0%, #C62828 100%)',
    floor: 'linear-gradient(90deg, #D7CCC8 0%, #D4A574 50%, #C9A877 100%)',
  },
  animation: baseAnimationConfig,
  window: {
    background: '#FFCA28',
    description: 'Warm sunset over tropical island',
    layers: ['#FFE082', '#FFCA28', '#FFA726'],
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
