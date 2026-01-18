// Dawn Theme - Warm neutrals variant

export const dawnTheme = {
  '--bg-primary': '#FFFBF5',
  '--bg-secondary': '#FEF6E9',
  '--bg-tertiary': '#F5E6D3',
  '--text-primary': '#3D3D3D',
  '--text-secondary': '#6B6B6B',
  '--text-muted': '#9CA3AF',
  '--accent': '#D97706',
  '--accent-muted': '#FEF3C7',
  '--success': '#059669',
  '--warning': '#F59E0B',
  '--danger': '#DC2626',
} as const;

export type DawnTheme = typeof dawnTheme;
