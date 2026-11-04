# 🍷 Wein-Guide von Kirsten & Torsten

Unser persönliches Weintagebuch: Weine unterwegs oder zu Hause festhalten, gemeinsam bewerten und später wiederfinden („Welcher Chardonnay war das nochmal?“).

**App:** https://totogruss-oss.github.io/Wine-Guide/

## Auf dem Handy installieren

Die App ist eine installierbare Web-App (PWA). Sie bekommt ein eigenes Icon und funktioniert auch ohne Internet.

- **Android (Chrome):** App-Link öffnen → Menü ⋮ → „Zum Startbildschirm hinzufügen“ bzw. „App installieren“
- **iPhone (Safari):** App-Link öffnen → Teilen-Symbol → „Zum Home-Bildschirm“

## KI-Funktionen

Diktieren, Keller-Analyse, KI-Sommelier und KI-Bild laufen über **Google Gemini**.
Jede Person trägt unter *Einstellungen* einmalig einen eigenen Gemini-API-Key ein
(kostenlos unter https://aistudio.google.com/apikey). Der Key bleibt auf dem Gerät
und wird nie in den Code oder auf GitHub übertragen.

## Wo liegen die Daten?

**Offline zuerst:** Jeder Wein wird sofort auf dem Handy gespeichert (IndexedDB) und im
Hintergrund mit der gemeinsamen Datenbank (**Supabase**, Frankfurt) abgeglichen, sobald Netz da ist.
Oben rechts zeigt die App den Stand: *Gesichert*, *x offen*, *Offline* oder *Anmelden*.

- Einrichtung: [docs/supabase-einrichtung.md](docs/supabase-einrichtung.md)
- Datenbank-Schema und Zugriffsregeln: [supabase/schema.sql](supabase/schema.sql)
- Zusätzlich ab und zu unter *Einstellungen → Exportieren (JSON)* sichern.

## Veröffentlichung

Jeder Push auf `main` baut die App und veröffentlicht sie über GitHub Pages
(`.github/workflows/deploy-pages.yml`). Einmalig nötig: im Repository unter
*Settings → Pages → Source* „**GitHub Actions**“ auswählen.

## Lokal entwickeln

```bash
npm install
npm run dev
```

Prüfen und bauen: `npm run lint` und `npm run build`.
