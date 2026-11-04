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
}

const db = new Dexie('WineGuideDB') as Dexie & {
  wines: EntityTable<Wine, 'id'>;
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

/** Legt beim allerersten Start eure ersten drei echten Weine an. */
export async function seedInitialWines() {
  const SEED_FLAG = 'wine_guide_seeded';
  try {
    if (localStorage.getItem(SEED_FLAG)) return;
    localStorage.setItem(SEED_FLAG, '1');
  } catch {
    /* ohne Speicher: nur auf leere Datenbank prüfen */
  }
  const count = await db.wines.count();
  if (count === 0) {
    await db.wines.bulkAdd([
      {
        name: 'Mezzacorona',
        farbe: 'Weiß',
        geschmacksnote: 'Trocken',
        land: 'Italien',
        anbaugebiet: 'Trentino',
        jahrgang: 2020,
        rebsorte: 'Pinot Grigio',
        kaufort: 'Edeka - Wucherpfennig',
        kaufdatum: '2021-09-08',
        preis: 4.99,
        besonderheiten: 'Nachhaltige Qualität',
        noteKirsten: 2,
        noteTorsten: 2,
        createdAt: Date.now() - 10000,
      },
      {
        name: 'Oveja Blanca',
        farbe: 'Weiß',
        geschmacksnote: 'Trocken',
        land: 'Spanien',
        anbaugebiet: 'Moscatel',
        jahrgang: 2020,
        rebsorte: 'Muscat',
        kaufort: 'EDEKA',
        kaufdatum: '2021-08-14',
        preis: 5.99,
        besonderheiten: 'Trockener Muskat-Wein; Vegan und Bio',
        geruch: ['Blumig', 'Fruchtig'],
        geschmack: ['Hohe Säure'],
        noteKirsten: 5,
        noteTorsten: 4,
        kommentarKirsten: 'Interessant',
        kommentarTorsten: 'Eklig. Zu viel Säure; nur ich habe ihn am Ende leer getrunken',
        createdAt: Date.now() - 5000,
      },
      {
        name: 'Nero D`Avola (Sicilia)',
        farbe: 'Rot',
        geschmacksnote: 'Trocken',
        land: 'Italien',
        anbaugebiet: 'Sizilien',
        jahrgang: 2020,
        rebsorte: 'Nero D`Avola',
        kaufort: 'Edeka - Wucherpfennig',
        kaufdatum: '2021-09-04',
        preis: 5.99,
        besonderheiten: 'Bio-Wein',
        geschmack: ['Bitter'],
        noteKirsten: 3,
        noteTorsten: 3,
        kommentarKirsten: 'Leicht bis leicht säuerlich',
        kommentarTorsten: 'Unangenehm im Nachgang; komisch im Mund',
        createdAt: Date.now(),
      }
    ]);
  }
}

export { db };
