import React, { useRef, useState } from 'react';
import { exportBackup, lastBackup, parseBackup, ParsedBackup, trackedDays } from '../backup';
import { MONTHS } from '../date';
import { Icon } from '../icons';
import { useStore } from '../store';

const fmt = (d: Date) => `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;

export function BackupCard() {
  const { state, dispatch } = useStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [last, setLast] = useState(lastBackup);
  const [pending, setPending] = useState<ParsedBackup | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const save = async () => {
    setMsg(null);
    if (await exportBackup(state)) {
      setLast(lastBackup());
      setMsg({ ok: true, text: 'Backup saved. Keep the file somewhere safe, like iCloud Drive, Google Drive or your email.' });
    }
  };

  const pick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow picking the same file again
    if (!file) return;
    setMsg(null);
    try {
      setPending(await parseBackup(file));
    } catch (err) {
      setPending(null);
      setMsg({ ok: false, text: (err as Error).message });
    }
  };

  const restore = () => {
    if (!pending) return;
    dispatch({ type: 'hydrate', state: pending.state });
    setPending(null);
    setMsg({ ok: true, text: 'Restored. Your goals and history are back.' });
  };

  const days = trackedDays(state);
  return (
    <section className="card" id="backup" aria-label="Backup">
      <div className="card-title">Backup</div>
      <p className="muted" style={{ fontSize: 14, marginBottom: 12 }}>
        Your data lives only on this device. Save a backup file now and then so you can restore it after clearing your
        browser or on a new phone.
      </p>
      <p style={{ fontSize: 14, marginBottom: 12 }}>
        {last ? <>Last backup: <b>{fmt(last)}</b></> : <b>No backup yet.</b>}{' '}
        <span className="muted">· {days} day{days === 1 ? '' : 's'} tracked</span>
      </p>

      <div className="backup-actions">
        <button className="btn" onClick={save}>
          <Icon name="download" size={20} /> Save backup
        </button>
        <button className="btn plain" onClick={() => fileRef.current?.click()}>
          <Icon name="upload" size={20} /> Restore from file
        </button>
        <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={pick} />
      </div>

      {pending && (
        <div className="confirm" role="alertdialog" aria-label="Confirm restore">
          <p>
            Backup{pending.exportedAt ? ` from ${fmt(pending.exportedAt)}` : ''}: {pending.state.goals.length} goals,{' '}
            {trackedDays(pending.state)} day{trackedDays(pending.state) === 1 ? "" : "s"} tracked,{" "}
            {Object.keys(pending.state.weights).length} weight {Object.keys(pending.state.weights).length === 1 ? "entry" : "entries"}.
          </p>
          <p className="muted" style={{ fontSize: 13, margin: '4px 0 10px' }}>
            Restoring replaces everything currently on this device.
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn" onClick={restore}>Replace with backup</button>
            <button className="btn plain" onClick={() => setPending(null)}>Cancel</button>
          </div>
        </div>
      )}

      {msg && (
        <p role="status" style={{ fontSize: 14, marginTop: 10, fontWeight: 600, color: msg.ok ? 'var(--good)' : 'var(--bad)' }}>
          {msg.text}
        </p>
      )}
    </section>
  );
}
