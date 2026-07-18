# HEART CORE 45K — Von deinem Rechner ins Internet

Diese Anleitung führt dich in **5 Etappen** von „App liegt auf meinem Mac" zu
„App läuft unter meiner eigenen Domain". Du brauchst keine Programmierkenntnisse —
nur einen Browser und ca. 30–45 Minuten. Jede Etappe endet mit einem Punkt, an dem
du prüfen kannst, ob alles geklappt hat.

**Das Zusammenspiel in einem Satz:** Dein Code liegt bei **GitHub** (Aktenschrank),
**Vercel** baut daraus die laufende Website (Maschinenraum), **Supabase** speichert
die Konten und Trainingsdaten (Tresor), und deine **Ionos-Domain** ist das
Türschild, das auf Vercel zeigt.

---

## Etappe 1: Datenbank bei Supabase anlegen (~10 min)

Supabase ist ein Datenbank-Dienst mit kostenlosem Tarif — hier landen Benutzerkonten,
Trainingsplan, Check-ins und Aktivitäten.

1. Gehe auf **https://supabase.com** und klicke **Start your project**.
2. Melde dich mit **Continue with GitHub** an (nutzt dein bestehendes GitHub-Konto,
   kein neues Passwort nötig).
3. Klicke **New project** und fülle aus:
   - **Name:** `heartcore` (frei wählbar)
   - **Database Password:** Klicke **Generate a password** und **speichere es sofort**
     in deinem Passwort-Manager. Du brauchst es gleich noch einmal.
   - **Region:** `Central EU (Frankfurt)` — nah bei deinen Nutzern.
4. Klicke **Create new project** und warte ~2 Minuten, bis das Projekt bereit ist.

### 1a. Tabellen anlegen

Die App braucht ihre Tabellen (Benutzer, Plan, Check-ins …). Das Rezept dafür liegt
fertig im Projekt.

1. Öffne auf deinem Mac die Datei **`drizzle/0000_init.sql`** aus diesem Projektordner
   (Doppelklick öffnet sie in einem Texteditor) und kopiere den **kompletten Inhalt**.
2. In Supabase: Klicke links auf das Symbol **SQL Editor**.
3. Füge den kopierten Text ein und klicke **Run** (unten rechts).
4. ✅ **Check:** Es erscheint „Success. No rows returned". Unter **Table Editor**
   (linkes Menü) siehst du jetzt Tabellen wie `user`, `plan_session`, `checkin`.

### 1b. Verbindungsadresse kopieren

Das ist die „Telefonnummer" der Datenbank, die wir Vercel gleich geben.

