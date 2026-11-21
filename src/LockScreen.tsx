import React, { useState } from 'react';
import { Icon } from './icons';
import { checkPassword, unlock } from './lock';

export function LockScreen({ onUnlock }: { onUnlock: () => void }) {
  const [pw, setPw] = useState('');
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pw || busy) return;
    setBusy(true);
    const ok = await checkPassword(pw);
    if (ok) {
      unlock(remember);
      onUnlock();
    } else {
      // A short pause makes rapid guessing tedious.
      await new Promise((r) => setTimeout(r, 600));
      setError(true);
      setPw('');
      setBusy(false);
    }
  };

  return (
    <div className="lock">
      <form className={`lock-card${error ? ' shake' : ''}`} onSubmit={submit}>
        <span className="logo lock-logo"><Icon name="check" size={30} strokeWidth={3} /></span>
        <h1>Daymark</h1>
        <p className="muted">Enter your password to continue.</p>

        <label className="sr-only" htmlFor="pw">Password</label>
        <div className="pw-field">
          <input id="pw" className="input" type={show ? 'text' : 'password'} value={pw} autoFocus
            autoComplete="current-password" enterKeyHint="go" placeholder="Password"
            aria-invalid={error} aria-describedby={error ? 'pw-error' : undefined}
            onChange={(e) => { setPw(e.target.value); setError(false); }} />
          <button type="button" className="icon-btn" aria-label={show ? 'Hide password' : 'Show password'} onClick={() => setShow((s) => !s)}>
            <Icon name={show ? 'eyeOff' : 'eye'} size={20} />
          </button>
        </div>
        {error && <p id="pw-error" role="alert" className="pw-error">Wrong password. Try again.</p>}

        <label className="remember">
          <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
          Keep me signed in on this device for 30 days
        </label>

        <button className="btn block" type="submit" disabled={!pw || busy}>
          <Icon name="lock" size={18} /> {busy ? 'Checking…' : 'Unlock'}
        </button>
      </form>
    </div>
  );
}
