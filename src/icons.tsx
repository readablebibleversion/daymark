import React from 'react';

const PATHS = {
  check: 'M5 12.5l4.5 4.5L19 7.5',
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
  left: 'M15 6l-6 6 6 6',
  right: 'M9 6l6 6-6 6',
  up: 'M6 15l6-6 6 6',
  down: 'M6 9l6 6 6-6',
  x: 'M6 6l12 12M18 6L6 18',
  trash: 'M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v5M14 11v5',
  archive: 'M3 4h18v5H3zM5 9v11h14V9M10 13h4',
  undo: 'M9 14L4 9l5-5M4 9h10.5a5.5 5.5 0 010 11H11',
  edit: 'M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4',
  sun: 'M12 8a4 4 0 100 8 4 4 0 000-8zM12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4',
  moon: 'M20 14.5A8 8 0 019.5 4 8 8 0 1020 14.5z',
  today: 'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4M9 14h3v3H9z',
  grid: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  chart: 'M5 20V11M12 20V4M19 20v-7M3 20h18',
  list: 'M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01',
  scale: 'M5 4h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5a1 1 0 011-1zM8.5 10a3.5 3.5 0 017 0M12 10l1.5-2',
  flame: 'M12 3c.5 3.5 5 5.5 5 10.5a5 5 0 01-10 0c0-2.5 1.5-4 2.5-5.5.5 1.5 1.5 2.5 2.5 2.5 0-2.5-.5-5 0-7.5z',
  download: 'M12 4v11M7 10l5 5 5-5M5 20h14',
  upload: 'M12 20V9M7 14l5-5 5 5M5 4h14',
  lock: 'M6 11h12v9H6zM8.5 11V8a3.5 3.5 0 017 0v3',
  eye: 'M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12zM12 9.5a2.5 2.5 0 100 5 2.5 2.5 0 000-5z',
  eyeOff: 'M3 3l18 18M10.6 6A9.7 9.7 0 0112 5.5c6 0 9.5 6.5 9.5 6.5a17 17 0 01-2.7 3.4M6.6 7.2C4 9 2.5 12 2.5 12S6 18.5 12 18.5c1.6 0 3-.4 4.2-1.1M9.9 10a2.5 2.5 0 003.6 3.5',
  note: 'M5 4h10l4 4v12H5zM15 4v4h4M8.5 12h7M8.5 16h5',
  target: 'M12 3a9 9 0 100 18 9 9 0 000-18zM12 7.5a4.5 4.5 0 100 9 4.5 4.5 0 000-9zM12 11.2a.8.8 0 100 1.6.8.8 0 000-1.6z',
  shield: 'M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3zM9 12l2 2 4-4',
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 22, strokeWidth = 2 }: { name: IconName; size?: number; strokeWidth?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth}
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d={PATHS[name]} />
    </svg>
  );
}

export type Mood = 'happy' | 'neutral' | 'sad';

/** A face. Filled faces use `color` as the background with white features. */
export function Face({ mood, size = 28, color, filled = true }: { mood: Mood; size?: number; color: string; filled?: boolean }) {
  const mouth =
    mood === 'happy' ? 'M8 14c1.1 1.6 2.4 2.4 4 2.4s2.9-.8 4-2.4' : mood === 'sad' ? 'M8 17c1.1-1.6 2.4-2.4 4-2.4s2.9.8 4 2.4' : 'M8.5 15.5h7';
  // Sticker style: filled faces get a dark ink outline and ink features.
  const ink = filled ? 'var(--ink)' : color;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="10.5" fill={filled ? color : 'none'} stroke={filled ? 'var(--ink)' : color} strokeWidth={filled ? 1.8 : 2} />
      <circle cx="8.6" cy="9.6" r="1.4" fill={ink} />
      <circle cx="15.4" cy="9.6" r="1.4" fill={ink} />
      <path d={mouth} fill="none" stroke={ink} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
