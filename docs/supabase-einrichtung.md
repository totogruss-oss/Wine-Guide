# Gemeinsame Datenbank einrichten (Supabase)

> **Stand:** Eingerichtet am 05.11.2026. Projekt `wine-guide`, Region Frankfurt (eu-central-1). Diese Anleitung dient zum Nachschlagen oder für einen Neuaufbau.

Supabase ist die gemeinsame Online-Datenbank für den Wein-Guide. Der kostenlose Tarif reicht für zwei Personen völlig aus.
**Dauer:** ca. 15 Minuten. **Programmieren musst du nichts**, nur klicken und einmal SQL einfügen.

> Die App funktioniert auch ohne diese Einrichtung weiter (dann nur lokal). Du kannst also in Ruhe vorgehen.

## 1. Konto und Projekt anlegen

1. https://supabase.com → **Start your project** → mit dem **GitHub-Konto** anmelden.
2. **New project**:
   - **Name:** `wine-guide`
   - **Database Password:** auf **Generate a password** klicken und **in Proton Pass speichern** (wird im Alltag nicht gebraucht, aber nicht verlieren)
   - **Region:** **Central EU (Frankfurt)**
   - Plan: **Free**
3. **Create new project** und ca. 2 Minuten warten.

## 2. Datenbank-Tabellen anlegen

1. Links im Menü **SQL Editor** öffnen → **New query**.
2. Den kompletten Inhalt der Datei [`supabase/schema.sql`](../supabase/schema.sql) hineinkopieren.
3. **Ganz unten** `DEINE-EMAIL@example.com` durch **deine E-Mail-Adresse** ersetzen (die, mit der du dich in der App anmelden willst).
4. **Run** klicken. Erwartet: „Success. No rows returned“.

## 3. Registrierung sperren und dein Konto anlegen

1. **Authentication → Sign In / Providers** (bzw. **Settings**): **Allow new users to sign up** → **aus**. Speichern.
   *Damit kann sich niemand Fremdes ein Konto anlegen.*
2. **Authentication → Users → Add user → Create new user**:
   - **Email:** dieselbe Adresse wie in Schritt 2
   - **Password:** ein neues, starkes Passwort → **in Proton Pass speichern**
   - **Auto Confirm User:** **an**
   - **Create user**

## 4. Zwei Werte an GitHub übergeben

1. In Supabase: **Project Settings → API Keys** bzw. **Data API**. Notiere:
   - **Project URL**, z. B. `https://abcdefgh.supabase.co`
   - **Publishable key** (beginnt mit `sb_publishable_…`; bei älteren Projekten heißt er „anon public“ und beginnt mit `eyJ…`)
   - ⚠️ Den **secret key** / „service_role“ **niemals** verwenden oder weitergeben.
2. In GitHub: Repository **Wine-Guide → Settings → Secrets and variables → Actions** → Reiter **Variables** → **New repository variable**, zweimal:

| Name | Wert |
|---|---|
| `SUPABASE_URL` | die Project URL |
| `SUPABASE_PUBLISHABLE_KEY` | der Publishable key |

   *Diese beiden Werte sind öffentlich (sie stecken in jeder Supabase-App). Geschützt sind die Daten durch euer Login und die Zugriffsregeln aus Schritt 2.*

3. **Actions → Deploy to GitHub Pages → Run workflow** klicken, damit die App mit den neuen Werten neu gebaut wird (ca. 1 Minute).

## 5. In der App anmelden

1. App auf dem Handy öffnen (ggf. einmal schließen und neu öffnen, damit die neue Version lädt).
2. **Settings → Gemeinsame Datenbank** → E-Mail + Passwort → **Anmelden** (Proton Pass kann ausfüllen).
3. Nach wenigen Sekunden: **„Alle Weine sind online gesichert.“** Oben rechts steht dauerhaft **„Gesichert“**.

## Später: Kirsten dazuholen

1. Im **SQL Editor** ausführen (mit Kirstens Adresse):
   ```sql
   insert into public.allowed_users (email) values ('kirsten@…');
   ```
2. **Authentication → Users → Add user → Create new user** für Kirsten (Auto Confirm an).
3. Kirsten meldet sich in der App an und bekommt alle Weine automatisch.

## Gut zu wissen

- **Offline:** Gespeichert wird immer sofort auf dem Handy. Ohne Netz zeigt die App „Offline · x offen“ und lädt automatisch hoch, sobald wieder Netz da ist.
- **Pausieren:** Kostenlose Supabase-Projekte werden nach **7 Tagen ganz ohne Nutzung** pausiert. Die App arbeitet dann lokal weiter; im Supabase-Dashboard mit **Restore project** wieder starten, danach gleicht alles automatisch ab.
- **Sicherung:** Der kostenlose Tarif hat keine herunterladbaren Backups. Darum zusätzlich ab und zu **Settings → Exportieren (JSON)**.
