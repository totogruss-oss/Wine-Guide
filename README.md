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

**Stand Stufe 1:** lokal im Browser des jeweiligen Geräts (IndexedDB).
Bitte regelmäßig unter *Einstellungen → Exportieren (JSON)* sichern.
**Stufe 2:** gemeinsame Datenbank über Supabase, siehe [docs/supabase-einrichtung.md](docs/supabase-einrichtung.md).

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
