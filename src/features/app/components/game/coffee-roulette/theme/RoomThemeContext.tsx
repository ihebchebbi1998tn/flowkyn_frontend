/**
 * Coffee Roulette - Room Theme Context
 * Provides theme configuration to all components
 */

import { createContext, useContext, useMemo, CSSProperties, ReactNode } from 'react';
import { RoomThemeConfig, RoomTheme, getThemeByName } from './roomThemes';

interface RoomThemeContextType {
  theme: RoomThemeConfig;
  themeName: RoomTheme;
}

const RoomThemeContext = createContext<RoomThemeContextType | undefined>(undefined);

interface RoomThemeProviderProps {
  children: ReactNode;
  themeName: RoomTheme;
}

export function RoomThemeProvider({ children, themeName }: RoomThemeProviderProps) {
  const theme = getThemeByName(themeName);

  return (
    <RoomThemeContext.Provider value={{ theme, themeName }}>
      {children}
    </RoomThemeContext.Provider>
  );
}

/**
 * Hook to use room theme in components
 */
export function useRoomTheme(): RoomThemeContextType {
  const context = useContext(RoomThemeContext);
  if (!context) {
    throw new Error('useRoomTheme must be used within RoomThemeProvider');
  }
  return context;
}

/**
 * Hook to get CSS variables for the current theme
 */
export function useThemeVariables() {
  const { theme } = useRoomTheme();

  return useMemo(
    () => ({
      '--color-primary': theme.colors.primary,
      '--color-primary-light': theme.colors.primaryLight,
      '--color-primary-dark': theme.colors.primaryDark,
      '--color-secondary': theme.colors.secondary,
      '--color-accent': theme.colors.accent,
      '--color-background': theme.colors.background,
      '--color-background-light': theme.colors.backgroundLight,
      '--color-surface': theme.colors.surface,
      '--color-surface-light': theme.colors.surfaceLight,
      '--color-text': theme.colors.text,
      '--color-text-light': theme.colors.textLight,
      '--color-wall': theme.colors.wall,
      '--color-wall-light': theme.colors.wallLight,
      '--color-floor': theme.colors.floor,
      '--color-window': theme.colors.window,
      '--color-door': theme.colors.door,
      '--color-door-handle': theme.colors.doorHandle,
      '--gradient-room': theme.gradient.room,
      '--gradient-elevator': theme.gradient.elevator,
      '--gradient-floor': theme.gradient.floor,
      '--parallax-intensity': String(theme.parallax.intensity),
      '--parallax-blur': `${theme.parallax.blur}px`,
      '--animation-door-duration': `${theme.animation.doorDuration}ms`,
      '--animation-elevator-rise': `${theme.animation.elevatorRiseDuration}ms`,
      '--animation-bounce': String(theme.animation.elevatorBounce),
    } as CSSProperties),
    [theme]
  );
}
