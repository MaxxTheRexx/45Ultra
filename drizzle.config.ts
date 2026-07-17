import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    // Für `drizzle-kit push` die DIREKTE Supabase-Verbindung verwenden
    // (Session Mode, Port 5432) — nicht den Transaction-Pooler.
    url: process.env.DATABASE_URL ?? "",
  },
});
