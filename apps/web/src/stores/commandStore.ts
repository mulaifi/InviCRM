import { create } from 'zustand';
import type { ReportSpec } from '@/types/report';
import type { CommandIntent } from '@/types/command';

interface CommandState {
  isOpen: boolean;
  query: string;
  isProcessing: boolean;
  lastIntent: CommandIntent | null;
  activeReport: ReportSpec | null;

  // Actions
  open: () => void;
  close: () => void;
  toggle: () => void;
  setQuery: (query: string) => void;
  setProcessing: (isProcessing: boolean) => void;
  setIntent: (intent: CommandIntent | null) => void;
  setReport: (report: ReportSpec | null) => void;
  reset: () => void;
}

export const useCommandStore = create<CommandState>((set) => ({
  isOpen: false,
  query: '',
  isProcessing: false,
  lastIntent: null,
  activeReport: null,

  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false, query: '' }),
  toggle: () => set((state) => ({ isOpen: !state.isOpen })),
  setQuery: (query) => set({ query }),
  setProcessing: (isProcessing) => set({ isProcessing }),
  setIntent: (intent) => set({ lastIntent: intent }),
  setReport: (report) => set({ activeReport: report }),
  reset: () =>
    set({
      isOpen: false,
      query: '',
      isProcessing: false,
      lastIntent: null,
    }),
}));
