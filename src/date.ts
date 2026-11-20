const pad = (n: number) => String(n).padStart(2, '0');

export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
export const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const toKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const fromKey = (k: string) => {
  const [y, m, d] = k.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

export const today = () => {
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth(), n.getDate());
};

/** Weeks start on Monday. */
export const startOfWeek = (d: Date) => addDays(d, -((d.getDay() + 6) % 7));

export const weekDays = (start: Date) => Array.from({ length: 7 }, (_, i) => addDays(start, i));

export const formatWeek = (start: Date) => {
  const end = addDays(start, 6);
  const left = `${MONTHS[start.getMonth()]} ${start.getDate()}`;
  const right = start.getMonth() === end.getMonth() ? `${end.getDate()}` : `${MONTHS[end.getMonth()]} ${end.getDate()}`;
  return `${left} – ${right}, ${end.getFullYear()}`;
};

export const shortDate = (d: Date) => `${MONTHS[d.getMonth()]} ${d.getDate()}`;
