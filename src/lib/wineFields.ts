/**
 * Hilfsfunktionen für Felder mit mehreren Schreibweisen:
 *  - Rebsorten: früher ein Text (`rebsorte`), jetzt eine Liste (`rebsorten`) für Cuvées.
 *  - Kaufdatum: "JJJJ-MM-TT", "JJJJ-MM" oder nur "JJJJ", je nachdem, was man noch weiß.
 */

import type { Wine } from '../db';

// ---------- Rebsorten ----------

/** Zerlegt einen alten Freitext wie "Merlot / Cabernet Sauvignon" in einzelne Sorten. */
export function splitRebsorten(text?: string): string[] {
  if (!text) return [];
  return uniqueRebsorten(text.split(/\s*(?:[,;/+&]|\bund\b)\s*/i));
}

/** Entfernt Leereinträge und Doppelungen (ohne Rücksicht auf Groß-/Kleinschreibung). */
export function uniqueRebsorten(list: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of list) {
    const r = raw.trim();
    if (!r || seen.has(r.toLowerCase())) continue;
    seen.add(r.toLowerCase());
    result.push(r);
  }
  return result;
}

/** Alle Rebsorten eines Weins, egal ob im alten oder neuen Format gespeichert. */
export function getRebsorten(wine: Pick<Wine, 'rebsorte' | 'rebsorten'>): string[] {
  if (wine.rebsorten && wine.rebsorten.length > 0) return wine.rebsorten;
  return splitRebsorten(wine.rebsorte);
}

/** Lesbarer Text, z. B. "Merlot, Cabernet Sauvignon". */
export function rebsortenText(wine: Pick<Wine, 'rebsorte' | 'rebsorten'>): string {
  return getRebsorten(wine).join(', ');
}

/**
 * Bringt einen Wein in das aktuelle Format. `rebsorte` bleibt als lesbarer Text erhalten,
 * damit ältere App-Stände (z. B. ein noch nicht aktualisiertes Handy) etwas anzeigen.
 */
export function normalizeWine<T extends Partial<Wine>>(wine: T): T {
  const rebsorten = uniqueRebsorten(getRebsorten(wine));
  const next = { ...wine };
  if (rebsorten.length > 0) {
    next.rebsorten = rebsorten;
    next.rebsorte = rebsorten.join(', ');
  } else {
    delete next.rebsorten;
    delete next.rebsorte;
  }
  return next;
}

// ---------- Kaufdatum ----------

export type DatumGenauigkeit = 'tag' | 'monat' | 'jahr';

const MONATE = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
];
export const MONATSNAMEN = MONATE;

const DATUM_RE = /^(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?$/;

interface DatumTeile {
  jahr: number;
  monat?: number; // 1–12
  tag?: number;
}

export function parseKaufdatum(value?: string): DatumTeile | null {
  const m = value ? DATUM_RE.exec(value.trim()) : null;
  if (!m) return null;
  return {
    jahr: Number(m[1]),
    monat: m[2] ? Number(m[2]) : undefined,
    tag: m[3] ? Number(m[3]) : undefined,
  };
}

export function getGenauigkeit(value?: string): DatumGenauigkeit {
  const teile = parseKaufdatum(value);
  if (!teile || teile.tag) return 'tag';
  return teile.monat ? 'monat' : 'jahr';
}

/** "12.05.2024", "Mai 2024" oder "2024" */
export function formatKaufdatum(value?: string): string {
  const t = parseKaufdatum(value);
  if (!t) return value || '';
  if (t.tag && t.monat) return `${String(t.tag).padStart(2, '0')}.${String(t.monat).padStart(2, '0')}.${t.jahr}`;
  if (t.monat) return `${MONATE[t.monat - 1]} ${t.jahr}`;
  return String(t.jahr);
}

/** Zahl zum Sortieren: ungenaue Angaben stehen am Anfang ihres Monats bzw. Jahres. */
export function kaufdatumSortKey(value?: string): number {
  const t = parseKaufdatum(value);
  if (!t) return 0;
  return t.jahr * 10000 + (t.monat ?? 0) * 100 + (t.tag ?? 0);
}

/** Wandelt ein Datum in die gewünschte Genauigkeit um (ohne Tage zu erfinden, wo möglich). */
export function changeGenauigkeit(value: string | undefined, ziel: DatumGenauigkeit): string {
  const t = parseKaufdatum(value) ?? { jahr: new Date().getFullYear() };
  const jahr = String(t.jahr);
  const monat = String(t.monat ?? new Date().getMonth() + 1).padStart(2, '0');
  if (ziel === 'jahr') return jahr;
  if (ziel === 'monat') return `${jahr}-${monat}`;
  return `${jahr}-${monat}-${String(t.tag ?? 1).padStart(2, '0')}`;
}
