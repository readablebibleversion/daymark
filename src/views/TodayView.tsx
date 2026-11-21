import React, { useEffect, useState } from 'react';
import { backupDue, snoozeBackup } from '../backup';
import { NoteBox } from '../NoteBox';
import { fmtW, weightSeries } from '../weight';
import { addDays, fromKey, MONTHS, shortDate, toKey, today } from '../date';
import { Face, Icon, Mood } from '../icons';
import { countOf, dayScore, fromDisplayWeight, maxDayScore, signed, TASK_POINTS, tasksDone, toDisplayWeight } from '../scoring';
import { useStore } from '../store';
import { Goal } from '../types';
import { cVar, goalColor, ProgressBar } from '../ui';

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

interface Props {
  day: Date;
  setDay: (d: Date) => void;
  onEdit: (g: Goal | null) => void;
  /** Jump to the backup settings. */
  onOpenBackup: () => void;
  /** Open the Weight tab. */
  onOpenWeight: () => void;
}

export function TodayView({ day, setDay, onEdit, onOpenBackup, onOpenWeight }: Props) {
  const { state, dispatch } = useStore();
  const [nudge, setNudge] = useState(() => backupDue(state));
  const now = today();
  const key = toKey(day);
  const todayKey = toKey(now);
  const isToday = key === todayKey;
  const isFuture = key > todayKey;
  const active = state.goals.filter((g) => !g.archived);
  const good = active.filter((g) => g.kind === 'good');
  const bad = active.filter((g) => g.kind === 'bad');
  const tasks = state.tasks[key] ?? [];

  const score = dayScore(state, key);
  const possible = maxDayScore(state.goals) + tasks.length * TASK_POINTS;
  const done = good.filter((g) => countOf(state, key, g.id) >= g.perDay).length + tasksDone(state, key);
  const total = good.length + tasks.length;
  const mood: Mood = score > 0 ? 'happy' : score < 0 ? 'sad' : 'neutral';

  const relative = isToday ? 'Today' : key === toKey(addDays(now, -1)) ? 'Yesterday' : key === toKey(addDays(now, 1)) ? 'Tomorrow' : null;
  const dateText = `${relative ? WEEKDAYS[day.getDay()] + ', ' : ''}${MONTHS[day.getMonth()]} ${day.getDate()}`;

  return (
    <>
      <div className="day-nav">
        <button className="icon-btn" aria-label="Previous day" onClick={() => setDay(addDays(day, -1))}>
          <Icon name="left" />
        </button>
        <div className="title">
          <h1>{relative ?? WEEKDAYS[day.getDay()]}</h1>
          <div className="sub">
            {dateText}
            {!isToday && (
              <>
                {' · '}
                <button className="link" onClick={() => setDay(now)}>Back to today</button>
              </>
            )}
          </div>
        </div>
        <button className="icon-btn" aria-label="Next day" onClick={() => setDay(addDays(day, 1))}>
          <Icon name="right" />
        </button>
      </div>

      {nudge && (
        <div className="nudge" role="note">
          <span className="muted"><Icon name="download" size={20} /></span>
          <span className="grow">Your data is only on this device. Save a backup?</span>
          <button className="link" onClick={onOpenBackup}>Back up</button>
          <button className="icon-btn" aria-label="Remind me later" onClick={() => { snoozeBackup(); setNudge(false); }}>
            <Icon name="x" size={18} />
          </button>
        </div>
      )}

      <div className="day-layout">
        <div>
          <section className={`hero${isToday ? ' is-today' : ''}`} aria-label="Day score">
            <Face mood={mood} size={60} color={score > 0 ? 'var(--good)' : score < 0 ? 'var(--bad)' : 'var(--muted)'} filled={score !== 0} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="label">{isToday ? "TODAY'S SCORE" : 'DAY SCORE'}</div>
              <div className={`score${score < 0 ? ' neg' : ''}`}>{signed(score)}</div>
              <ProgressBar ratio={possible ? Math.max(0, score) / possible : 0} />
              <div className="meta">
                {total ? `${done} of ${total} goals done · ` : ''}
                {possible} possible
              </div>
            </div>
          </section>

          {good.length > 0 && <h2 className="section-label">Goals</h2>}
          {good.map((g) => (
            <GoalRow key={`${g.id}-${key}`} goal={g} date={key} locked={isFuture} onEdit={() => onEdit(g)} />
          ))}

          {bad.length > 0 && <h2 className="section-label">Habits to avoid</h2>}
          {bad.map((g) => (
            <GoalRow key={`${g.id}-${key}`} goal={g} date={key} locked={isFuture} onEdit={() => onEdit(g)} />
          ))}

          {active.length === 0 && (
            <p className="muted" style={{ textAlign: 'center', margin: '20px 0' }}>
              Add something you want to do every day, or a habit you want to drop.
            </p>
          )}
          <button className="btn ghost block" style={{ margin: '6px 0 18px' }} onClick={() => onEdit(null)}>
            <Icon name="plus" size={20} /> Add a daily goal or habit
          </button>
        </div>

        <div className="side">
          <DayGoals date={key} isFuture={isFuture} isToday={isToday} />
          <section className="card" aria-label="Notes">
            <div className="card-title">
              <span>Notes</span>
              <span className="muted"><Icon name="note" size={20} /></span>
            </div>
            <NoteBox key={key} value={state.notes[key] ?? ''} minRows={3} label="Notes for the day"
              placeholder={isToday ? 'How was today? Wins, struggles, anything worth remembering…' : 'Notes for this day…'}
              onSave={(text) => dispatch({ type: 'dayNote', date: key, text })} />
          </section>
          {!isFuture && <WeightCard date={key} onOpenWeight={onOpenWeight} />}
        </div>
      </div>
    </>
  );
}

