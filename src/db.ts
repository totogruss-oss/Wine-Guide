import Dexie, { type EntityTable } from 'dexie';

export interface Wine {
  id?: number;
  name: string;
  image?: string; // base64
  geschmacksnote?: string;
  farbe?: string;
  geruch?: string[];
  geschmack?: string[];
  kaufdatum?: string;
  kaufort?: string;
  genussort?: string;
  locationCoords?: { lat: number; lng: number };
  preis?: number;
  land?: string;
  anbaugebiet?: string;
  jahrgang?: number;
  rebsorte?: string;
  winzer?: string;
  besonderheiten?: string;
  noteKirsten?: number;
  noteTorsten?: number;
  kommentarKirsten?: string;
  kommentarTorsten?: string;
  createdAt: number;
  // --- Synchronisation (Stufe 2) ---
  /** Geräteübergreifende ID, identisch mit der ID in Supabase */
  uuid?: string;
  /** Zeitpunkt der letzten lokalen Änderung (ms) */
  updatedAt?: number;
  /** 1 = lokale Änderung noch nicht hochgeladen */
  dirty?: 0 | 1;
}

/** Lokal gelöschte Weine, deren Löschung noch hochgeladen werden muss */
export interface PendingDelete {
  uuid: string;
}

const db = new Dexie('WineGuideDB') as Dexie & {
  wines: EntityTable<Wine, 'id'>;
  pendingDeletes: EntityTable<PendingDelete, 'uuid'>;
};

db.version(1).stores({
  wines: '++id, name, farbe, land, rebsorte, winzer, noteKirsten, noteTorsten, createdAt'
});

db.version(2).stores({
  wines: '++id, name, farbe, land, anbaugebiet, rebsorte, winzer, noteKirsten, noteTorsten, createdAt'
});

db.version(3).stores({
  wines: '++id, name, farbe, land, anbaugebiet, rebsorte, winzer, noteKirsten, noteTorsten, createdAt'
});

db.version(4).stores({
  wines: '++id, &uuid, dirty, name, farbe, land, anbaugebiet, rebsorte, winzer, noteKirsten, noteTorsten, createdAt',
  pendingDeletes: 'uuid',
}).upgrade(tx =>
  // Alle vorhandenen Weine bekommen eine feste ID und werden zum Hochladen vorgemerkt
  tx.table('wines').toCollection().modify((w: Wine) => {
    if (!w.uuid) w.uuid = crypto.randomUUID();
    if (!w.updatedAt) w.updatedAt = w.createdAt || Date.now();
    w.dirty = 1;
  })
);

export { db };
