import React, { useEffect, useMemo, useState } from 'react';
import { DAY_SHORT, MONTHS, shortDate, toKey, today } from '../date';
import { Icon } from '../icons';
import { useStore } from '../store';
import { WeightUnit } from '../types';
import { Segmented, useWidth } from '../ui';
import { fmtW, kgTo, milestones, projectGoalDate, toKg, weeklyRate, WeighIn, weightSeries } from '../weight';

type Range = '1m' | '3m' | '6m' | '1y' | 'all';
const RANGE_DAYS: Record<Range, number> = { '1m': 30, '3m': 91, '6m': 182, '1y': 365, all: Infinity };
const DAY = 86_400_000;

const longDate = (d: Date) => `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
const dayLabel = (d: Date) => `${DAY_SHORT[(d.getDay() + 6) % 7]}, ${shortDate(d)}`;

export function WeightView() {
  const { state } = useStore();
  const unit = state.unit;
  const series = useMemo(() => weightSeries(state.weights), [state.weights]);
  const [range, setRange] = useState<Range>('3m');
  const last = series[series.length - 1];
  const rate = useMemo(() => weeklyRate(series), [series]);
  const goal = state.weightGoal;
  const losing = goal ? goal.goalKg < (goal.startKg ?? series[0]?.kg ?? goal.goalKg) : true;

  const now = today();
  const startTime = range === 'all' ? (series[0]?.date.getTime() ?? now.getTime()) : now.getTime() - RANGE_DAYS[range] * DAY;
  const visible = series.filter((p) => p.date.getTime() >= startTime);
  const first = visible[0];
  const rangeChange = first && last && visible.length > 1 ? last.trendKg - first.trendKg : null;

  return (
    <>
      <section className="weight-hero" aria-label="Current weight">
        <div>
          <div className="label">TREND WEIGHT</div>
          <div className="big">
            {last ? fmtW(last.trendKg, unit) : '—'}
            <span className="u">{unit}</span>
          </div>
          <div className="sub">
            {last ? <>Last weigh-in {fmtW(last.kg, unit)} {unit} · {shortDate(last.date)}</> : 'No weigh-ins yet'}
          </div>
        </div>
        {rate !== null && (
          <div className={`rate ${(rate < 0) === losing ? 'good' : 'bad'}`}>
            <span className="arrow">{rate < 0 ? '▼' : '▲'}</span>
            {Math.abs(kgTo(rate, unit)).toFixed(1)}
            <small>{unit}/week</small>
          </div>
        )}
      </section>
      <p className="muted explain">
        Your trend smooths out day-to-day swings from water, salt and food, so you can see where your weight is really heading.
      </p>

      <div className="weight-layout">
        <div>
          <EntryForm />

          <section className="card" aria-label="Weight chart">
            <div className="card-title">
              <span>Chart</span>
            </div>
            <Segmented<Range> label="Chart range" value={range} onChange={setRange}
              options={[{ value: '1m', label: '1M' }, { value: '3m', label: '3M' }, { value: '6m', label: '6M' }, { value: '1y', label: '1Y' }, { value: 'all', label: 'All' }]} />
            <WeightChart points={visible} unit={unit} goalKg={goal?.goalKg} losing={losing}
              from={new Date(startTime)} to={now} />
            {visible.length > 1 && (
              <div className="mini-stats" style={{ marginTop: 12, marginBottom: 0 }}>
                <div><div className="k">Change</div><div className="v">{rangeChange === null ? '—' : `${rangeChange > 0 ? '+' : ''}${fmtW(rangeChange, unit)}`}</div></div>
                <div><div className="k">Lowest</div><div className="v">{fmtW(Math.min(...visible.map((p) => p.kg)), unit)}</div></div>
                <div><div className="k">Weigh-ins</div><div className="v">{visible.length}</div></div>
              </div>
            )}
          </section>
        </div>

        <div>
          <GoalCard series={series} rate={rate} />
          <History series={series} />
        </div>
      </div>
    </>
  );
}

function EntryForm() {
  const { state, dispatch } = useStore();
  const unit = state.unit;
  const todayKey = toKey(today());
  const [date, setDate] = useState(todayKey);
  const saved = state.weights[date];
  const [value, setValue] = useState('');
  useEffect(() => setValue(saved ? fmtW(saved, unit) : ''), [saved, unit, date]);

  const parsed = parseFloat(value.replace(',', '.'));
  const valid = !isNaN(parsed) && parsed > 0 && parsed < 1500 && date <= todayKey;
  const dirty = valid && (!saved || fmtW(saved, unit) !== parsed.toFixed(1));

  return (
    <section className="card" aria-label="Log weight" id="weigh-in">
      <div className="card-title">
        <span>Weigh in</span>
        <span className="muted"><Icon name="scale" size={20} /></span>
      </div>
      <form className="weigh-form" onSubmit={(e) => {
        e.preventDefault();
        if (dirty) dispatch({ type: 'weight', date, kg: toKg(parsed, unit) });
      }}>
        <input className="input" type="date" value={date} max={todayKey} aria-label="Date"
          onChange={(e) => e.target.value && setDate(e.target.value)} />
        <div className="weight-field">
          <input className="input" inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)}
            placeholder="0.0" aria-label={`Weight in ${unit}`} enterKeyHint="done" />
          <span className="unit">{unit}</span>
        </div>
        <button className="btn" type="submit" disabled={!dirty}>{saved ? 'Update' : 'Save'}</button>
      </form>
    </section>
  );
}

/** Weigh-ins as dots, the trend as a line, a stem from each dot to the trend, and the goal as a dashed line. */
function WeightChart({
  points, unit, goalKg, losing, from, to,
}: { points: WeighIn[]; unit: WeightUnit; goalKg?: number; losing: boolean; from: Date; to: Date }) {
  const [ref, w] = useWidth<HTMLDivElement>();
  const h = 230, padL = 42, padR = 12, top = 14, bottom = 26;

  if (points.length < 2) {
    return (
      <div ref={ref} style={{ marginTop: 14 }}>
        <div className="chart-empty">
          {points.length === 0 ? 'No weigh-ins in this range yet.' : 'Log at least two weigh-ins to see your trend.'}
        </div>
      </div>
    );
  }

  const vals = points.flatMap((p) => [kgTo(p.kg, unit), kgTo(p.trendKg, unit)]);
  const goal = goalKg !== undefined ? kgTo(goalKg, unit) : undefined;
  let lo = Math.min(...vals), hi = Math.max(...vals);
  // Show the goal line when it's reasonably close; otherwise it would flatten the chart.
  const showGoal = goal !== undefined && goal >= lo - (hi - lo + 4) && goal <= hi + (hi - lo + 4);
  if (showGoal && goal !== undefined) { lo = Math.min(lo, goal); hi = Math.max(hi, goal); }
  const steps = [0.5, 1, 2, 5, 10, 20, 50];
  const tick = steps.find((s) => (hi - lo) / s <= 4) ?? 50;
  lo = Math.floor(lo / tick) * tick;
  hi = Math.ceil(hi / tick) * tick;
  if (hi === lo) hi = lo + tick;
  const ticks: number[] = [];
  for (let v = lo; v <= hi + 1e-9; v += tick) ticks.push(v);

  // Start at the range start, or at the first weigh-in if the data begins later (no empty left edge).
  const t0 = Math.max(from.getTime(), points[0].date.getTime() - DAY);
  const t1 = Math.max(to.getTime(), points[points.length - 1].date.getTime());
  const x = (d: Date) => padL + ((d.getTime() - t0) / (t1 - t0 || 1)) * (w - padL - padR);
  const y = (v: number) => top + (1 - (v - lo) / (hi - lo)) * (h - top - bottom);
  const trendPath = points.map((p, i) => `${i ? 'L' : 'M'}${x(p.date).toFixed(1)},${y(kgTo(p.trendKg, unit)).toFixed(1)}`).join(' ');
  const mid = new Date((t0 + t1) / 2);
  const fmtAxis = (v: number) => (tick < 1 ? v.toFixed(1) : String(Math.round(v)));
  const lastP = points[points.length - 1];

  return (
    <div ref={ref} style={{ marginTop: 14 }}>
      {w > 0 && (
        <svg className="chart" width={w} height={h} role="img"
          aria-label={`Trend from ${fmtW(points[0].trendKg, unit)} to ${fmtW(lastP.trendKg, unit)} ${unit}`}>
          {ticks.map((v) => (
            <g key={v}>
              <line x1={padL} x2={w - padR} y1={y(v)} y2={y(v)} stroke="var(--border)" />
              <text x={padL - 6} y={y(v) + 4} textAnchor="end">{fmtAxis(v)}</text>
            </g>
          ))}
          {showGoal && goal !== undefined && (
            <g>
              <line x1={padL} x2={w - padR} y1={y(goal)} y2={y(goal)} stroke="var(--good)" strokeWidth={1.5} strokeDasharray="5 4" />
              <text x={w - padR} y={y(goal) - 5} textAnchor="end" style={{ fill: 'var(--good)', fontWeight: 700 }}>Goal</text>
            </g>
          )}
          {points.map((p) => {
            const above = p.kg > p.trendKg;
            const good = above !== losing;
            return (
              <line key={`s${p.key}`} x1={x(p.date)} x2={x(p.date)} y1={y(kgTo(p.kg, unit))} y2={y(kgTo(p.trendKg, unit))}
                stroke={good ? 'var(--good)' : 'var(--bad)'} strokeOpacity={0.45} strokeWidth={1.5} />
            );
          })}
          <path d={trendPath} fill="none" stroke="var(--ink)" strokeWidth={6.5} strokeLinejoin="round" strokeLinecap="round" />
          <path d={trendPath} fill="none" stroke="var(--accent)" strokeWidth={3.5} strokeLinejoin="round" strokeLinecap="round" />
          {points.map((p) => (
            <circle key={`d${p.key}`} cx={x(p.date)} cy={y(kgTo(p.kg, unit))} r={3.2} fill="var(--card)" stroke="var(--ink)" strokeWidth={1.6} />
          ))}
          <circle cx={x(lastP.date)} cy={y(kgTo(lastP.trendKg, unit))} r={6.5} fill="var(--accent)" stroke="var(--ink)" strokeWidth={2.5} />
          <text x={padL} y={h - 6}>{shortDate(new Date(t0))}</text>
          <text x={(padL + w - padR) / 2} y={h - 6} textAnchor="middle">{shortDate(mid)}</text>
          <text x={w - padR} y={h - 6} textAnchor="end">{shortDate(new Date(t1))}</text>
        </svg>
      )}
      <div className="legend">
        <span><i className="sw trend" /> Trend</span>
        <span><i className="sw dot" /> Weigh-in</span>
        {showGoal && <span><i className="sw goal" /> Goal</span>}
      </div>
    </div>
  );
}

function GoalCard({ series, rate }: { series: WeighIn[]; rate: number | null }) {
  const { state, dispatch } = useStore();
  const unit = state.unit;
  const goal = state.weightGoal;
  const [editing, setEditing] = useState(!goal);
  const [goalVal, setGoalVal] = useState('');
  const [startVal, setStartVal] = useState('');

  useEffect(() => {
    setGoalVal(goal ? fmtW(goal.goalKg, unit) : '');
    setStartVal(goal?.startKg ? fmtW(goal.startKg, unit) : '');
  }, [goal, unit, editing]);

  const last = series[series.length - 1];
  const startKg = goal?.startKg ?? series[0]?.kg;

  if (editing || !goal) {
    const g = parseFloat(goalVal.replace(',', '.'));
    const s = startVal.trim() ? parseFloat(startVal.replace(',', '.')) : undefined;
    const valid = !isNaN(g) && g > 0 && g < 1500 && (s === undefined || (!isNaN(s) && s > 0 && s < 1500));
    return (
      <section className="card" aria-label="Weight goal">
        <div className="card-title">
          <span>{goal ? 'Edit goal' : 'Set a goal'}</span>
          <span className="muted"><Icon name="target" size={20} /></span>
        </div>
        <form onSubmit={(e) => {
          e.preventDefault();
          if (!valid) return;
          dispatch({ type: 'weightGoal', goal: { goalKg: toKg(g, unit), startKg: s !== undefined ? toKg(s, unit) : undefined } });
          setEditing(false);
        }}>
          <div className="two">
            <label>
              <span className="field-label" style={{ marginTop: 0 }}>Goal weight</span>
              <span className="weight-field">
                <input className="input" inputMode="decimal" value={goalVal} onChange={(e) => setGoalVal(e.target.value)} placeholder="0.0" />
                <span className="unit">{unit}</span>
              </span>
            </label>
            <label>
              <span className="field-label" style={{ marginTop: 0 }}>Start weight</span>
              <span className="weight-field">
                <input className="input" inputMode="decimal" value={startVal} onChange={(e) => setStartVal(e.target.value)}
                  placeholder={series[0] ? fmtW(series[0].kg, unit) : '0.0'} />
                <span className="unit">{unit}</span>
              </span>
            </label>
          </div>
          <p className="muted" style={{ fontSize: 13, margin: '8px 0 12px' }}>Leave start empty to use your first weigh-in.</p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn" type="submit" disabled={!valid}>Save goal</button>
            {goal && <button type="button" className="btn plain" onClick={() => setEditing(false)}>Cancel</button>}
            {goal && (
              <button type="button" className="btn plain" style={{ marginLeft: 'auto' }}
                onClick={() => { dispatch({ type: 'weightGoal', goal: null }); setEditing(true); }}>
                Remove
              </button>
            )}
          </div>
        </form>
      </section>
    );
  }

  const current = last?.trendKg;
  const total = startKg !== undefined ? startKg - goal.goalKg : 0;
  const done = startKg !== undefined && current !== undefined && total ? (startKg - current) / total : 0;
  const pct = Math.max(0, Math.min(1, done));
  const toGo = current !== undefined ? Math.abs(current - goal.goalKg) : undefined;
  const reached = current !== undefined && (total > 0 ? current <= goal.goalKg : current >= goal.goalKg);
  const marks = startKg !== undefined ? milestones(startKg, goal.goalKg, unit) : [];
  const next = current !== undefined ? marks.find((m) => (total > 0 ? m < current : m > current)) : undefined;
  const eta = current !== undefined ? projectGoalDate(current, goal.goalKg, rate, today()) : null;

  return (
    <section className="card" aria-label="Weight goal">
      <div className="card-title">
        <span>Goal: {fmtW(goal.goalKg, unit)} {unit}</span>
        <button className="icon-btn" aria-label="Edit goal" onClick={() => setEditing(true)}><Icon name="edit" size={18} /></button>
      </div>
      {current === undefined || startKg === undefined ? (
        <p className="muted">Log a weigh-in to start tracking toward your goal.</p>
      ) : (
        <>
          <div className="goal-bar" role="progressbar" aria-valuenow={Math.round(pct * 100)} aria-valuemin={0} aria-valuemax={100}>
            <span className="fill" style={{ width: `${pct * 100}%` }} />
            {marks.map((m) => (
              <span key={m} className={`tick${(total > 0 ? m >= current : m <= current) ? ' passed' : ''}`}
                style={{ left: `${((startKg - m) / total) * 100}%` }} />
            ))}
          </div>
          <div className="goal-ends">
            <span>{fmtW(startKg, unit)}</span>
            <b>{Math.round(pct * 100)}%</b>
            <span>{fmtW(goal.goalKg, unit)}</span>
          </div>
          {reached ? (
            <p className="goal-line good"><Icon name="check" size={18} /> You've reached your goal. Nice work!</p>
          ) : (
            <>
              <p className="goal-line"><b>{fmtW(toGo!, unit)} {unit}</b> to go{next !== undefined && <> · next milestone <b>{fmtW(next, unit)}</b></>}</p>
              <p className="goal-line muted">
                {eta ? <>At this pace you'll get there around <b style={{ color: 'var(--text)' }}>{longDate(eta)}</b>.</>
                  : rate === null ? 'Keep weighing in. A projected date appears after about a week.'
                  : 'Your trend isn’t heading toward your goal right now.'}
              </p>
            </>
          )}
        </>
      )}
    </section>
  );
}

function History({ series }: { series: WeighIn[] }) {
  const { state, dispatch } = useStore();
  const unit = state.unit;
  const [all, setAll] = useState(false);
  const [confirm, setConfirm] = useState<string | null>(null);
  const rows = [...series].reverse();
  const shown = all ? rows : rows.slice(0, 10);
  if (!rows.length) return null;
  return (
    <section className="card" aria-label="Weigh-in history">
      <div className="card-title">History</div>
      <ul className="history">
        {shown.map((p, i) => {
          const prev = rows[i + 1];
          const diff = prev ? kgTo(p.kg, unit) - kgTo(prev.kg, unit) : null;
          return (
            <li key={p.key}>
              <span className="d">{dayLabel(p.date)}{p.date.getFullYear() !== today().getFullYear() ? ` ${p.date.getFullYear()}` : ''}</span>
              <span className="w">{fmtW(p.kg, unit)}</span>
              <span className={`delta${diff === null ? '' : diff < 0 ? ' down' : diff > 0 ? ' up' : ''}`}>
                {diff === null ? '' : `${diff > 0 ? '+' : diff < 0 ? '−' : '±'}${Math.abs(diff).toFixed(1)}`}
              </span>
              <span className="t muted">trend {fmtW(p.trendKg, unit)}</span>
              <button className="icon-btn danger" aria-label={confirm === p.key ? `Confirm delete ${p.key}` : `Delete weigh-in ${p.key}`}
                onClick={() => {
                  if (confirm === p.key) { dispatch({ type: 'weight', date: p.key, kg: null }); setConfirm(null); }
                  else setConfirm(p.key);
                }}>
                {confirm === p.key ? <b style={{ fontSize: 12 }}>Sure?</b> : <Icon name="trash" size={18} />}
              </button>
            </li>
          );
        })}
      </ul>
      {rows.length > 10 && (
        <button className="link" onClick={() => setAll((v) => !v)}>{all ? 'Show less' : `Show all ${rows.length}`}</button>
      )}
    </section>
  );
}

