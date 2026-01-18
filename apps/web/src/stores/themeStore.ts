import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { type ThemeName, applyTheme } from '@/styles/themes';

interface ThemeState {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'mist',

      setTheme: (theme) => {
        applyTheme(theme);
        set({ theme });
      },
    }),
    {
      name: 'invicrm-theme',
      onRehydrateStorage: () => (state) => {
        // Apply theme on hydration
        if (state?.theme) {
          applyTheme(state.theme);
        }
      },
    }
  )
);
