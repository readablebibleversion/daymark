import React, { useState } from 'react';
import { Icon } from '../icons';
import { useStore } from '../store';
import { Goal, ThemePref, WeightUnit } from '../types';
import { cVar, goalColor, Segmented } from '../ui';

export function GoalsView({ onEdit }: { onEdit: (g: Goal | null) => void }) {
  const { state, dispatch } = useStore();
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const active = state.goals.filter((g) => !g.archived);
  const archived = state.goals.filter((g) => g.archived);

  const row = (g: Goal, i: number, list: Goal[]) => (
    <div key={g.id} className="manage-row" style={cVar(goalColor(g))}>
      <span className="stripe" />
      <div className="meta">
        <b style={g.archived ? { color: 'var(--muted)' } : undefined}>{g.name}</b>
        <small>
          {g.kind === 'bad' ? 'Habit to drop · −' : 'Goal · +'}{g.points} pt{g.perDay > 1 ? ` · up to ${g.perDay}×/day` : ''}
        </small>
      </div>
      {g.archived ? (
        <>
          <button className="icon-btn" aria-label={`Restore ${g.name}`} title="Restore" onClick={() => dispatch({ type: 'archive', id: g.id, archived: false })}>
            <Icon name="undo" size={20} />
          </button>
          <button className="icon-btn danger" title={confirmDelete === g.id ? 'Tap again to delete' : 'Delete'}
            aria-label={confirmDelete === g.id ? `Confirm delete ${g.name}` : `Delete ${g.name}`}
            onClick={() => {
              if (confirmDelete === g.id) { dispatch({ type: 'delete', id: g.id }); setConfirmDelete(null); }
              else setConfirmDelete(g.id);
            }}>
            {confirmDelete === g.id ? <b style={{ fontSize: 12 }}>Sure?</b> : <Icon name="trash" size={20} />}
          </button>
        </>
      ) : (
        <>
          <button className="icon-btn" aria-label={`Move ${g.name} up`} disabled={i === 0} onClick={() => dispatch({ type: 'move', id: g.id, dir: -1 })}>
            <Icon name="up" size={20} />
          </button>
          <button className="icon-btn" aria-label={`Move ${g.name} down`} disabled={i === list.length - 1} onClick={() => dispatch({ type: 'move', id: g.id, dir: 1 })}>
            <Icon name="down" size={20} />
          </button>
          <button className="icon-btn" aria-label={`Edit ${g.name}`} onClick={() => onEdit(g)}>
            <Icon name="edit" size={20} />
          </button>
          <button className="icon-btn" aria-label={`Archive ${g.name}`} title="Archive" onClick={() => dispatch({ type: 'archive', id: g.id, archived: true })}>
            <Icon name="archive" size={20} />
          </button>
        </>
      )}
    </div>
  );

  return (
    <>
      <section className="card" style={{ marginTop: 8 }}>
        <div className="card-title">Daily goals &amp; habits ({active.length})</div>
        {active.length ? active.map(row) : <p className="muted">Nothing yet.</p>}
        <button className="btn block" style={{ marginTop: 12 }} onClick={() => onEdit(null)}>
          <Icon name="plus" size={20} /> New goal or habit
        </button>
      </section>

      {archived.length > 0 && (
        <section className="card">
          <div className="card-title">Archived ({archived.length})</div>
          <p className="muted" style={{ fontSize: 13, marginBottom: 6 }}>
            Archived items keep their history and still count in past scores. Deleting removes them and their checks for good.
          </p>
          {archived.map(row)}
        </section>
      )}

      <section className="card">
        <div className="card-title">Settings</div>
        <span className="field-label" style={{ marginTop: 0 }}>Appearance</span>
        <Segmented<ThemePref> label="Appearance" value={state.theme} onChange={(theme) => dispatch({ type: 'theme', theme })}
          options={[{ value: 'system', label: 'System' }, { value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }]} />
        <span className="field-label">Weight unit</span>
        <Segmented<WeightUnit> label="Weight unit" value={state.unit} onChange={(unit) => dispatch({ type: 'unit', unit })}
          options={[{ value: 'kg', label: 'Kilograms' }, { value: 'lb', label: 'Pounds' }]} />
      </section>

      <section className="card">
        <div className="card-title">How scoring works</div>
        <p className="muted" style={{ lineHeight: 1.55 }}>
          Each check on a goal adds its points. Each time a habit you&apos;re dropping happens, its points come off. Each day goal you
          finish adds +1 and a happy face. Your day&apos;s score is the sum, and the week score adds up all seven days. Streaks count
          days you hit a goal&apos;s daily target, or days a habit stayed clean.
        </p>
      </section>
      <p className="muted" style={{ textAlign: 'center', fontSize: 13 }}>Your data is stored only on this device.</p>
    </>
  );
}
