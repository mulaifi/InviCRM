import { mistTheme } from './mist';
import { oceanTheme } from './ocean';
import { dawnTheme } from './dawn';

export type ThemeName = 'mist' | 'ocean' | 'dawn';

export interface ThemeTokens {
  '--bg-primary': string;
  '--bg-secondary': string;
  '--bg-tertiary': string;
  '--text-primary': string;
  '--text-secondary': string;
  '--text-muted': string;
  '--accent': string;
  '--accent-muted': string;
  '--success': string;
  '--warning': string;
  '--danger': string;
}

export const themes: Record<ThemeName, ThemeTokens> = {
  mist: mistTheme,
  ocean: oceanTheme,
  dawn: dawnTheme,
};

export function applyTheme(theme: ThemeName): void {
  const root = document.documentElement;
  const themeTokens = themes[theme];

  Object.entries(themeTokens).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });

  // Store preference
  localStorage.setItem('invicrm-theme', theme);
}

export function getStoredTheme(): ThemeName {
  const stored = localStorage.getItem('invicrm-theme');
  if (stored && stored in themes) {
    return stored as ThemeName;
  }
  return 'mist';
}

export function initializeTheme(): ThemeName {
  const theme = getStoredTheme();
  applyTheme(theme);
  return theme;
}
