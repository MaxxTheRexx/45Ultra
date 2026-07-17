import * as schema from "./schema";
import type { PgDatabase } from "drizzle-orm/pg-core";

/**
 * Datenbank-Anbindung:
 * - Produktion (Vercel + Supabase): DATABASE_URL zeigt auf den Supabase-Pooler
 *   (Transaction Mode, Port 6543) → postgres-js mit prepare:false.
 * - Lokale Entwicklung ohne DATABASE_URL: eingebettete Postgres-Datenbank
 *   (PGlite, Datei-Ordner .pglite/) — kein Setup nötig.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Db = PgDatabase<any, typeof schema>;

async function createDb(): Promise<Db> {
  if (process.env.DATABASE_URL) {
    const { drizzle } = await import("drizzle-orm/postgres-js");
    const { default: postgres } = await import("postgres");
    const client = postgres(process.env.DATABASE_URL, { prepare: false });
    return drizzle(client, { schema }) as unknown as Db;
  }
  const { drizzle } = await import("drizzle-orm/pglite");
  // Während `next build` laden mehrere Worker dieses Modul parallel —
  // dort nur eine Wegwerf-DB im Speicher, keine Datei, keine Migration.
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return drizzle("memory://", { schema }) as unknown as Db;
  }
  const { migrate } = await import("drizzle-orm/pglite/migrator");
  const db = drizzle("./.pglite", { schema });
  // Lokale Dev-DB: Tabellen automatisch anlegen/aktualisieren.
  await migrate(db, { migrationsFolder: "./drizzle" });
  return db as unknown as Db;
}

// Singleton über Hot-Reloads hinweg (Dev) und pro Lambda-Instanz (Vercel).
const g = globalThis as unknown as { __heartcoreDb?: Promise<Db> };

export const db = await (g.__heartcoreDb ?? (g.__heartcoreDb = createDb()));