const fmtNum = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: 2 });

/** Suggest what to write, based on the goal's name. */
function notePrompt(goal: Goal) {
  if (goal.kind === 'bad') return 'What happened? What set it off?';
  if (/hiit|workout|gym|lift|train|crossfit|circuit|yoga|run|swim|bike|cycle/i.test(goal.name))
    return 'Describe the workout: exercises, rounds, times, how it felt…';
  return 'Notes: how did it go?';
}

function GoalRow({ goal, date, locked, onEdit }: { goal: Goal; date: string; locked: boolean; onEdit: () => void }) {
  const { state, dispatch } = useStore();
  const count = countOf(state, date, goal.id);
  const isBad = goal.kind === 'bad';
  const single = goal.perDay === 1;
  const full = count >= goal.perDay;
  const pts = count * goal.points;
  const set = (n: number) => dispatch({ type: 'setCount', date, id: goal.id, n });
  const note = state.goalNotes[date]?.[goal.id] ?? '';
  const amount = state.amounts[date]?.[goal.id];
  const [open, setOpen] = useState(false);
  const hasDetails = !!note || amount !== undefined;

  const detail = isBad
    ? count ? `Happened ${count}× · −${pts} pts` : `Clean so far · −${goal.points} pts each time`
    : single ? (full ? `Done · +${pts} pts` : `+${goal.points} pts`) : `${count} of ${goal.perDay} · +${pts} pts`;

  const cls = ['goal-row', isBad ? 'bad' : '', !isBad && full ? 'done' : '', isBad && count ? 'slipped' : ''].join(' ');
  return (
    <div className={cls} style={cVar(goalColor(goal))}>
      <button className="info" onClick={onEdit} aria-label={`${goal.name}. ${detail}. Edit goal`}>
        <div className="name">{goal.name}</div>
        <div className="detail">{detail}</div>
        {!single && !isBad && (
          <div className="pips" aria-hidden="true">
            {Array.from({ length: goal.perDay }, (_, i) => <span key={i} className={i < count ? 'on' : ''} />)}
          </div>
        )}
        {goal.amountUnit && amount !== undefined && !open && (
          <div className="goal-amount">
            {fmtNum(amount)} {goal.amountTarget ? <span className="of">/ {fmtNum(goal.amountTarget)}</span> : null} {goal.amountUnit}
          </div>
        )}
        {note && !open && <div className="goal-note">{note}</div>}
      </button>

      <button className={`icon-btn note-btn${hasDetails ? ' has-note' : ''}`} aria-expanded={open}
        aria-label={`${hasDetails ? 'Edit' : 'Add'} ${goal.amountUnit ? goal.amountUnit + ' and ' : ''}notes for ${goal.name}`}
        title={goal.amountUnit ? `Log ${goal.amountUnit} and notes` : 'Notes'} onClick={() => setOpen((v) => !v)}>
        <Icon name="note" size={20} />
      </button>

      {single && !isBad ? (
        <button className="check" role="checkbox" aria-checked={full} aria-label={goal.name} disabled={locked}
          onClick={() => set(full ? 0 : 1)}>
          {full && <Icon name="check" size={28} strokeWidth={2.6} />}
        </button>
      ) : (
        <div className="stepper">
          <button className="round" aria-label={`One less: ${goal.name}`} disabled={locked || count === 0} onClick={() => set(count - 1)}>
            <Icon name="minus" />
          </button>
          <span className="n" aria-live="polite">{count}</span>
          <button className="round fill" aria-label={`One more: ${goal.name}`} disabled={locked || full} onClick={() => set(count + 1)}>
            <Icon name="plus" />
          </button>
        </div>
      )}

      {open && (
        <div className="details">
          {goal.amountUnit && (
            <AmountField goal={goal} date={date} value={amount} disabled={locked} autoFocus />
          )}
          <NoteBox value={note} autoFocus={!goal.amountUnit} minRows={2} label={`Notes for ${goal.name}`}
            placeholder={notePrompt(goal)}
            onSave={(text) => dispatch({ type: 'goalNote', date, id: goal.id, text })} />
          <div className="details-foot">
            <button className="link" onClick={() => setOpen(false)}>Done</button>
          </div>
        </div>
      )}
    </div>
  );
}

