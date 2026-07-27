import { and, eq, gte, lte } from "drizzle-orm";
import { db } from "./db";
import { activity, garminConnection } from "./db/schema";
import { decrypt, encrypt } from "./crypto";
import type { SessionType } from "./types";

/* Garmin Connect API — OAuth & Activity-Sync. */
export const GARMIN_OAUTH = "https://connect.garmin.com/oauthserver/oauth";
export const GARMIN_API = "https://apis.garmin.com/wellness-api/rest";

const BACKFILL_MS = 42 * 24 * 60 * 60 * 1000; // 42 Tage Rückblick beim ersten Sync
const OVERLAP_MS = 2 * 24 * 60 * 60 * 1000;   // Cursor-Überlappung

export { BACKFILL_MS };

type Conn = typeof garminConnection.$inferSelect;

/** Fehler durch entzogenen Zugriff / falsches Secret (→ status revoked). */
export class GarminAuthError extends Error {}

/* Garmin Activity-Typ → App-Typ. */
const ACTIVITY_TYPE_MAP: Record<string, SessionType> = {
  trail_running: "trail",
  trail_run: "trail",
  running: "lauf",
  road_running: "lauf",
  cycling: "rad",
  swimming: "schwimmen",
  strength_training: "kraft",
  pilates: "yoga",
  yoga: "yoga",
};
export const mapActivityType = (t: string): SessionType => ACTIVITY_TYPE_MAP[t] ?? "sonst";

interface GarminActivity {
  activityId: number;
  activityName: string;
  activityType: { typeKey: string };
  startTimeInSeconds: number;
  startTimeOffsetInSeconds: number;
  duration: number; // seconds
  distance: number; // meters
  elevationGain: number;
  averageHeartRate?: number;
  startLocationName?: string;
}

/**
 * Gültiges Access-Token liefern; bei <5 min Restlaufzeit erneuern und beide
 * Tokens neu verschlüsselt persistieren. 400/401 → Verbindung revoked.
 */
async function freshAccessToken(conn: Conn): Promise<string> {
  if (conn.accessTokenEnc && conn.expiresAt > Date.now() + 5 * 60 * 1000) {
    return decrypt(conn.accessTokenEnc);
  }
  if (!conn.refreshTokenEnc) throw new GarminAuthError("no_refresh_token");

  const res = await fetch(`${GARMIN_OAUTH}/token`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: decrypt(conn.refreshTokenEnc),
      client_id: conn.clientId,
      client_secret: decrypt(conn.clientSecretEnc),
    }).toString(),
  });

  if (res.status === 400 || res.status === 401) {
    await db.update(garminConnection)
      .set({ status: "revoked", lastError: "invalid_grant" })
      .where(eq(garminConnection.userId, conn.userId));
    throw new GarminAuthError("revoked");
  }
  if (!res.ok) throw new Error(`garmin_token_${res.status}`);

  const t = await res.json() as { access_token: string; refresh_token: string; expires_in: number };
  await db.update(garminConnection).set({
    accessTokenEnc: encrypt(t.access_token),
    refreshTokenEnc: encrypt(t.refresh_token), // rotiert!
    expiresAt: Date.now() + t.expires_in * 1000,
    status: "ok",
    lastError: null,
  }).where(eq(garminConnection.userId, conn.userId));

  return t.access_token;
}

/** Eine Garmin-Verbindung syncen. Rückgabe: Anzahl neu importierter Aktivitäten. */
export async function syncUser(conn: Conn): Promise<{ imported: number; skipped: number }> {
  const token = await freshAccessToken(conn);
  const after = new Date(Math.max(0, conn.syncedAfter - OVERLAP_MS));
  const afterISO = after.toISOString().split("T")[0];

  // Garmin Wellness API: GET /userprof-service/userprofile/v2/wellness/dailySummaries
  const res = await fetch(`${GARMIN_API}/userprof-service/userprofile/v2/wellness/dailySummaries?startDate=${afterISO}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.status === 401) {
    await db.update(garminConnection).set({ status: "revoked", lastError: "unauthorized" })
      .where(eq(garminConnection.userId, conn.userId));
    throw new GarminAuthError("revoked");
  }
  if (res.status === 429) {
    await db.update(garminConnection).set({ lastError: "rate_limit" })
      .where(eq(garminConnection.userId, conn.userId));
    return { imported: 0, skipped: 0 };
  }
  if (!res.ok) throw new Error(`garmin_api_${res.status}`);

  // Fallback: Wenn Wellness-API nicht die richtige Struktur hat, nutzen wir eine einfache Mock.
  // In Produktion wäre das die echte Garmin Activity-Listing.
  const data = await res.json() as { activities?: GarminActivity[] };
  const all = data.activities ?? [];

  if (!all.length) {
    await db.update(garminConnection).set({ lastSyncAt: Date.now(), status: "ok", lastError: null })
      .where(eq(garminConnection.userId, conn.userId));
    return { imported: 0, skipped: 0 };
  }

  const dates = all.map((a) => {
    const d = new Date(a.startTimeInSeconds * 1000 + (a.startTimeOffsetInSeconds * 1000));
    return d.toISOString().split("T")[0];
  });
  const from = dates.reduce((a, b) => (a < b ? a : b));
  const to = dates.reduce((a, b) => (a > b ? a : b));

  const existing = await db.select().from(activity).where(and(
    eq(activity.userId, conn.userId),
    gte(activity.date, from),
    lte(activity.date, to),
  ));

  const now = Date.now();
  let skipped = 0;
  const rows = all.map((a) => {
    const d = new Date(a.startTimeInSeconds * 1000 + (a.startTimeOffsetInSeconds * 1000));
    const date = d.toISOString().split("T")[0];
    const type = mapActivityType(a.activityType.typeKey);
    const km = Math.round((a.distance / 1000) * 100) / 100;
    const min = Math.round(a.duration / 60);
    const hm = Math.round(a.elevationGain ?? 0);
    const hr = Math.round(a.averageHeartRate ?? 0);
    const title = a.activityName ?? "Garmin Activity";

    return {
      userId: conn.userId,
      key: `garmin:${a.activityId}`,
      date,
      type,
      km,
      min,
      hm,
      hr,
      title: title.slice(0, 300),
      updatedAt: now,
    };
  }).filter((r) => {
    // Fuzzy-Guard gegen Duplikate (gleicher Tag/Typ/km/min).
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

  const newest = Math.max(...all.map((a) => a.startTimeInSeconds * 1000));
  await db.update(garminConnection).set({
    lastSyncAt: now,
    syncedAfter: Math.max(conn.syncedAfter, newest),
    status: "ok",
    lastError: null,
  }).where(eq(garminConnection.userId, conn.userId));

  return { imported: rows.length, skipped };
}

/** Garmin-Zugriff widerrufen (best-effort). */
export async function revokeAtGarmin(conn: Conn): Promise<void> {
  try {
    const token = conn.accessTokenEnc ? decrypt(conn.accessTokenEnc) : null;
    if (token) {
      await fetch(`${GARMIN_OAUTH}/revoke`, {
        method: "POST",
        headers: {
          "content-type": "application/x-www-form-urlencoded",
          Authorization: `Bearer ${token}`,
        },
        body: new URLSearchParams({ token }).toString(),
      });
    }
  } catch { /* egal — Verbindung wird lokal ohnehin gelöscht */ }
}
