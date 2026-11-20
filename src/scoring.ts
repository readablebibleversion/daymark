import { addDays, fromKey, toKey, weekDays } from './date';
import { AppState, Goal } from './types';

export const countOf = (state: AppState, key: string, id: string) => state.checks[key]?.[id] ?? 0;

export const pointsFor = (g: Goal, count: number) => (g.kind === 'good' ? 1 : -1) * count * g.points;

/** Each finished day goal is worth this many points. */
export const TASK_POINTS = 1;

export const tasksDone = (state: AppState, key: string) => (state.tasks[key] ?? []).filter((x) => x.done).length;

/** Score for one day: every goal (archived too, so history stays stable) plus finished day goals. */
export function dayScore(state: AppState, key: string) {
  let total = tasksDone(state, key) * TASK_POINTS;
  const day = state.checks[key];
  if (!day) return total;
  for (const g of state.goals) total += pointsFor(g, day[g.id] ?? 0);
  return total;
}

const KG_PER_LB = 0.45359237;
export const toDisplayWeight = (kg: number, unit: 'kg' | 'lb') => Math.round((unit === 'kg' ? kg : kg / KG_PER_LB) * 10) / 10;
export const fromDisplayWeight = (v: number, unit: 'kg' | 'lb') => (unit === 'kg' ? v : v * KG_PER_LB);

export function weekScore(state: AppState, start: Date) {
  return weekDays(start).reduce((sum, d) => sum + dayScore(state, toKey(d)), 0);
}

/** Best possible daily score from the active positive goals. */
export const maxDayScore = (goals: Goal[]) =>
  goals.filter((g) => g.kind === 'good' && !g.archived).reduce((s, g) => s + g.points * g.perDay, 0);

/** A good day: target met. A bad habit day is "kept" when it did not happen. */
export const dayKept = (state: AppState, g: Goal, key: string) => {
  const c = countOf(state, key, g.id);
  return g.kind === 'good' ? c >= g.perDay : c === 0;
};

export const signed = (n: number) => (n > 0 ? `+${n}` : `${n}`);

/** First day this goal was tracked: when it was added, or its earliest check if that is earlier. */
export function earliestDate(state: AppState, g: Goal) {
  let earliest = fromKey(g.createdAt);
  for (const key of Object.keys(state.checks)) {
    if (state.checks[key][g.id] && fromKey(key) < earliest) earliest = fromKey(key);
  }
  return earliest;
}

/**
 * Current streak in days.
 * Good goals: consecutive days the target was met (today counts once it is met; otherwise the streak runs to yesterday).
 * Bad habits: consecutive clean days, back to when the habit was added.
 */
export function currentStreak(state: AppState, g: Goal, ref: Date) {
  const start = earliestDate(state, g);
  let d = ref;
  if (g.kind === 'good' && !dayKept(state, g, toKey(d))) d = addDays(d, -1);
  let n = 0;
  while (d >= start && dayKept(state, g, toKey(d))) {
    n++;
    d = addDays(d, -1);
  }
  return n;
}

export function bestStreak(state: AppState, g: Goal, ref: Date) {
  let best = 0;
  let run = 0;
  for (let d = earliestDate(state, g); d <= ref; d = addDays(d, 1)) {
    if (dayKept(state, g, toKey(d))) {
      run++;
      if (run > best) best = run;
    } else run = 0;
  }
  return best;
}
