import React, { createContext, useContext, useEffect, useReducer } from 'react';
import { toKey, today } from './date';
import { AppState, Goal, ThemePref, WeightUnit } from './types';

const STORAGE_KEY = 'daymark:v1';

export type NewGoal = Pick<Goal, 'name' | 'kind' | 'points' | 'perDay' | 'color'>;

type Action =
  | { type: 'hydrate'; state: AppState }
  | { type: 'addGoal'; goal: NewGoal }
  | { type: 'updateGoal'; id: string; patch: Partial<Goal> }
  | { type: 'move'; id: string; dir: -1 | 1 }
  | { type: 'archive'; id: string; archived: boolean }
  | { type: 'delete'; id: string }
  | { type: 'tap'; date: string; id: string }
  | { type: 'clear'; date: string; id: string }
  | { type: 'setCount'; date: string; id: string; n: number }
  | { type: 'theme'; theme: ThemePref }
  | { type: 'addTask'; date: string; text: string }
  | { type: 'toggleTask'; date: string; id: string }
  | { type: 'removeTask'; date: string; id: string }
  | { type: 'weight'; date: string; kg: number | null }
  | { type: 'unit'; unit: WeightUnit };

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

function starterState(): AppState {
  const createdAt = toKey(today());
  const g = (name: string, kind: Goal['kind'], points: number, perDay: number, color: string): Goal => ({
    id: uid(), name, kind, points, perDay, color, archived: false, createdAt,
  });
  return {
    version: 1,
    theme: 'system',
    checks: {},
    tasks: {},
    weights: {},
    unit: 'kg',
    goals: [
      g('Move for 30 min', 'good', 3, 1, '#2E9D6A'),
      g('Drink a glass of water', 'good', 1, 6, '#3B82C4'),
      g('Read 20 pages', 'good', 2, 1, '#7C5CE0'),
      g('Late-night snacking', 'bad', 2, 3, '#D9484D'),
    ],
  };
}

function setCount(state: AppState, date: string, id: string, n: number): AppState {
  const day = { ...(state.checks[date] ?? {}) };
  if (n > 0) day[id] = n;
  else delete day[id];
  const checks = { ...state.checks };
  if (Object.keys(day).length) checks[date] = day;
  else delete checks[date];
  return { ...state, checks };
}

function reducer(state: AppState, a: Action): AppState {
  switch (a.type) {
    case 'hydrate':
      return a.state;
    case 'addGoal':
      return {
        ...state,
        goals: [...state.goals, { ...a.goal, id: uid(), archived: false, createdAt: toKey(today()) }],
      };
    case 'updateGoal':
      return { ...state, goals: state.goals.map((g) => (g.id === a.id ? { ...g, ...a.patch } : g)) };
    case 'move': {
      const active = state.goals.filter((g) => !g.archived);
      const i = active.findIndex((g) => g.id === a.id);
      const other = active[i + a.dir];
      if (i < 0 || !other) return state;
      const goals = [...state.goals];
      const x = goals.findIndex((g) => g.id === a.id);
      const y = goals.findIndex((g) => g.id === other.id);
      [goals[x], goals[y]] = [goals[y], goals[x]];
      return { ...state, goals };
    }
    case 'archive': {
      // Restored goals go to the end of the list.
      const goal = state.goals.find((g) => g.id === a.id);
      if (!goal) return state;
      const rest = state.goals.filter((g) => g.id !== a.id);
      return { ...state, goals: [...rest, { ...goal, archived: a.archived }] };
    }
    case 'delete': {
      const checks: AppState['checks'] = {};
      for (const [date, day] of Object.entries(state.checks)) {
        const { [a.id]: _removed, ...rest } = day;
        if (Object.keys(rest).length) checks[date] = rest;
      }
      return { ...state, checks, goals: state.goals.filter((g) => g.id !== a.id) };
    }
    case 'tap': {
      const goal = state.goals.find((g) => g.id === a.id);
      if (!goal) return state;
      const c = state.checks[a.date]?.[a.id] ?? 0;
      return setCount(state, a.date, a.id, c >= goal.perDay ? 0 : c + 1);
    }
    case 'clear':
      return setCount(state, a.date, a.id, 0);
    case 'setCount': {
      const goal = state.goals.find((g) => g.id === a.id);
      if (!goal) return state;
      return setCount(state, a.date, a.id, Math.max(0, Math.min(goal.perDay, a.n)));
    }
    case 'theme':
      return { ...state, theme: a.theme };
    case 'addTask': {
      const list = [...(state.tasks[a.date] ?? []), { id: uid(), text: a.text, done: false }];
      return { ...state, tasks: { ...state.tasks, [a.date]: list } };
    }
    case 'toggleTask':
    case 'removeTask': {
      const cur = state.tasks[a.date] ?? [];
      const list =
        a.type === 'toggleTask'
          ? cur.map((x) => (x.id === a.id ? { ...x, done: !x.done } : x))
          : cur.filter((x) => x.id !== a.id);
      const tasks = { ...state.tasks };
      if (list.length) tasks[a.date] = list;
      else delete tasks[a.date];
      return { ...state, tasks };
    }
    case 'weight': {
      const weights = { ...state.weights };
      if (a.kg && a.kg > 0) weights[a.date] = Math.round(a.kg * 100) / 100;
      else delete weights[a.date];
      return { ...state, weights };
    }
    case 'unit':
      return { ...state, unit: a.unit };
  }
}

const StoreContext = createContext<{ state: AppState; dispatch: React.Dispatch<Action> } | null>(null);

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);

/**
 * Checks that parsed JSON looks like Daymark data and fills fields added after the first release.
 * Returns null when it is not usable.
 */
export function normalizeState(data: unknown): AppState | null {
  if (!isObj(data) || data.version !== 1 || !Array.isArray(data.goals) || !isObj(data.checks)) return null;
  const goalsOk = data.goals.every(
    (g) => isObj(g) && typeof g.id === 'string' && typeof g.name === 'string' && (g.kind === 'good' || g.kind === 'bad'),
  );
  if (!goalsOk) return null;
  const s = data as unknown as AppState;
  return {
    ...s,
    theme: s.theme ?? 'system',
    tasks: isObj(s.tasks) ? s.tasks : {},
    weights: isObj(s.weights) ? s.weights : {},
    unit: s.unit === 'lb' ? 'lb' : 'kg',
  };
}

function load(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const saved = raw ? normalizeState(JSON.parse(raw)) : null;
    if (saved) return saved;
  } catch {
    // Storage blocked or corrupt: start fresh.
  }
  return starterState();
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, load);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Storage full or blocked; keep working in memory.
    }
  }, [state]);

  return <StoreContext.Provider value={{ state, dispatch }}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}
