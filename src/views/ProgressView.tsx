import React from 'react';
import { addDays, DAY_SHORT, formatWeek, startOfWeek, toKey, today, weekDays } from '../date';
import { Icon } from '../icons';
import { bestStreak, currentStreak, dayKept, dayScore, earliestDate, signed, toDisplayWeight, weekScore } from '../scoring';
import { useStore } from '../store';
import { BarChart, cVar, goalColor, LineChart, ProgressBar } from '../ui';

export function ProgressView({ weekStart }: { weekStart: Date }) {
  const { state } = useStore();
  const now = today();
  const todayKey = toKey(now);
  const days = weekDays(weekStart);
  const thisWeek = toKey(startOfWeek(now));
  const active = state.goals.filter((g) => !g.archived);

  const daily = days.map((d, i) => ({ label: DAY_SHORT[i], value: dayScore(state, toKey(d)), highlight: toKey(d) === todayKey }));
  const weeks = Array.from({ length: 8 }, (_, i) => addDays(weekStart, -7 * (7 - i)));
  const weekly = weeks.map((w) => ({ label: `${w.getMonth() + 1}/${w.getDate()}`, value: weekScore(state, w), highlight: toKey(w) === thisWeek }));
  const elapsed = days.filter((d) => toKey(d) <= todayKey);
  const avg = Math.round(weekly.reduce((s, w) => s + w.value, 0) / weekly.length);

  return (
    <>
      <p className="muted" style={{ textAlign: 'center', margin: '6px 0 14px', fontSize: 14 }}>{formatWeek(weekStart)}</p>
      <div className="stats three">
        <div className="stat"><div className="k">This week</div><div className="v">{signed(weekly[7].value)}</div></div>
        <div className="stat"><div className="k">8-wk avg</div><div className="v">{signed(avg)}</div></div>
        <div className="stat"><div className="k">Today</div><div className="v">{signed(dayScore(state, todayKey))}</div></div>
      </div>

      <div className="progress-layout">
        <section className="card"><div className="card-title">Daily score</div><BarChart data={daily} /></section>
        <section className="card"><div className="card-title">Last 8 weeks</div><BarChart data={weekly} /></section>
      </div>

      <WeightProgress />

      <section className="card">
        <div className="card-title">Streaks</div>
        {active.length === 0 && <p className="muted">Add some goals to see streaks.</p>}
        {active.map((g, i) => {
          const cur = currentStreak(state, g, now);
          const best = bestStreak(state, g, now);
          const since = earliestDate(state, g);
          const tracked = elapsed.filter((d) => d >= since);
          const kept = tracked.filter((d) => dayKept(state, g, toKey(d))).length;
          return (
            <div key={g.id} style={{ ...cVar(goalColor(g)), paddingTop: i ? 12 : 0, marginTop: i ? 12 : 0, borderTop: i ? '1px solid var(--border)' : 0 }}>
              <div className="streak-row">
                <span className="dot" />
                <span className="nm">{g.name}</span>
                <span className="val" style={{ color: cur ? 'var(--accent)' : 'var(--muted)' }}>
                  <Icon name={g.kind === 'bad' ? 'shield' : 'flame'} size={18} />
                  <span style={{ color: 'var(--text)' }}>{cur}d</span>
                </span>
              </div>
              <ProgressBar ratio={tracked.length ? kept / tracked.length : 0} />
              <p className="muted" style={{ fontSize: 13, marginTop: 6 }}>
                {g.kind === 'bad' ? 'Clean' : 'Target met'} {kept}/{tracked.length} days this week · best streak {best}d
              </p>
            </div>
          );
        })}
      </section>
    </>
  );
}

function WeightProgress() {
  const { state } = useStore();
  const unit = state.unit;
  const keys = Object.keys(state.weights).sort().slice(-30);
  const pts = keys.map((k) => ({ label: `${Number(k.slice(5, 7))}/${Number(k.slice(8))}`, value: toDisplayWeight(state.weights[k], unit) }));
  const first = pts[0]?.value;
  const last = pts[pts.length - 1]?.value;
  const change = pts.length > 1 ? Math.round((last - first) * 10) / 10 : null;
  return (
    <section className="card">
      <div className="card-title">
        <span>Weight</span>
        {pts.length > 0 && <span className="muted" style={{ fontSize: 12, fontWeight: 500 }}>last {pts.length} entries</span>}
      </div>
      {pts.length === 0 ? (
        <p className="muted">Log your weight on the Today tab to see a trend here.</p>
      ) : (
        <>
          <div className="mini-stats">
            <div><div className="k">Latest</div><div className="v">{last} {unit}</div></div>
            <div><div className="k">Change</div><div className="v">{change === null ? '—' : `${change > 0 ? '+' : ''}${change} ${unit}`}</div></div>
            <div><div className="k">Lowest</div><div className="v">{Math.min(...pts.map((p) => p.value))} {unit}</div></div>
          </div>
          {pts.length > 1 && <LineChart data={pts} />}
        </>
      )}
    </section>
  );
}
