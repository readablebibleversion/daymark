export type GoalKind = 'good' | 'bad';

export interface Goal {
  id: string;
  name: string;
  /** good = positive goal (adds points), bad = negative habit (subtracts points) */
  kind: GoalKind;
  /** points per check */
  points: number;
  /** daily target / max checks per day */
  perDay: number;
  color: string;
  archived: boolean;
  /** YYYY-MM-DD */
  createdAt: string;
}

/** checks[dateKey][goalId] = number of checks that day */
export type Checks = Record<string, Record<string, number>>;

export type ThemePref = 'system' | 'light' | 'dark';

export interface DayTask {
  id: string;
  text: string;
  done: boolean;
}

export type WeightUnit = 'kg' | 'lb';

export interface AppState {
  version: 1;
  goals: Goal[];
  checks: Checks;
  theme: ThemePref;
  /** one-off goals for a single day: tasks[dateKey] */
  tasks: Record<string, DayTask[]>;
  /** body weight in kg: weights[dateKey] */
  weights: Record<string, number>;
  unit: WeightUnit;
  /** True once the user picks a unit; until then it follows the device's region. */
  unitSet?: boolean;
}
