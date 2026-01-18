// Mist Theme - Default calm, ambient palette
// The UI should feel like it's barely there - invisible CRM spirit

export const mistTheme = {
  '--bg-primary': '#FAFBFC',
  '--bg-secondary': '#F4F6F8',
  '--bg-tertiary': '#E8ECEF',
  '--text-primary': '#2D3748',
  '--text-secondary': '#718096',
  '--text-muted': '#A0AEC0',
  '--accent': '#6366F1',
  '--accent-muted': '#E0E7FF',
  '--success': '#10B981',
  '--warning': '#F59E0B',
  '--danger': '#EF4444',
} as const;

export type MistTheme = typeof mistTheme;
