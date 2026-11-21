import { toKey, today } from './date';
import { normalizeState } from './store';
import { AppState } from './types';

const LAST_KEY = 'daymark:lastBackup';
const SNOOZE_KEY = 'daymark:backupSnooze';
const DAY_MS = 86_400_000;

interface BackupFile {
  app: 'daymark';
  format: 1;
  exportedAt: string;
  data: AppState;
}

const read = (k: string) => {
  try { return localStorage.getItem(k); } catch { return null; }
};
const write = (k: string, v: string) => {
  try { localStorage.setItem(k, v); } catch { /* storage blocked */ }
};

export const lastBackup = (): Date | null => {
  const v = read(LAST_KEY);
  return v ? new Date(v) : null;
};

/** Days that have any check, day goal or weight entry. */
export function trackedDays(s: AppState) {
  return new Set([...Object.keys(s.checks), ...Object.keys(s.tasks), ...Object.keys(s.weights), ...Object.keys(s.notes)]).size;
}

/** Nudge when there's a week of data and no backup in the last 30 days (unless snoozed). */
export function backupDue(s: AppState) {
  if (trackedDays(s) < 7) return false;
  const snooze = Number(read(SNOOZE_KEY) || 0);
  if (Date.now() < snooze) return false;
  const last = lastBackup();
  return !last || Date.now() - last.getTime() > 30 * DAY_MS;
}

export const snoozeBackup = () => write(SNOOZE_KEY, String(Date.now() + 7 * DAY_MS));

/**
 * Saves a backup file. On phones this opens the share sheet (save to Files, iCloud Drive,
 * Google Drive, email…); elsewhere it downloads the file. Returns false if the user cancelled.
 */
export async function exportBackup(state: AppState): Promise<boolean> {
  const payload: BackupFile = { app: 'daymark', format: 1, exportedAt: new Date().toISOString(), data: state };
  const name = `daymark-backup-${toKey(today())}.json`;
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const file = new File([blob], name, { type: 'application/json' });

  const touch = matchMedia('(pointer: coarse)').matches;
  if (touch && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: 'Daymark backup' });
      write(LAST_KEY, new Date().toISOString());
      return true;
    } catch (e) {
      if ((e as Error).name === 'AbortError') return false;
      // Sharing failed for another reason: fall back to a download.
    }
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
  write(LAST_KEY, new Date().toISOString());
  return true;
}

export type ParsedBackup = { state: AppState; exportedAt: Date | null };

/** Reads a backup file. Accepts the wrapped format or a raw saved state. Throws a readable message. */
export async function parseBackup(file: File): Promise<ParsedBackup> {
  if (file.size > 20_000_000) throw new Error("That file is too big to be a Daymark backup.");
  let json: unknown;
  try {
    json = JSON.parse(await file.text());
  } catch {
    throw new Error("That file isn't a Daymark backup (it isn't valid JSON).");
  }
  const wrapped = json && typeof json === 'object' && (json as BackupFile).app === 'daymark';
  const state = normalizeState(wrapped ? (json as BackupFile).data : json);
  if (!state) throw new Error("That file isn't a Daymark backup.");
  const when = wrapped ? new Date((json as BackupFile).exportedAt) : null;
  return { state, exportedAt: when && !isNaN(when.getTime()) ? when : null };
}