/** Number field for a goal's daily amount (steps, minutes…). Saves on Enter, blur, or after a pause. */
function AmountField({ goal, date, value, disabled, autoFocus }: { goal: Goal; date: string; value?: number; disabled: boolean; autoFocus?: boolean }) {
  const { dispatch } = useStore();
  const [text, setText] = useState(value !== undefined ? String(value) : '');
  const timer = React.useRef<number | undefined>(undefined);
  useEffect(() => setText(value !== undefined ? String(value) : ''), [value]);

  const commit = (raw = text) => {
    window.clearTimeout(timer.current);
    const n = parseFloat(raw.replace(/,/g, ''));
    const next = raw.trim() === '' ? null : !isNaN(n) && n >= 0 && n < 1e9 ? n : undefined;
    if (next === undefined || next === (value ?? null)) return;
    dispatch({ type: 'amount', date, id: goal.id, value: next });
  };

  const n = parseFloat(text.replace(/,/g, ''));
  const target = goal.kind === 'good' ? goal.amountTarget : undefined;
  return (
    <div>
      <form className="amount-row" onSubmit={(e) => { e.preventDefault(); commit(); }}>
        <span className="weight-field">
          <input className="input" inputMode="decimal" value={text} disabled={disabled} autoFocus={autoFocus}
            placeholder={target ? `Target ${fmtNum(target)}` : '0'} aria-label={`${goal.amountUnit} for ${goal.name}`}
            enterKeyHint="done"
            onChange={(e) => {
              setText(e.target.value);
              window.clearTimeout(timer.current);
              const v = e.target.value;
              timer.current = window.setTimeout(() => commit(v), 700);
            }}
            onBlur={() => commit()} />
          <span className="unit">{goal.amountUnit}</span>
        </span>
      </form>
      {target ? (
        <div style={{ marginTop: 6 }}>
          <div className="amount-bar"><span style={{ width: `${Math.min(100, ((isNaN(n) ? 0 : n) / target) * 100)}%` }} /></div>
          <p className="muted" style={{ fontSize: 12, marginTop: 4 }}>
            {!isNaN(n) && n >= target ? 'Target reached! Checked off.' : `${fmtNum(Math.max(0, target - (isNaN(n) ? 0 : n)))} ${goal.amountUnit} to go`}
          </p>
        </div>
      ) : null}
    </div>
  );
}

