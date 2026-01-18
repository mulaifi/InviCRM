import { create } from 'zustand';

export type ZoomLevel = 'now' | 'horizon' | 'landscape';

interface ZoomState {
  level: ZoomLevel;
  isTransitioning: boolean;
  history: ZoomLevel[];

  // Actions
  setLevel: (level: ZoomLevel) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  goBack: () => void;
  setTransitioning: (isTransitioning: boolean) => void;
}

const ZOOM_ORDER: ZoomLevel[] = ['now', 'horizon', 'landscape'];

export const useZoomStore = create<ZoomState>((set, get) => ({
  level: 'now',
  isTransitioning: false,
  history: [],

  setLevel: (level) => {
    const current = get().level;
    if (current !== level) {
      set((state) => ({
        level,
        history: [...state.history, current],
        isTransitioning: true,
      }));

      // Auto-clear transitioning after animation
      setTimeout(() => {
        set({ isTransitioning: false });
      }, 500);
    }
  },

  zoomIn: () => {
    const { level } = get();
    const currentIndex = ZOOM_ORDER.indexOf(level);
    if (currentIndex > 0) {
      const newLevel = ZOOM_ORDER[currentIndex - 1];
      if (newLevel) {
        get().setLevel(newLevel);
      }
    }
  },

  zoomOut: () => {
    const { level } = get();
    const currentIndex = ZOOM_ORDER.indexOf(level);
    if (currentIndex < ZOOM_ORDER.length - 1) {
      const newLevel = ZOOM_ORDER[currentIndex + 1];
      if (newLevel) {
        get().setLevel(newLevel);
      }
    }
  },

  goBack: () => {
    const { history } = get();
    if (history.length > 0) {
      const previous = history[history.length - 1];
      if (previous) {
        set({
          level: previous,
          history: history.slice(0, -1),
          isTransitioning: true,
        });

        setTimeout(() => {
          set({ isTransitioning: false });
        }, 500);
      }
    }
  },

  setTransitioning: (isTransitioning) => set({ isTransitioning }),
}));

// Selectors
export const selectZoomScale = (level: ZoomLevel): number => {
  switch (level) {
    case 'now':
      return 1;
    case 'horizon':
      return 0.85;
    case 'landscape':
      return 0.7;
  }
};

export const selectZoomLabel = (level: ZoomLevel): string => {
  switch (level) {
    case 'now':
      return 'Today';
    case 'horizon':
      return 'This Week';
    case 'landscape':
      return 'Quarter';
  }
};
