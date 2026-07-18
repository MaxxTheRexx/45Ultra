import { and, eq, gte, lte } from "drizzle-orm";
import { db } from "./db";
import { activity, stravaConnection } from "./db/schema";
import { decrypt, encrypt } from "./crypto";
import type { SessionType } from "./types";

/* Basis-URLs zentral — Stravas API-Host wechselt ab 01/2027 auf www.api-v3.strava.com. */
export const STRAVA_API = "https://www.strava.com/api/v3";
export const STRAVA_OAUTH = "https://www.strava.com/oauth";

const BACKFILL_MS = 42 * 24 * 60 * 60 * 1000; // 42 Tage Rückblick beim ersten Sync
const OVERLAP_MS = 2 * 24 * 60 * 60 * 1000;   // Cursor-Überlappung (Garmin lädt oft verspätet hoch)

export { BACKFILL_MS };

type Conn = typeof stravaConnection.$inferSelect;

/** Fehler durch entzogenen Zugriff / falsches Secret (→ status revoked). */
export class StravaAuthError extends Error {}

/* Strava sport_type → App-Typ, deckungsgleich mit classify() in lib/csv.ts. */
const SPORT_MAP: Record<string, SessionType> = {
  TrailRun: "trail", Hike: "trail",
  Run: "lauf", VirtualRun: "lauf",
  Ride: "rad", VirtualRide: "rad", GravelRide: "rad", MountainBikeRide: "rad", EBikeRide: "rad",
  Swim: "schwimmen",
  Yoga: "yoga", Pilates: "yoga",
  WeightTraining: "kraft", Workout: "kraft", Crossfit: "kraft", HighIntensityIntervalTraining: "kraft",
};
export const mapSport = (s: string): SessionType => SPORT_MAP[s] ?? "sonst";

interface StravaActivity {
  id: number; name: string; sport_type: string;
  start_date: string; start_date_local: string;
  distance: number; moving_time: number; total_elevation_gain?: number; average_heartrate?: number;
}

/**
 * Gültiges Access-Token liefern; bei <5 min Restlaufzeit erneuern und BEIDE
 * (rotierten) Tokens neu verschlüsselt persistieren. 400/401 → Verbindung revoked.
 */
async function freshAccessToken(conn: Conn): Promise<string> {
  if (conn.accessTokenEnc && conn.expiresAt > Date.now() + 5 * 60 * 1000) {
    return decrypt(conn.accessTokenEnc);
  }
  if (!conn.refreshTokenEnc) throw new StravaAuthError("no_refresh_token");
  const res = await fetch(`${STRAVA_OAUTH}/token`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      client_id: conn.clientId,
      client_secret: decrypt(conn.clientSecretEnc),
      grant_type: "refresh_token",
      refresh_token: decrypt(conn.refreshTokenEnc),
    }),
  });
  if (res.status === 400 || res.status === 401) {
    await db.update(stravaConnection)
      .set({ status: "revoked", lastError: "invalid_grant" })
      .where(eq(stravaConnection.userId, conn.userId));
    throw new StravaAuthError("revoked");
  }
  if (!res.ok) throw new Error(`strava_token_${res.status}`);
  const t = await res.json() as { access_token: string; refresh_token: string; expires_at: number };
  await db.update(stravaConnection).set({
    accessTokenEnc: encrypt(t.access_token),
    refreshTokenEnc: encrypt(t.refresh_token), // rotiert!
    expiresAt: t.expires_at * 1000,
    status: "ok", lastError: null,
  }).where(eq(stravaConnection.userId, conn.userId));
  return t.access_token;
}