/** One-off goals for a single day. Each finished one earns a happy face and +1. */
function DayGoals({ date, isFuture, isToday }: { date: string; isFuture: boolean; isToday: boolean }) {
  const { state, dispatch } = useStore();
  const [text, setText] = useState('');
  const tasks = state.tasks[date] ?? [];
  const done = tasks.filter((x) => x.done).length;
  const allDone = tasks.length > 0 && done === tasks.length;

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    const v = text.trim();
    if (!v) return;
    dispatch({ type: 'addTask', date, text: v });
    setText('');
  };

  return (
    <section className="card" aria-label="Day goals">
      <div className="card-title">
        <span>{isToday ? 'Day goals' : `Day goals · ${shortDate(fromKey(date))}`}</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: done ? 'var(--good)' : 'var(--muted)' }}>
          <Face mood="happy" size={22} color={allDone ? 'var(--good)' : 'var(--muted)'} filled={allDone} />
          {tasks.length > 0 && <b>+{done * TASK_POINTS}</b>}
        </span>
      </div>

      {tasks.length === 0 && (
        <p className="muted" style={{ fontSize: 14, marginBottom: 4 }}>
          One-off goals to get done {isFuture ? 'that day' : 'today'}. Each one you finish earns a happy face and +{TASK_POINTS}.
        </p>
      )}

      {tasks.map((x) => (
        <div key={x.id} className={`task${x.done ? ' done' : ''}`}>
          <button className="task-toggle" role="checkbox" aria-checked={x.done} disabled={isFuture}
            onClick={() => dispatch({ type: 'toggleTask', date, id: x.id })}>
            {x.done ? <Face mood="happy" size={26} color="var(--good)" /> : <span className="empty" />}
            <span className="text">{x.text}</span>
          </button>
          {x.done && <span className="pts">+{TASK_POINTS}</span>}
          <button className="icon-btn" aria-label={`Remove ${x.text}`} onClick={() => dispatch({ type: 'removeTask', date, id: x.id })}>
            <Icon name="x" size={18} />
          </button>
        </div>
      ))}

      {allDone && <p className="cheer">All done. Great day!</p>}

      <form className="add-row" onSubmit={add}>
        <input className="input" value={text} onChange={(e) => setText(e.target.value)} placeholder="Add a goal for the day…"
          maxLength={80} aria-label="New day goal" enterKeyHint="done" />
        <button className="btn" type="submit" aria-label="Add day goal" disabled={!text.trim()}>
          <Icon name="plus" />
        </button>
      </form>
    </section>
  );
}

/** Body weight for a day. Stored in kg, shown in the chosen unit. */
function WeightCard({ date, onOpenWeight }: { date: string; onOpenWeight: () => void }) {
  const { state, dispatch } = useStore();
  const unit = state.unit;
  const saved = state.weights[date];
  const [value, setValue] = useState('');
  useEffect(() => setValue(saved ? String(toDisplayWeight(saved, unit)) : ''), [saved, unit, date]);

  const prevKey = Object.keys(state.weights).filter((k) => k < date).sort().pop();
  const trend = weightSeries(state.weights).filter((p) => p.key <= date).pop();
  const diff = saved && prevKey ? Math.round((toDisplayWeight(saved, unit) - toDisplayWeight(state.weights[prevKey], unit)) * 10) / 10 : null;
  const parsed = parseFloat(value.replace(',', '.'));
  const valid = !isNaN(parsed) && parsed > 0 && parsed < 1000;
  const dirty = valid && (!saved || Math.abs(toDisplayWeight(saved, unit) - parsed) > 0.001);

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (dirty) dispatch({ type: 'weight', date, kg: fromDisplayWeight(parsed, unit) });
  };

  return (
    <section className="card" aria-label="Weight">
      <div className="card-title">
        <span>Weight</span>
        <span className="muted"><Icon name="scale" size={20} /></span>
      </div>
      <form className="weight-row" onSubmit={save}>
        <div className="weight-field">
          <input className="input" inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)}
            placeholder="0.0" aria-label={`Weight in ${unit}`} enterKeyHint="done" />
          <span className="unit">{unit}</span>
        </div>
        <button className="btn" type="submit" disabled={!dirty}>{saved ? 'Update' : 'Save'}</button>
        {saved !== undefined && (
          <button type="button" className="icon-btn" aria-label="Delete weight entry" onClick={() => dispatch({ type: 'weight', date, kg: null })}>
            <Icon name="trash" size={20} />
          </button>
        )}
      </form>
      {diff !== null && prevKey && (
        <p className="muted" style={{ fontSize: 13, marginTop: 8, fontWeight: 600 }}>
          {diff > 0 ? '▲ +' : diff < 0 ? '▼ ' : ''}{diff} {unit} since {shortDate(fromKey(prevKey))}
        </p>
      )}
      {trend && (
        <p style={{ fontSize: 14, marginTop: 8 }}>
          Trend <b>{fmtW(trend.trendKg, unit)} {unit}</b>{' '}
          <button className="link" onClick={onOpenWeight}>See chart →</button>
        </p>
      )}
    </section>
  );
}
