/**
 * Alle Schreibzugriffe auf Weine laufen hier durch.
 * So wird jede Änderung zuverlässig zum Hochladen vorgemerkt.
 */

import { db, type Wine } from '../db';
import { requestSync } from './sync';
import { normalizeWine } from './wineFields';

export async function saveWine(wine: Partial<Wine>): Promise<number> {
  const now = Date.now();
  const record = {
    ...normalizeWine(wine),
    uuid: wine.uuid || crypto.randomUUID(),
    createdAt: wine.createdAt || now,
    updatedAt: now,
    dirty: 1,
  } as Wine;
  const id = (await db.wines.put(record)) as number;
  requestSync();
  return id;
}

export async function deleteWine(id: number): Promise<void> {
  await db.transaction('rw', db.wines, db.pendingDeletes, async () => {
    const wine = await db.wines.get(id);
    if (!wine) return;
    if (wine.uuid) await db.pendingDeletes.put({ uuid: wine.uuid });
    await db.wines.delete(id);
  });
  requestSync();
}

/**
 * Import aus einer JSON-Sicherung. Weine mit bekannter uuid werden aktualisiert,
 * alle anderen neu angelegt (nie über die lokale Nummer überschrieben).
 */
export async function importWines(wines: Partial<Wine>[]): Promise<number> {
  const now = Date.now();
  let count = 0;
  await db.transaction('rw', db.wines, async () => {
    for (const raw of wines) {
      if (!raw || typeof raw !== 'object' || !raw.name) continue;
      const { id: _ignored, ...rest } = raw;
      const existing = rest.uuid ? await db.wines.where('uuid').equals(rest.uuid).first() : undefined;
      await db.wines.put({
        ...normalizeWine(rest),
        id: existing?.id,
        uuid: rest.uuid || crypto.randomUUID(),
        createdAt: rest.createdAt || now,
        updatedAt: now,
        dirty: 1,
      } as Wine);
      count++;
    }
  });
  requestSync();
  return count;
}
