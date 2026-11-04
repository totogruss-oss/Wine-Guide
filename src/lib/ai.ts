/**
 * Zentrale KI-Konfiguration.
 *
 * Der API-Key wird NIE in den Build eingebaut (die App ist öffentlich erreichbar).
 * Jede Person hinterlegt ihren eigenen Key in den Einstellungen; er liegt nur
 * im Browser dieses Geräts (localStorage).
 */

import { GoogleGenAI } from '@google/genai';

const STORAGE_KEY = 'wine_guide_ai_key';
const LEGACY_STORAGE_KEY = 'openai_api_key'; // Name aus der ersten Version

/** Modelle an einer Stelle, damit ein Wechsel nur hier nötig ist. */
export const MODELS = {
  text: 'gemini-3-flash-preview',
  image: 'gemini-3.1-flash-image-preview',
} as const;

export class MissingApiKeyError extends Error {
  constructor() {
    super('Kein KI-Schlüssel hinterlegt. Bitte unter „Einstellungen“ einen Gemini-API-Key eintragen.');
    this.name = 'MissingApiKeyError';
  }
}

export function getApiKey(): string | null {
  try {
    const key = localStorage.getItem(STORAGE_KEY);
    if (key) return key;
    // Einmalige Übernahme aus der alten Version
    const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacy) {
      localStorage.setItem(STORAGE_KEY, legacy);
      localStorage.removeItem(LEGACY_STORAGE_KEY);
      return legacy;
    }
  } catch {
    /* Speicher nicht verfügbar (z. B. privater Modus) */
  }
  return null;
}

export function setApiKey(key: string) {
  const trimmed = key.trim();
  try {
    if (trimmed) localStorage.setItem(STORAGE_KEY, trimmed);
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignorieren */
  }
}

/** Liefert den Key oder wirft einen verständlichen Fehler. */
export function requireApiKey(): string {
  const key = getApiKey();
  if (!key) throw new MissingApiKeyError();
  return key;
}

/** Gemini-Client mit dem hinterlegten Key. */
export function getGemini(): GoogleGenAI {
  return new GoogleGenAI({ apiKey: requireApiKey() });
}

/** Zeigt nur Anfang und Ende des Keys, z. B. "AIza…x9Q2". */
export const maskApiKey = (key: string): string =>
  key.length <= 10 ? '••••' : `${key.slice(0, 4)}…${key.slice(-4)}`;
