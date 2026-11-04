/**
 * Synchronisation zwischen der lokalen Datenbank (IndexedDB) und Supabase.
 *
 * Prinzip "Offline zuerst":
 *  - Gespeichert wird immer sofort lokal, auch ohne Netz.
 *  - Geänderte Weine sind mit dirty = 1 markiert und werden hochgeladen, sobald es geht.
 *  - Danach werden Änderungen vom anderen Handy heruntergeladen.
 *  - Konflikte: Eine noch nicht hochgeladene lokale Änderung gewinnt; ansonsten gilt
 *    die zuletzt hochgeladene Version.
 *  - Löschen ist in der Datenbank nur eine Markierung (deleted = true), damit das
 *    andere Handy davon erfährt.
 */

import { db, type Wine } from '../db';
import { supabase } from './supabase';

export type SyncState = 'disabled' | 'signedOut' | 'offline' | 'syncing' | 'ok' | 'error';

export interface SyncStatus {
  state: SyncState;
  lastSyncAt: number | null;
  pending: number;
  error: string | null;
}

interface RemoteRow {
  id: string;
  data: Omit<Wine, 'id' | 'dirty'>;
  deleted: boolean;
  updated_at: string;
}

const CURSOR_KEY = 'wine_guide_pull_cursor';
const LAST_SYNC_KEY = 'wine_guide_last_sync';
const PUSH_BATCH = 20; // Fotos machen Zeilen groß -> kleine Pakete
const PULL_PAGE = 50;
const CURSOR_OVERLAP_MS = 60_000;

// ---------- kleiner Status-Speicher für React ----------

const readNumber = (key: string): number | null => {
  try {
    const v = localStorage.getItem(key);
    return v ? Number(v) : null;
  } catch {
    return null;
  }
};
const writeValue = (key: string, value: string | null) => {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    /* ignorieren */
  }
};

let status: SyncStatus = {
  state: supabase ? 'signedOut' : 'disabled',
  lastSyncAt: readNumber(LAST_SYNC_KEY),
  pending: 0,
  error: null,
};
const listeners = new Set<() => void>();

const setStatus = (patch: Partial<SyncStatus>) => {
  status = { ...status, ...patch };
  listeners.forEach(l => l());
};

export const getSyncStatus = () => status;
export const subscribeSyncStatus = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

async function countPending(): Promise<number> {
  const [dirty, deletes] = await Promise.all([
    db.wines.where('dirty').equals(1).count(),
    db.pendingDeletes.count(),
  ]);
  return dirty + deletes;
}

export async function refreshPending() {
  setStatus({ pending: await countPending() });
}

// ---------- Hochladen ----------

const toRemoteData = (wine: Wine): RemoteRow['data'] => {
  const { id: _id, dirty: _dirty, ...data } = wine;
  return data;
};

async function push() {
  if (!supabase) return;

  const dirty = await db.wines.where('dirty').equals(1).toArray();
  for (let i = 0; i < dirty.length; i += PUSH_BATCH) {
    const batch = dirty.slice(i, i + PUSH_BATCH);
    const { error } = await supabase
      .from('wines')
      .upsert(batch.map(w => ({ id: w.uuid!, data: toRemoteData(w), deleted: false })), { onConflict: 'id' });
    if (error) throw error;

    // Nur als hochgeladen markieren, wenn sich der Wein inzwischen nicht erneut geändert hat
    await db.transaction('rw', db.wines, async () => {
      for (const sent of batch) {
        const current = await db.wines.get(sent.id!);
        if (current && current.updatedAt === sent.updatedAt) {
          await db.wines.update(sent.id!, { dirty: 0 });
        }
      }
    });
  }

  const deletes = await db.pendingDeletes.toArray();
  if (deletes.length) {
    const { error } = await supabase
      .from('wines')
      .upsert(deletes.map(d => ({ id: d.uuid, data: {}, deleted: true })), { onConflict: 'id' });
    if (error) throw error;
    await db.pendingDeletes.bulkDelete(deletes.map(d => d.uuid));
  }
}

// ---------- Herunterladen ----------

async function pull() {
  if (!supabase) return;

  const cursor = readNumber(CURSOR_KEY);
  const since = new Date(cursor ? cursor - CURSOR_OVERLAP_MS : 0).toISOString();
  let newest = cursor ?? 0;

  for (let from = 0; ; from += PULL_PAGE) {
    const { data, error } = await supabase
      .from('wines')
      .select('id, data, deleted, updated_at')
      .gt('updated_at', since)
      .order('updated_at', { ascending: true })
      .order('id', { ascending: true })
      .range(from, from + PULL_PAGE - 1);
    if (error) throw error;
    const rows = (data ?? []) as RemoteRow[];

    await db.transaction('rw', db.wines, db.pendingDeletes, async () => {
      for (const row of rows) {
        const local = await db.wines.where('uuid').equals(row.id).first();

        // Eigene, noch nicht hochgeladene Änderung hat Vorrang
        if (local?.dirty === 1) continue;
        if (!local && (await db.pendingDeletes.get(row.id))) continue;

        if (row.deleted) {
          if (local) await db.wines.delete(local.id!);
        } else {
          await db.wines.put({ ...row.data, id: local?.id, uuid: row.id, dirty: 0 } as Wine);
        }
      }
    });

    for (const row of rows) newest = Math.max(newest, Date.parse(row.updated_at));
    if (rows.length < PULL_PAGE) break;
  }

  if (newest) writeValue(CURSOR_KEY, String(newest));
}

// ---------- Ablauf ----------

let running: Promise<void> | null = null;
let again = false;

export async function syncNow(): Promise<void> {
  if (!supabase) return;
  if (running) {
    again = true;
    return running;
  }

  running = (async () => {
    do {
      again = false;
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        setStatus({ state: 'signedOut', pending: await countPending() });
        return;
      }
      if (!navigator.onLine) {
        setStatus({ state: 'offline', pending: await countPending() });
        return;
      }
      setStatus({ state: 'syncing', error: null });
      try {
        await push();
        await pull();
        const now = Date.now();
        writeValue(LAST_SYNC_KEY, String(now));
        setStatus({ state: 'ok', lastSyncAt: now, pending: await countPending() });
      } catch (err: unknown) {
        console.error('Sync-Fehler:', err);
        const message = err instanceof Error ? err.message : (err as { message?: string })?.message;
        setStatus({ state: 'error', error: message || 'Unbekannter Fehler', pending: await countPending() });
        return;
      }
    } while (again);
  })().finally(() => {
    running = null;
  });

  return running;
}

let debounceTimer: ReturnType<typeof setTimeout> | undefined;

/** Nach einer lokalen Änderung: kurz warten, dann synchronisieren. */
export function requestSync() {
  void refreshPending();
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => void syncNow(), 1500);
}

/** Neuer Abgleich von vorn (z. B. nach dem Anmelden mit einem anderen Konto). */
export function resetPullCursor() {
  writeValue(CURSOR_KEY, null);
}

let started = false;

/** Einmal beim App-Start aufrufen. */
export function startSync() {
  if (started) return;
  started = true;
  void refreshPending();
  if (!supabase) return;

  supabase.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') requestSync();
    if (event === 'SIGNED_OUT') setStatus({ state: 'signedOut' });
  });

  window.addEventListener('online', () => void syncNow());
  window.addEventListener('offline', () => setStatus({ state: 'offline' }));
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') void syncNow();
  });
  // Regelmäßig nachsehen, ob das andere Handy etwas eingetragen hat
  setInterval(() => {
    if (document.visibilityState === 'visible') void syncNow();
  }, 60_000);
}
