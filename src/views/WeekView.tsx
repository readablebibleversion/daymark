import React, { useRef } from 'react';
import { addDays, DAY_LETTERS, formatWeek, startOfWeek, toKey, today, weekDays } from '../date';
import { Icon } from '../icons';
import { countOf, dayScore, maxDayScore, signed } from '../scoring';
import { useStore } from '../store';
import { Goal } from '../types';
import { cVar, goalColor } from '../ui';

/** 8432 → 8.4k, 10512 → 10.5k (rounded down so it never overstates), 12 → 12 */
const shortNum = (n: number) => (n >= 100000 ? `${Math.floor(n / 1000)}k` : n >= 1000 ? `${Math.floor(n / 100) / 10}k` : `${Math.round(n * 10) / 10}`);

interface Props {
  weekStart: Date;
  setWeekStart: (d: Date) => void;
  onEdit: (g: Goal | null) => void;
  /** Open a day in the Today view. */
  onPickDay: (d: Date) => void;
}

export function WeekView({ weekStart, setWeekStart, onEdit, onPickDay }: Props) {
  const { state, dispatch } = useStore();
  const now = today();
  const todayKey = toKey(now);
  const days = weekDays(weekStart);
  const active = state.goals.filter((g) => !g.archived);
  const isCurrent = toKey(weekStart) === toKey(startOfWeek(now));
  const scores = days.map((d) => dayScore(state, toKey(d)));
  const week = scores.reduce((a, b) => a + b, 0);
  const best = maxDayScore(state.goals);

  return (
    <>
      <div className="week-nav">
        <button className="icon-btn" aria-label="Previous week" onClick={() => setWeekStart(addDays(weekStart, -7))}>
          <Icon name="left" />
        </button>
        <div className="title">
          <h1>{formatWeek(weekStart)}</h1>
          {isCurrent ? <span className="muted" style={{ fontSize: 13 }}>This week</span> : (
            <button className="link" style={{ fontSize: 13 }} onClick={() => onPickDay(now)}>Back to this week</button>
          )}
        </div>
        <button className="icon-btn" aria-label="Next week" onClick={() => setWeekStart(addDays(weekStart, 7))}>
          <Icon name="right" />
        </button>
      </div>

      <div className="stats">
        <div className="stat">
          <div className="k">Week score</div>
          <div className={`v${week < 0 ? ' neg' : ''}`}>{signed(week)}</div>
          <div className="s">of {best * 7} possible</div>
        </div>
        <div className="stat">
          <div className="k">Best day</div>
          <div className="v">{Math.max(...scores) > 0 ? signed(Math.max(...scores)) : '—'}</div>
          <div className="s">{Math.max(...scores) > 0 ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][scores.indexOf(Math.max(...scores))] : 'Nothing yet'}</div>
        </div>
      </div>

      <section className="card" style={{ padding: '12px 8px' }} aria-label="Week grid">
        <table className="grid">
          <thead>
            <tr>
              <th className="name-col"><span className="sr-only">Goal</span></th>
              {days.map((d, i) => {
                const k = toKey(d);
                return (
                  <th key={k} scope="col">
                    {DAY_LETTERS[i]}
                    <br />
                    <button className={`date${k === todayKey ? ' today' : ''}`} onClick={() => onPickDay(d)} aria-label={`Open ${d.toDateString()}`}>
                      {d.getDate()}
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {active.map((g) => (
              <tr key={g.id} style={cVar(goalColor(g))}>
                <td className="name">
                  <button className="name-btn" onClick={() => onEdit(g)} aria-label={`Edit ${g.name}`}>
                    <span className="stripe" />
                    <span>
                      <b>{g.name}</b>
                      <small style={g.kind === 'bad' ? { color: 'var(--bad)' } : undefined}>
                        {g.kind === 'bad' ? '−' : '+'}{g.points} pt{g.perDay > 1 ? ` · ${g.perDay}×` : ''}
                      </small>
                    </span>
                  </button>
                </td>
                {days.map((d) => {
                  const k = toKey(d);
                  return (
                    <td key={k}>
                      <Cell goal={g} count={countOf(state, k, g.id)} future={k > todayKey} today={k === todayKey} hasNote={!!state.goalNotes[k]?.[g.id]} amount={state.amounts[k]?.[g.id]}
                        onTap={() => dispatch({ type: 'tap', date: k, id: g.id })}
                        onClear={() => dispatch({ type: 'clear', date: k, id: g.id })} />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
          {active.length > 0 && (
            <tfoot>
              <tr>
                <td className="name">Score</td>
                {scores.map((s, i) => (
                  <td key={i} className={s > 0 ? 'pos' : s < 0 ? 'neg' : 'muted'}>{s === 0 ? '·' : signed(s)}</td>
                ))}
              </tr>
            </tfoot>
          )}
        </table>
        {active.length === 0 && <p className="muted" style={{ textAlign: 'center', padding: 20 }}>No goals yet.</p>}
      </section>
      <p className="hint">Tap a square to check it off (tap again for repeats). Press and hold to clear. Tap a date to open that day.</p>
    </>
  );
}

function Cell({
  goal, count, future, today, hasNote, amount, onTap, onClear,
}: { goal: Goal; count: number; future: boolean; today: boolean; hasNote: boolean; amount?: number; onTap: () => void; onClear: () => void }) {
  const timer = useRef<number | undefined>(undefined);
  const held = useRef(false);
  const ratio = count / goal.perDay;
  const full = count >= goal.perDay;
  const bg = count > 0 ? `color-mix(in srgb, var(--c) ${Math.round(30 + 70 * ratio)}%, var(--card))` : undefined;

  const start = () => {
    held.current = false;
    timer.current = window.setTimeout(() => {
      held.current = true;
      onClear();
      navigator.vibrate?.(15);
    }, 500);
  };
  const cancel = () => window.clearTimeout(timer.current);

  return (
    <button
      className={`cell${count > 0 ? ' on' : ''}${today ? ' today' : ''}`}
      style={{ background: bg, color: count > 0 && ratio < 0.6 ? 'var(--text)' : undefined }}
      disabled={future}
      aria-label={`${goal.name}: ${count} of ${goal.perDay}`}
      onPointerDown={start}
      onPointerUp={cancel}
      onPointerLeave={cancel}
      onContextMenu={(e) => e.preventDefault()}
      onClick={() => {
        if (held.current) held.current = false;
        else onTap();
      }}
    >
      {hasNote && <span className="notedot" aria-label="Has a note" />}
      {amount !== undefined && goal.amountUnit ? (
        <span className="cell-amt">{shortNum(amount)}</span>
      ) : count > 0 && (full && goal.perDay === 1 ? <Icon name={goal.kind === 'bad' ? 'x' : 'check'} size={20} strokeWidth={2.6} /> : count)}
    </button>
  );
}
