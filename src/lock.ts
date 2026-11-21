// Simple on-device lock screen. This is a privacy screen, not real security: the site is static,
// so the check runs in the browser. Only a salted SHA-256 hash of the password is in the code.
const SALT = 'daymark-lock-v1:';
const PASS_HASH = '0b16e605e4d2f48febebe88733a7b39b14cdb32ab342e0eded51af3cbf4033a9';

const SESSION_KEY = 'daymark:unlocked';
const REMEMBER_KEY = 'daymark:rememberUntil';
const REMEMBER_DAYS = 30;

async function sha256Hex(text: string) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function checkPassword(pw: string) {
  return (await sha256Hex(SALT + pw)) === PASS_HASH;
}

const get = (s: Storage, k: string) => {
  try { return s.getItem(k); } catch { return null; }
};
const set = (s: Storage, k: string, v: string | null) => {
  try { v === null ? s.removeItem(k) : s.setItem(k, v); } catch { /* storage blocked */ }
};

/** Unlocked for this browser session, or remembered on this device and not expired. */
export function isUnlocked() {
  if (get(sessionStorage, SESSION_KEY) === '1') return true;
  return Number(get(localStorage, REMEMBER_KEY) || 0) > Date.now();
}

export function unlock(remember: boolean) {
  set(sessionStorage, SESSION_KEY, '1');
  set(localStorage, REMEMBER_KEY, remember ? String(Date.now() + REMEMBER_DAYS * 86_400_000) : null);
}

export function lock() {
  set(sessionStorage, SESSION_KEY, null);
  set(localStorage, REMEMBER_KEY, null);
}
