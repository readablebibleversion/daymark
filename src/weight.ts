import { fromKey } from './date';
import { WeightUnit } from './types';

/** Daily smoothing factor for the trend line (the classic "Hacker's Diet" 10%). */
const ALPHA = 0.1;
const DAY = 86_400_000;
const KG_PER_LB = 0.45359237;

export interface WeighIn {
  key: string;
  date: Date;
  kg: number;
  /** Smoothed trend weight after this weigh-in. */
  trendKg: number;
}

/**
 * Weigh-ins in date order with an exponentially smoothed trend. Gaps between weigh-ins are
 * handled by applying the daily factor once per elapsed day, so skipping days doesn't
 * make a single reading count for too much or too little.
 */
export function weightSeries(weights: Record<string, number>): WeighIn[] {
  const keys = Object.keys(weights).sort();
  const out: WeighIn[] = [];
  let trend = 0;
  let prev: Date | null = null;
  for (const key of keys) {
    const date = fromKey(key);
    const kg = weights[key];
    if (!prev) trend = kg;
    else {
      const gap = Math.max(1, Math.round((date.getTime() - prev.getTime()) / DAY));
      const a = 1 - Math.pow(1 - ALPHA, gap);
      trend += a * (kg - trend);
    }
    out.push({ key, date, kg, trendKg: trend });
    prev = date;
  }
  return out;
}

/**
 * Rate of change of the trend in kg per week, from a least-squares fit over the last `days` days.
 * Returns null when there isn't at least a week of data to go on.
 */
export function weeklyRate(series: WeighIn[], days = 28): number | null {
  if (series.length < 2) return null;
  const end = series[series.length - 1].date.getTime();
  const pts = series.filter((p) => end - p.date.getTime() <= days * DAY);
  if (pts.length < 2) return null;
  const span = (end - pts[0].date.getTime()) / DAY;
  if (span < 6) return null;
  const xs = pts.map((p) => (p.date.getTime() - end) / DAY);
  const ys = pts.map((p) => p.trendKg);
  const mx = xs.reduce((a, b) => a + b, 0) / xs.length;
  const my = ys.reduce((a, b) => a + b, 0) / ys.length;
  let num = 0, den = 0;
  xs.forEach((x, i) => { num += (x - mx) * (ys[i] - my); den += (x - mx) ** 2; });
  return den ? (num / den) * 7 : null;
}

/** When the trend reaches the goal at the current rate, or null if it isn't heading there. */
export function projectGoalDate(trendKg: number, goalKg: number, ratePerWeek: number | null, from: Date): Date | null {
  if (ratePerWeek === null || Math.abs(ratePerWeek) < 0.02) return null;
  const weeks = (goalKg - trendKg) / ratePerWeek;
  if (!(weeks > 0) || weeks > 260) return null; // wrong direction, or more than 5 years out
  return new Date(from.getTime() + weeks * 7 * DAY);
}

/** Convert kg to the display unit, unrounded. */
export const kgTo = (kg: number, unit: WeightUnit) => (unit === 'kg' ? kg : kg / KG_PER_LB);
export const toKg = (v: number, unit: WeightUnit) => (unit === 'kg' ? v : v * KG_PER_LB);
export const fmtW = (kg: number, unit: WeightUnit) => (Math.round(kgTo(kg, unit) * 10) / 10).toFixed(1);

/** Round-number milestones strictly between start and goal (every 5 lb or 2 kg), in kg. */
export function milestones(startKg: number, goalKg: number, unit: WeightUnit): number[] {
  const step = unit === 'lb' ? 5 : 2;
  const s = kgTo(startKg, unit);
  const g = kgTo(goalKg, unit);
  const out: number[] = [];
  if (g < s) for (let m = Math.ceil(s / step - 1) * step; m > g + 1e-9; m -= step) { if (m < s - 1e-9) out.push(toKg(m, unit)); }
  else if (g > s) for (let m = Math.floor(s / step + 1) * step; m < g - 1e-9; m += step) { if (m > s + 1e-9) out.push(toKg(m, unit)); }
  return out;
}