1. Klicke oben auf **Connect** (Steckersymbol in der Kopfleiste).
2. Wähle den Reiter **Transaction pooler** (wichtig — NICHT „Direct connection").
   Die Adresse endet auf **`:6543/postgres`**.
3. Kopiere die Zeile, die mit `postgresql://` beginnt, in eine Notiz und ersetze
   darin `[YOUR-PASSWORD]` durch das Datenbank-Passwort aus Schritt 3.
   Am Ende hast du eine einzige lange Zeile ohne eckige Klammern.

---

## Etappe 2: Code zu GitHub hochladen (~5 min)

Dein Repo existiert schon unter `github.com/MaxxTheRexx/45Ultra`. Es fehlt nur der
neue Stand. Öffne das Programm **Terminal** auf deinem Mac und führe diese drei
Befehle aus (jeweils mit Enter bestätigen):

```bash
cd ~/Downloads/Ultra45
git add -A
git commit -m "Next.js-App mit Login, Sync und Offline-Support"
git push
```

Falls `git push` nach Benutzername/Passwort fragt: GitHub akzeptiert keine
Passwörter mehr im Terminal — am einfachsten installierst du einmalig
**GitHub Desktop** (https://desktop.github.com), meldest dich dort an und klickst
**Push origin**.

✅ **Check:** Auf github.com/MaxxTheRexx/45Ultra siehst du die Ordner `app`,
`components`, `lib` und die Datei `ANLEITUNG.md`.

---

## Etappe 3: Bei Vercel veröffentlichen (~10 min)

Vercel ist die Firma hinter Next.js — Veröffentlichung ist dort ein Import-Klick.
Der kostenlose **Hobby-Tarif** reicht für diese App locker aus.

1. Gehe auf **https://vercel.com**, melde dich mit **Continue with GitHub** an.
2. Klicke **Add New… → Project**.
3. Du siehst deine GitHub-Repos. Klicke bei **45Ultra** auf **Import**.
   (Wenn das Repo nicht auftaucht: **Adjust GitHub App Permissions** klicken und
   Vercel Zugriff auf das Repo geben.)
4. **Bevor** du auf Deploy klickst: Öffne den Abschnitt **Environment Variables**
   und lege diese drei Einträge an (Name links, Wert rechts, jeweils **Add**):

   | Name | Wert |
   |---|---|
   | `DATABASE_URL` | die lange `postgresql://…:6543/postgres`-Zeile aus Etappe 1b |
   | `BETTER_AUTH_SECRET` | ein langes Zufallsgeheimnis — auf https://generate-secret.vercel.app/32 klicken und den angezeigten Wert kopieren |
   | `BETTER_AUTH_URL` | erstmal leer lassen bzw. weglassen — kommt in Etappe 4 |

5. Klicke **Deploy** und warte 2–3 Minuten.
6. ✅ **Check:** Vercel zeigt „Congratulations" und eine Adresse wie
   `45ultra.vercel.app`. Öffne sie: Die Login-Seite der App erscheint.
   **Registriere dein Konto** und tippe dich durch die Tabs.

> Ab jetzt gilt: Jeder `git push` (bzw. „Push origin" in GitHub Desktop) baut und
> veröffentlicht die App automatisch neu. Es gibt keinen separaten Upload-Schritt mehr.

---

## Etappe 4: Deine Ionos-Domain verbinden (~10 min + Wartezeit)

Die Domain bleibt bei Ionos — wir tragen dort nur ein, dass sie auf Vercel zeigt.
Entscheide dich zuerst: Soll die App unter der **Hauptdomain** laufen
(`deinedomain.de`) oder unter einer **Subdomain** (`app.deinedomain.de`)?
Subdomain ist die sanftere Variante, falls unter der Hauptdomain schon etwas liegt.

### Bei Vercel

1. Im Vercel-Projekt: **Settings → Domains → Add**.
2. Tippe deine Domain ein (z.B. `app.deinedomain.de`) und bestätige.
3. Vercel zeigt dir nun genau an, welcher DNS-Eintrag fehlt — typischerweise:
   - für eine **Subdomain**: ein **CNAME**-Eintrag mit Wert `cname.vercel-dns.com.`
   - für die **Hauptdomain**: ein **A**-Eintrag auf die von Vercel angezeigte IP-Adresse
   Lass dieses Fenster offen.

### Bei Ionos

1. Melde dich unter **https://login.ionos.de** an.
2. Gehe zu **Menü → Domains & SSL**, klicke bei deiner Domain auf das
   Zahnrad/​**DNS**.
3. Klicke **Record hinzufügen** und übertrage genau das, was Vercel anzeigt:
   - **Typ:** `CNAME` (Subdomain) bzw. `A` (Hauptdomain)
   - **Hostname:** der Subdomain-Teil, z.B. `app` (bei Hauptdomain: `@`)
   - **Wert/Zeigt auf:** der Wert aus dem Vercel-Fenster
   - **TTL:** Standard lassen
4. Speichern. DNS-Änderungen brauchen **von wenigen Minuten bis zu einigen Stunden**.
   Das Vercel-Fenster springt automatisch auf „Valid Configuration" um, sobald es
   so weit ist. Das SSL-Zertifikat (https) erstellt Vercel von selbst.

### Zurück bei Vercel: die App über ihre neue Adresse informieren

Login und Passkeys sind an die Adresse gebunden — deshalb jetzt noch:

1. **Settings → Environment Variables**: Lege `BETTER_AUTH_URL` an (bzw. ändere sie)
   auf `https://app.deinedomain.de` (deine echte Adresse, ohne Schrägstrich am Ende).
2. Gehe zu **Deployments**, klicke beim obersten Eintrag auf **⋯ → Redeploy**.
3. ✅ **Check:** `https://app.deinedomain.de` öffnet die App, Registrierung/Login
   funktionieren, und im Daten-Tab kannst du **„Passkey für dieses Gerät einrichten"**
   nutzen (Face ID / Touch ID).

> **Wichtig:** Passkeys, die vorher auf der `…vercel.app`-Adresse angelegt wurden,
> gelten nicht für die neue Domain — einfach unter der neuen Adresse neu einrichten.
> E-Mail+Passwort-Logins funktionieren unverändert.

---

## Etappe 5: App aufs Handy (~2 min)

Die App ist eine PWA („Progressive Web App") — sie lässt sich wie eine echte App
installieren und funktioniert dann auch offline (im Wald, im Funkloch, im Flugmodus):

- **iPhone (Safari):** Seite öffnen → Teilen-Symbol → **Zum Home-Bildschirm**.
- **Android (Chrome):** Seite öffnen → Drei-Punkte-Menü → **App installieren**.

Alles, was du offline einträgst (Check-ins, Haken, Verschiebungen), wird gespeichert
und automatisch synchronisiert, sobald du wieder Empfang hast. Dieselben Daten
erscheinen auf jedem Gerät, auf dem du eingeloggt bist.

---

## Etappe 6: Automatischer Garmin-Import über Strava freischalten (einmalig)

Damit deine Garmin-Aktivitäten automatisch in der App landen, läuft der Weg über
Strava (Garmin lädt jede Aktivität automatisch zu Strava hoch). Zwei Dinge musst
du **einmal als Betreiber** einrichten, den Rest macht jeder Nutzer selbst in der App.

### 6a. Zwei geheime Schlüssel bei Vercel hinterlegen

1. Erzeuge zwei Zufallswerte: öffne zweimal https://generate-secret.vercel.app/32
   und kopiere dir beide Werte.
2. Vercel → Projekt **endurance24** → **Settings → Environment Variables** →
   zwei neue Einträge (Production):
   - `ENCRYPTION_KEY` = der erste Wert — **verschlüsselt die Strava-Zugangsdaten.
     Diesen Wert danach NIE mehr ändern** (sonst müssen alle Nutzer Strava neu verbinden).
   - `CRON_SECRET` = der zweite Wert — schützt den nächtlichen Abgleich.
3. **Deployments → oberster Eintrag → ⋯ → Redeploy.**

Der tägliche automatische Abgleich (`vercel.json`) läuft danach von selbst einmal
pro Nacht — im Hobby-Tarif ist genau ein Lauf pro Tag erlaubt.

### 6b. Datenbank-Tabelle in Supabase anlegen

Wie in Etappe 1a: Öffne **`drizzle/0002_strava.sql`**, kopiere den Inhalt, füge
ihn im Supabase **SQL Editor** ein und klicke **Run**. (Falls du Teil A noch nicht
eingespielt hast, davor auch **`drizzle/0001_planconfig.sql`** ausführen.)

### 6c. So verbindet sich jeder Nutzer (in der App)

Im **Daten**-Tab → Karte **„Garmin / Strava"** → **Einrichtung starten**. Die App
führt Schritt für Schritt durch das Anlegen einer eigenen kostenlosen Strava-API-App
(auf strava.com/settings/api). Wichtig ist dort nur ein Feld:
**Autorisierungs-Callback-Domain = `endurance24.vercel.app`** (genau so, ohne
`https://`). Client-ID und Client-Secret in die App einfügen, „Speichern & mit Strava
verbinden" — fertig. Ab dann kommen neue Läufe automatisch, und „Jetzt abgleichen"
holt sie sofort.

> Warum jeder eine eigene Strava-App? Strava erlaubt pro API-App nur 10 verbundene
> Sportler. Mit einer eigenen App pro Nutzer gibt es diese Grenze nicht.

---

## Alltag & Pannenhilfe

**Etwas am Code ändern lassen und veröffentlichen:** Änderung machen (lassen),
dann `git push` — Vercel deployt automatisch. Im Vercel-Dashboard unter
**Deployments** siehst du jeden Build; ein fehlgeschlagener Build wird NICHT
veröffentlicht, die alte Version bleibt einfach online (du kannst nichts kaputt pushen).

**„Sync-Fehler" in der App:** Kein Drama — die Daten liegen sicher auf dem Gerät
und werden beim nächsten erfolgreichen Kontakt übertragen. Dauerhaft rot?
In Vercel unter **Deployments → (oberster Eintrag) → Logs** nachsehen; meistens
stimmt die `DATABASE_URL` nicht (Passwort? Port 6543?).

**Supabase pausiert das Projekt:** Im kostenlosen Tarif werden Projekte nach
~1 Woche ohne Nutzung pausiert. Im Supabase-Dashboard auf **Restore** klicken —
Daten gehen dabei nicht verloren. Bei regelmäßiger Nutzung passiert das nicht.

**Passwort der Datenbank verloren:** Supabase → Project Settings → Database →
**Reset database password**, danach die neue `DATABASE_URL` bei Vercel eintragen
und redeployen.

**Lokal auf dem Mac testen** (optional, für Entwicklung): Im Terminal
`cd ~/Downloads/Ultra45 && npm run dev` und `http://localhost:3000` öffnen.
Ohne Supabase-Zugangsdaten nutzt die App dann automatisch eine eingebaute
lokale Datenbank (Ordner `.pglite/`) — zum Ausprobieren ideal.
