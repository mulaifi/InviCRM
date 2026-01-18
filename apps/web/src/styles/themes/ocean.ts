// Ocean Theme - Deeper blues variant

export const oceanTheme = {
  '--bg-primary': '#F7FAFC',
  '--bg-secondary': '#EBF4FF',
  '--bg-tertiary': '#C3DAFE',
  '--text-primary': '#1A365D',
  '--text-secondary': '#4A5568',
  '--text-muted': '#A0AEC0',
  '--accent': '#3182CE',
  '--accent-muted': '#BEE3F8',
  '--success': '#38A169',
  '--warning': '#DD6B20',
  '--danger': '#E53E3E',
} as const;

export type OceanTheme = typeof oceanTheme;