/** Eine Strava-Verbindung syncen. Rückgabe: Anzahl neu importierter Aktivitäten. */
export async function syncUser(conn: Conn): Promise<{ imported: number; skipped: number }> {
  const token = await freshAccessToken(conn);
  const after = Math.floor(Math.max(0, conn.syncedAfter - OVERLAP_MS) / 1000); // epoch Sekunden

  const all: StravaActivity[] = [];
  for (let page = 1; page <= 10; page++) {
    const res = await fetch(`${STRAVA_API}/athlete/activities?after=${after}&per_page=100&page=${page}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status === 401) {
      await db.update(stravaConnection).set({ status: "revoked", lastError: "unauthorized" })
        .where(eq(stravaConnection.userId, conn.userId));
      throw new StravaAuthError("revoked");
    }
    if (res.status === 429) { // Rate-Limit: Cursor behalten, nächster Lauf holt nach (idempotent)
      await db.update(stravaConnection).set({ lastError: "rate_limit" })
        .where(eq(stravaConnection.userId, conn.userId));
      break;
    }
    if (!res.ok) throw new Error(`strava_api_${res.status}`);
    const batch = await res.json() as StravaActivity[];
    all.push(...batch);
    if (batch.length < 100) break;
  }

  if (!all.length) {
    await db.update(stravaConnection).set({ lastSyncAt: Date.now(), status: "ok", lastError: null })
      .where(eq(stravaConnection.userId, conn.userId));
    return { imported: 0, skipped: 0 };
  }

  const dates = all.map((a) => a.start_date_local.slice(0, 10));
  const from = dates.reduce((a, b) => (a < b ? a : b));
  const to = dates.reduce((a, b) => (a > b ? a : b));
  const existing = await db.select().from(activity).where(and(
    eq(activity.userId, conn.userId), gte(activity.date, from), lte(activity.date, to),
  ));

  const now = Date.now();
  let skipped = 0;
  const rows = all.map((a) => ({
    userId: conn.userId,
    key: `strava:${a.id}`,
    date: a.start_date_local.slice(0, 10),
    type: mapSport(a.sport_type),
    km: Math.round(a.distance / 10) / 100,      // m → km, 2 Dezimalen
    min: Math.round(a.moving_time / 60),
    hm: Math.round(a.total_elevation_gain ?? 0),
    hr: Math.round(a.average_heartrate ?? 0),
    title: (a.name ?? "").slice(0, 300),
    updatedAt: now,                             // → erreicht Geräte beim nächsten /api/sync
  })).filter((r) => {
    // Fuzzy-Guard gegen bereits per CSV importierte, gleiche Garmin-Aktivität.
    const dup = existing.some((e) =>
      e.key !== r.key && e.date === r.date && e.type === r.type &&
      Math.abs(e.km - r.km) < 0.3 && Math.abs(e.min - r.min) <= 5);
    if (dup) skipped++;
    return !dup;
  });

  if (rows.length) {
    await db.insert(activity).values(rows)
      .onConflictDoNothing({ target: [activity.userId, activity.key] });
  }
  const newest = Math.max(...all.map((a) => new Date(a.start_date).getTime()));
  await db.update(stravaConnection).set({
    lastSyncAt: now,
    syncedAfter: Math.max(conn.syncedAfter, newest),
    status: "ok", lastError: null,
  }).where(eq(stravaConnection.userId, conn.userId));
  return { imported: rows.length, skipped };
}

/** Zugriff bei Strava widerrufen (best-effort). */
export async function revokeAtStrava(conn: Conn): Promise<void> {
  try {
    const token = conn.accessTokenEnc ? decrypt(conn.accessTokenEnc) : null;
    // Empfohlener Weg seit 06/2026: /oauth/revoke mit HTTP-Basic client_id:client_secret.
    const basic = Buffer.from(`${conn.clientId}:${decrypt(conn.clientSecretEnc)}`).toString("base64");
    const res = await fetch(`${STRAVA_OAUTH}/revoke`, {
      method: "POST",
      headers: { Authorization: `Basic ${basic}` },
    });
    if (!res.ok && token) {
      await fetch(`${STRAVA_OAUTH}/deauthorize?access_token=${token}`, { method: "POST" });
    }
  } catch { /* egal — Verbindung wird lokal ohnehin gelöscht */ }
}
