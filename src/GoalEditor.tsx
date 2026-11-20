import React, { useEffect, useRef, useState } from 'react';
import { useStore } from './store';
import { Goal, GoalKind } from './types';
import { cVar, GOAL_COLORS, NumStepper, Segmented } from './ui';

/** Add/edit sheet built on <dialog>: bottom sheet on phones, centred on wider screens. */
export function GoalEditor({ open, goal, onClose }: { open: boolean; goal: Goal | null; onClose: () => void }) {
  const { dispatch } = useStore();
  const ref = useRef<HTMLDialogElement>(null);
  const [name, setName] = useState('');
  const [kind, setKind] = useState<GoalKind>('good');
  const [points, setPoints] = useState(1);
  const [perDay, setPerDay] = useState(1);
  const [color, setColor] = useState(GOAL_COLORS[0]);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      setName(goal?.name ?? '');
      setKind(goal?.kind ?? 'good');
      setPoints(goal?.points ?? 1);
      setPerDay(goal?.perDay ?? 1);
      setColor(goal?.color ?? GOAL_COLORS[0]);
      d.showModal();
    } else if (!open && d.open) d.close();
  }, [open, goal]);

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    const data = { name: name.trim(), kind, points, perDay, color };
    if (!data.name) return;
    if (goal) dispatch({ type: 'updateGoal', id: goal.id, patch: data });
    else dispatch({ type: 'addGoal', goal: data });
    onClose();
  };

  return (
    <dialog ref={ref} className="sheet" onClose={onClose} aria-labelledby="editor-title"
      onClick={(e) => { if (e.target === ref.current) onClose(); /* tap on backdrop */ }}>
      <form className="sheet-body" onSubmit={save}>
        <h2 id="editor-title">{goal ? 'Edit' : 'New'} {kind === 'bad' ? 'habit to drop' : 'daily goal'}</h2>

        <span className="field-label">Type</span>
        <Segmented<GoalKind> label="Type" value={kind}
          onChange={(k) => { setKind(k); if (k === 'bad' && !goal) setColor(GOAL_COLORS[6]); }}
          options={[{ value: 'good', label: 'Goal to do  +' }, { value: 'bad', label: 'Habit to drop  −' }]} />

        <label className="field-label" htmlFor="goal-name">Name</label>
        <input id="goal-name" className="input" value={name} onChange={(e) => setName(e.target.value)} maxLength={60}
          placeholder={kind === 'bad' ? 'e.g. Doomscrolling in bed' : 'e.g. Walk 10,000 steps'} autoComplete="off" />

        <div className="two">
          <div>
            <span className="field-label">{kind === 'bad' ? 'Points lost' : 'Points'}</span>
            <NumStepper label="points" value={points} min={1} max={10} onChange={setPoints} />
          </div>
          <div>
            <span className="field-label">{kind === 'bad' ? 'Max per day' : 'Times per day'}</span>
            <NumStepper label="times per day" value={perDay} min={1} max={12} onChange={setPerDay} />
          </div>
        </div>

        {kind === 'good' && (
          <>
            <span className="field-label">Colour</span>
            <div className="swatches">
              {GOAL_COLORS.map((c) => (
                <button key={c} type="button" className="swatch" style={cVar(c)} aria-pressed={c === color} aria-label={`Colour ${c}`} onClick={() => setColor(c)} />
              ))}
            </div>
          </>
        )}

        <p className="muted" style={{ fontSize: 14, marginTop: 16 }}>
          {kind === 'good'
            ? `Each check adds ${points} point${points > 1 ? 's' : ''}${perDay > 1 ? `; do it ${perDay} times for the full ${points * perDay}` : ''}.`
            : `Each time it happens you lose ${points} point${points > 1 ? 's' : ''}.`}
        </p>

        <div className="sheet-actions">
          {goal && (
            <button type="button" className="btn plain" onClick={() => { dispatch({ type: 'archive', id: goal.id, archived: true }); onClose(); }}>
              Archive
            </button>
          )}
          <span className="spacer" />
          <button type="button" className="btn plain" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn" disabled={!name.trim()}>Save</button>
        </div>
      </form>
    </dialog>
  );
}
