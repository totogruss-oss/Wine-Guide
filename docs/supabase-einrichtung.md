# Stufe 2 vorbereiten: Supabase einrichten

Supabase ist die gemeinsame Online-Datenbank für Kirsten und Torsten. Der kostenlose Tarif reicht für uns zwei völlig aus.
Dauer: ca. 15 Minuten. **Du musst nichts programmieren.** Die Tabellen und Regeln liefert Claude in Stufe 2 als fertiges SQL zum Einfügen.

## 1. Konto und Projekt anlegen

1. https://supabase.com aufrufen → **Start your project** → mit dem GitHub-Konto anmelden.
2. **New project** anlegen:
   - Name: `wine-guide`
   - Database Password: über **Generate a password** erzeugen und **in Proton Pass speichern**
   - Region: **Central EU (Frankfurt)**, damit die Daten in Deutschland liegen
   - Plan: **Free**
3. Ca. 2 Minuten warten, bis das Projekt bereit ist.

> Hinweis: Kostenlose Projekte werden nach **7 Tagen ohne Nutzung** pausiert. Sie lassen sich im Dashboard mit einem Klick wieder starten, die Daten bleiben erhalten.

## 2. Zwei Werte notieren

Im Projekt unter **Project Settings → API** (bzw. **API Keys**):

| Wert | Wo | Geheim? |
|---|---|---|
| **Project URL** | `https://xxxx.supabase.co` | nein |
| **Publishable key** (früher „anon public“) | beginnt mit `sb_publishable_…` oder `eyJ…` | nein, darf in die App |

⚠️ Den **secret key** (früher „service_role“) **niemals** weitergeben oder in die App eintragen.

## 3. Anmeldung einstellen

Unter **Authentication → Sign In / Providers**:
- **Email** aktiviert lassen (Anmeldung per Link im Postfach, kein Passwort nötig).

Unter **Authentication → URL Configuration**:
- **Site URL:** `https://totogruss-oss.github.io/Wine-Guide/`
- **Redirect URLs:** zusätzlich `http://localhost:3000` eintragen (für Tests)

## 4. Werte in GitHub hinterlegen

Im Repository **Wine-Guide → Settings → Secrets and variables → Actions → Tab „Variables“** → **New repository variable**:

| Name | Wert |
|---|---|
| `SUPABASE_URL` | die Project URL |
| `SUPABASE_PUBLISHABLE_KEY` | der Publishable key |

## 5. Danach (macht Claude in Stufe 2)

- Tabelle `wines` und Fotospeicher anlegen
- Zugriffsregeln: **nur** eure zwei Konten dürfen lesen und schreiben
- Danach **neue Registrierungen sperren** (Authentication → „Allow new users to sign up“ aus), damit niemand Fremdes ein Konto anlegen kann
- Vorhandene Weine aus dem Handy in die gemeinsame Datenbank übernehmen
- Die App funktioniert weiterhin offline und gleicht die Daten ab, sobald wieder Netz da ist
