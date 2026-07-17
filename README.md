# HEART CORE 45K · Trainingszentrale

Offline-fähige Trainings-Web-App für den HEART CORE 45K Trail (Heidelberg,
20.09.2026): 11-Wochen-Plan, Wochenkalender mit Drag & Drop, Morgen-/Abend-Check-ins,
Zielzeit-Prognose, Ernährungsguide und Garmin-CSV-Import.

**➡️ Veröffentlichen: siehe [ANLEITUNG.md](ANLEITUNG.md)** (Supabase → GitHub → Vercel → Ionos-Domain, ohne Vorkenntnisse).

## Stack

- **Next.js 16** (App Router, Turbopack, standalone) — Frontend und API in einem
- **better-auth** — Login mit E-Mail+Passwort und Passkeys, Postgres via Drizzle
- **Supabase Postgres** — Produktionsdatenbank (lokal ersatzweise PGlite, ohne Setup)
- **Drizzle ORM** — Schema in `lib/db/schema.ts`, Migrationen in `drizzle/`
- **Serwist** (`@serwist/turbopack`) — Service Worker, PWA, Offline-Precache
- **IndexedDB + Sync-Engine** (`lib/store.tsx`, `lib/local-db.ts`) — lokal zuerst
  schreiben, bei Verbindung per `/api/sync` abgleichen (last-write-wins)

## Entwickeln

```bash
npm install
npm run dev          # http://localhost:3000 — nutzt lokale PGlite-DB (.pglite/)
npm run build && npm start   # Produktionsbuild inkl. Service Worker
```

Umgebungsvariablen: siehe [.env.example](.env.example). Ohne `DATABASE_URL`
läuft alles gegen die eingebettete lokale Datenbank.

## Struktur

| Pfad | Inhalt |
|---|---|
| `app/` | Seiten (App, Login, Offline-Fallback) und API-Routen (`api/auth`, `api/sync`) |
| `components/` | Die sechs Tabs + Header/Toast |
| `lib/` | Domänenlogik: Plan-Generator, Statistik/Prognose, CSV-Import, Sync, Auth |
| `drizzle/` | SQL-Migrationen (in Supabase per SQL Editor einspielen) |
| `legacy/` | Die ursprüngliche statische HTML-App (Referenz) |
