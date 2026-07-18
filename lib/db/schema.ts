import {
  pgTable, text, boolean, timestamp, integer, real, bigint, primaryKey,
} from "drizzle-orm/pg-core";

/* =========================================================
   better-auth Kern-Tabellen (User, Session, Account, Verification)
   ========================================================= */
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/* Passkey-Plugin (@better-auth/passkey) */
export const passkey = pgTable("passkey", {
  id: text("id").primaryKey(),
  name: text("name"),
  publicKey: text("public_key").notNull(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  credentialID: text("credential_i_d").notNull(),
  counter: integer("counter").notNull(),
  deviceType: text("device_type").notNull(),
  backedUp: boolean("backed_up").notNull(),
  transports: text("transports"),
  createdAt: timestamp("created_at").defaultNow(),
  aaguid: text("aaguid"),
});

/* =========================================================
   App-Daten — alles nutzerbezogen, updated_at (Unix ms) für Sync
   ========================================================= */
export const planSession = pgTable("plan_session", {
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  id: text("id").notNull(), // clientseitig erzeugt, z.B. "w4d2i0"
  date: text("date").notNull(),
  week: integer("week").notNull(),
  type: text("type").notNull(),
  title: text("title").notNull(),
  dur: integer("dur").notNull(),
  detail: text("detail").notNull(),
  km: real("km"),
  hm: real("hm"),
  done: boolean("done").notNull().default(false),
  deleted: boolean("deleted").notNull().default(false),
  updatedAt: bigint("updated_at", { mode: "number" }).notNull(),
}, (t) => [primaryKey({ columns: [t.userId, t.id] })]);

export const checkin = pgTable("checkin", {
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  date: text("date").notNull(),
  energy: integer("energy"),
  knee: text("knee"),
  sleep: integer("sleep"),
  rpe: integer("rpe"),
  note: text("note"),
  updatedAt: bigint("updated_at", { mode: "number" }).notNull(),
}, (t) => [primaryKey({ columns: [t.userId, t.date] })]);

export const activity = pgTable("activity", {
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  key: text("key").notNull(),
  date: text("date").notNull(),
  type: text("type").notNull(),
  km: real("km").notNull().default(0),
  min: integer("min").notNull().default(0),
  hm: integer("hm").notNull().default(0),
  hr: integer("hr").notNull().default(0),
  title: text("title").notNull().default(""),
  updatedAt: bigint("updated_at", { mode: "number" }).notNull(),
}, (t) => [primaryKey({ columns: [t.userId, t.key] })]);

export const userSettings = pgTable("user_settings", {
  userId: text("user_id").primaryKey().references(() => user.id, { onDelete: "cascade" }),
  goal: text("goal").notNull().default("5:00"),
  weight: real("weight").notNull().default(75),
  updatedAt: bigint("updated_at", { mode: "number" }).notNull(),
});

/* Strava-Verbindung pro Nutzer (BYOK: eigene Strava-API-App).
   Geheimnisse (Client-Secret, Tokens) sind AES-256-GCM-verschlüsselt. */
export const stravaConnection = pgTable("strava_connection", {
  userId: text("user_id").primaryKey().references(() => user.id, { onDelete: "cascade" }),
  clientId: text("client_id").notNull(),          // öffentlich (steht in der authorize-URL)
  clientSecretEnc: text("client_secret_enc").notNull(),
  accessTokenEnc: text("access_token_enc"),        // null bis OAuth abgeschlossen
  refreshTokenEnc: text("refresh_token_enc"),
  expiresAt: bigint("expires_at", { mode: "number" }).notNull().default(0), // Unix ms
  athleteId: text("athlete_id"),
  athleteName: text("athlete_name"),
  syncedAfter: bigint("synced_after", { mode: "number" }).notNull().default(0), // Cursor, Unix ms
  lastSyncAt: bigint("last_sync_at", { mode: "number" }).notNull().default(0),
  status: text("status").notNull().default("pending"), // pending | ok | revoked | error
  lastError: text("last_error"),
  createdAt: bigint("created_at", { mode: "number" }).notNull(),
});

/* Individuelle Renn-/Plankonfiguration pro Nutzer (siehe PlanConfig in types.ts). */
export const userPlanConfig = pgTable("user_plan_config", {
  userId: text("user_id").primaryKey().references(() => user.id, { onDelete: "cascade" }),
  raceName: text("race_name").notNull(),
  raceLocation: text("race_location"),
  raceDate: text("race_date").notNull(),
  distanceKm: real("distance_km").notNull(),
  elevationHm: integer("elevation_hm").notNull(),
  planStart: text("plan_start").notNull(),
  trainingDays: integer("training_days").notNull().default(5),
  philosophy: text("philosophy").notNull().default("haeufig"),
  intensity: text("intensity").notNull().default("locker"),
  version: integer("version").notNull().default(1),
  preset: text("preset"),
  updatedAt: bigint("updated_at", { mode: "number" }).notNull(),
});
