import { createContext, useContext } from 'react';

export const palette = {
  light: {
    bg: '#F6F4EF',
    card: '#FFFFFF',
    text: '#1B1D21',
    muted: '#6B6F76',
    border: '#E6E1D8',
    accent: '#E39B2D',
    onAccent: '#1B1D21',
    good: '#2E9D6A',
    bad: '#D9484D',
    todayBg: '#FFF3DC',
    track: '#F0ECE4',
    overlay: 'rgba(20,20,24,0.45)',
  },
  dark: {
    bg: '#111315',
    card: '#1B1E22',
    text: '#F1EFEA',
    muted: '#9AA0A8',
    border: '#2B2F35',
    accent: '#F0AE45',
    onAccent: '#111315',
    good: '#43C08A',
    bad: '#F06A6E',
    todayBg: '#2B2416',
    track: '#252930',
    overlay: 'rgba(0,0,0,0.6)',
  },
};

export type Theme = typeof palette.light;
export type Mode = keyof typeof palette;

export const GOAL_COLORS = ['#2E9D6A', '#3B82C4', '#7C5CE0', '#E39B2D', '#D6458C', '#139C9C', '#D9484D', '#64748B'];

export const ThemeContext = createContext<{ t: Theme; mode: Mode }>({ t: palette.light, mode: 'light' });
export const useTheme = () => useContext(ThemeContext);

/** '#RRGGBB' + alpha 0..1 → '#RRGGBBAA' */
export const withAlpha = (hex: string, a: number) =>
  hex + Math.round(Math.max(0, Math.min(1, a)) * 255).toString(16).padStart(2, '0');
