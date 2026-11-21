import React, { useEffect, useState } from 'react';
import { addDays, startOfWeek, today } from './date';
import { GoalEditor } from './GoalEditor';
import { Icon, IconName } from './icons';
import { useStore } from './store';
import { Goal } from './types';
import { GoalsView } from './views/GoalsView';
import { ProgressView } from './views/ProgressView';
import { TodayView } from './views/TodayView';
import { WeekView } from './views/WeekView';

type Tab = 'day' | 'week' | 'progress' | 'goals';
const TABS: { key: Tab; label: string; icon: IconName }[] = [
  { key: 'day', label: 'Today', icon: 'today' },
  { key: 'week', label: 'Week', icon: 'grid' },
  { key: 'progress', label: 'Progress', icon: 'chart' },
  { key: 'goals', label: 'Goals', icon: 'list' },
];

function useResolvedTheme() {
  const { state } = useStore();
  const [systemDark, setSystemDark] = useState(() => matchMedia('(prefers-color-scheme: dark)').matches);
  useEffect(() => {
    const mq = matchMedia('(prefers-color-scheme: dark)');
    const on = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  const mode = state.theme === 'system' ? (systemDark ? 'dark' : 'light') : state.theme;
  useEffect(() => {
    document.documentElement.dataset.theme = mode;
    const color = mode === 'dark' ? '#111315' : '#F6F4EF';
    document.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.setAttribute('content', color));
  }, [mode]);
  return mode;
}

export function App({ onLock }: { onLock: () => void }) {
  const { dispatch } = useStore();
  const mode = useResolvedTheme();
  const [tab, setTab] = useState<Tab>('day');
  // One selected day drives every tab; the week views show the week it falls in.
  const [day, setDay] = useState(today);
  const weekStart = startOfWeek(day);
  const setWeekStart = (ws: Date) => setDay(addDays(ws, (day.getDay() + 6) % 7));
  const [editing, setEditing] = useState<Goal | null | undefined>(undefined); // undefined = closed, null = new
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 4);
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);

  const go = (t: Tab) => {
    setTab(t);
    window.scrollTo({ top: 0 });
  };

  const tabs = (
    <nav className="tabs" aria-label="Sections">
      {TABS.map((x) => (
        <button key={x.key} className="tab" aria-current={x.key === tab ? 'page' : undefined} onClick={() => go(x.key)}>
          <Icon name={x.icon} size={22} />
          {x.label}
        </button>
      ))}
    </nav>
  );

  return (
    <>
      <header className={`topbar${scrolled ? ' scrolled' : ''}`}>
        <div className="topbar-inner">
          <div className="brand">
            <span className="logo"><Icon name="check" size={19} strokeWidth={3} /></span>
            Daymark
          </div>
          <div className="desktop-tabs">{tabs}</div>
          <button className="icon-btn" aria-label="Lock" title="Lock" onClick={onLock}>
            <Icon name="lock" />
          </button>
          <button className="icon-btn" aria-label={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            onClick={() => dispatch({ type: 'theme', theme: mode === 'dark' ? 'light' : 'dark' })}>
            <Icon name={mode === 'dark' ? 'sun' : 'moon'} />
          </button>
        </div>
      </header>

      <main className={tab === 'day' || tab === 'progress' ? 'wide' : undefined}>
        {tab === 'day' && (
          <TodayView day={day} setDay={setDay} onEdit={setEditing}
            onOpenBackup={() => { go('goals'); setTimeout(() => document.getElementById('backup')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50); }} />
        )}
        {tab === 'week' && (
          <WeekView weekStart={weekStart} setWeekStart={setWeekStart} onEdit={setEditing}
            onPickDay={(d) => { setDay(d); go('day'); }} />
        )}
        {tab === 'progress' && <ProgressView weekStart={weekStart} />}
        {tab === 'goals' && <GoalsView onEdit={setEditing} />}
      </main>

      <div className="mobile-tabs">{tabs}</div>
      <GoalEditor open={editing !== undefined} goal={editing ?? null} onClose={() => setEditing(undefined)} />
    </>
  );
}
