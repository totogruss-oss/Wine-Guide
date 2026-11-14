/**
 * Etikett-Scan: Ein Foto des Etiketts wird von Gemini ausgelesen.
 *
 * Grundregeln (siehe Projekt-Steuerungsblatt, „Hot Zones“):
 *  - Leer lassen statt raten: Nur was auf dem Etikett steht (oder eindeutig daraus folgt).
 *  - Nichts überschreiben: Übernommen werden nur Felder, die noch leer sind.
 */

import { Type, type GoogleGenAI } from '@google/genai';
import type { Wine } from '../db';
import { MODELS } from './ai';
import { getRebsorten, uniqueRebsorten } from './wineFields';

export const FARBEN = ['Weiß', 'Rot', 'Rosé', 'Orange'] as const;
export const GESCHMACKSNOTEN = ['Trocken', 'Halbtrocken', 'Feinherb', 'Lieblich', 'Süß'] as const;

/** Felder, die der Scan ausfüllen darf – mit deutscher Bezeichnung für den Hinweis. */
export const SCAN_FELDER = {
  name: 'Name',
  farbe: 'Farbe',
  rebsorten: 'Rebsorte',
  land: 'Land',
  anbaugebiet: 'Anbaugebiet',
  geschmacksnote: 'Geschmack',
  winzer: 'Winzer',
  jahrgang: 'Jahrgang',
} as const;
export type ScanFeld = keyof typeof SCAN_FELDER;

export type ScanErgebnis = Partial<Pick<Wine, 'name' | 'farbe' | 'rebsorten' | 'land' | 'anbaugebiet' | 'geschmacksnote' | 'winzer' | 'jahrgang'>>;

export const SCAN_PROMPT = `Du liest ein Wein-Etikett. Gib die Angaben als JSON zurück.

WICHTIGSTE REGEL: Leer lassen statt raten. Ein Feld nur ausfüllen, wenn es auf dem Etikett lesbar steht.
Lass ein Feld lieber weg, als einen Wert zu vermuten oder aus Allgemeinwissen zu ergänzen.

Felder:
- name: Name des Weins, wie auf dem Etikett (ohne Jahrgang). Wenn es keinen eigenen Namen gibt: Weingut + Rebsorte oder die Lage, wie gedruckt.
- winzer: Weingut / Erzeuger, wie gedruckt.
- jahrgang: vierstellige Jahreszahl, nur wenn gedruckt.
- rebsorten: alle genannten Rebsorten (bei Cuvées mehrere). Deutsche Schreibweise, z. B. "Grauburgunder", "Spätburgunder". Nicht aus der Region ableiten.
- land: auf Deutsch, z. B. "Deutschland", "Frankreich", "Italien". Darf aus einer gedruckten, eindeutigen Herkunftsbezeichnung folgen (z. B. "Rioja DOCa" → Spanien, "Mosel" → Deutschland).
- anbaugebiet: Region / Appellation, wie gedruckt (z. B. "Rheinhessen", "Bordeaux", "Chianti Classico").
- farbe: "Weiß", "Rot", "Rosé" oder "Orange". Nur wenn es auf dem Etikett steht ODER alle genannten Rebsorten eindeutig dieser Farbe zuzuordnen sind (z. B. Riesling → Weiß). Bei Unsicherheit weglassen.
- geschmacksnote: "Trocken", "Halbtrocken", "Feinherb", "Lieblich" oder "Süß" – NUR wenn das Wort (oder eine eindeutige Entsprechung wie "dry", "sec", "brut", "demi-sec", "amabile") gedruckt ist.`;

const SCHEMA = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING },
    winzer: { type: Type.STRING },
    jahrgang: { type: Type.INTEGER },
    rebsorten: { type: Type.ARRAY, items: { type: Type.STRING } },
    land: { type: Type.STRING },
    anbaugebiet: { type: Type.STRING },
    farbe: { type: Type.STRING, enum: [...FARBEN] },
    geschmacksnote: { type: Type.STRING, enum: [...GESCHMACKSNOTEN] },
  },
};

/** Prüft die Antwort und wirft alles weg, was nicht ins Schema passt. */
export function parseScanResult(raw: unknown): ScanErgebnis {
  if (!raw || typeof raw !== 'object') return {};
  const r = raw as Record<string, unknown>;
  const text = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : undefined);
  const out: ScanErgebnis = {};

  const name = text(r.name);
  if (name) out.name = name;
  const winzer = text(r.winzer);
  if (winzer) out.winzer = winzer;
  const land = text(r.land);
  if (land) out.land = land;
  const anbaugebiet = text(r.anbaugebiet);
  if (anbaugebiet) out.anbaugebiet = anbaugebiet;

  const jahr = typeof r.jahrgang === 'number' ? Math.round(r.jahrgang) : Number(text(r.jahrgang));
  if (Number.isFinite(jahr) && jahr >= 1900 && jahr <= new Date().getFullYear()) out.jahrgang = jahr;

  if (Array.isArray(r.rebsorten)) {
    const sorten = uniqueRebsorten(r.rebsorten.filter((s): s is string => typeof s === 'string'));
    if (sorten.length) out.rebsorten = sorten;
  }

  const farbe = text(r.farbe);
  if (farbe && (FARBEN as readonly string[]).includes(farbe)) out.farbe = farbe;
  const note = text(r.geschmacksnote);
  if (note && (GESCHMACKSNOTEN as readonly string[]).includes(note)) out.geschmacksnote = note;

  return out;
}

const istLeer = (wine: Partial<Wine>, feld: ScanFeld): boolean => {
  if (feld === 'rebsorten') return getRebsorten(wine).length === 0;
  const v = wine[feld];
  return v === undefined || v === null || v === '';
};

/**
 * Übernimmt Scan-Werte NUR in leere Felder. Gibt den neuen Wein und
 * die Liste der tatsächlich übernommenen Felder zurück.
 */
export function fillEmptyFields(wine: Partial<Wine>, scan: ScanErgebnis): { wine: Partial<Wine>; filled: ScanFeld[] } {
  const next: Partial<Wine> = { ...wine };
  const filled: ScanFeld[] = [];
  for (const feld of Object.keys(SCAN_FELDER) as ScanFeld[]) {
    const wert = scan[feld];
    if (wert === undefined || !istLeer(wine, feld)) continue;
    if (feld === 'rebsorten') {
      next.rebsorten = wert as string[];
      next.rebsorte = (wert as string[]).join(', ');
    } else {
      (next as Record<string, unknown>)[feld] = wert;
    }
    filled.push(feld);
  }
  return { wine: next, filled };
}

/** Liest ein Etikett aus. `dataUrl` ist ein Bild als data:-URL. */
export async function scanLabel(ai: GoogleGenAI, dataUrl: string): Promise<ScanErgebnis> {
  const match = /^data:([^;]+);base64,(.+)$/.exec(dataUrl);
  if (!match) throw new Error('Unbekanntes Bildformat');
  const response = await ai.models.generateContent({
    model: MODELS.text,
    contents: {
      parts: [
        { inlineData: { mimeType: match[1], data: match[2] } },
        { text: SCAN_PROMPT },
      ],
    },
    config: {
      responseMimeType: 'application/json',
      responseSchema: SCHEMA,
      temperature: 0,
    },
  });
  if (!response.text) return {};
  return parseScanResult(JSON.parse(response.text));
}
