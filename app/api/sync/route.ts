import { NextRequest, NextResponse } from "next/server";
import { and, eq, getTableColumns, gt, sql, type SQL } from "drizzle-orm";
import type { PgColumn, PgTable } from "drizzle-orm/pg-core";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { activity, checkin, planSession, userSettings } from "@/lib/db/schema";
import { DEFAULT_SETTINGS } from "@/lib/types";
import type { Activity, Checkin, PlanSession, Settings, SyncChanges } from "@/lib/types";

/**
 * Ein Roundtrip synchronisiert alles:
 * Der Client schickt seine lokalen Änderungen + den Zeitstempel des letzten
 * Syncs. Der Server übernimmt Änderungen nach "last-write-wins" (neuerer
 * updated_at gewinnt) und liefert alles zurück, was sich seither getan hat.
 */

// Überlappungsfenster: fängt Schreibvorgänge ab, die während des letzten
// Syncs von einem anderen Gerät liefen. Upserts sind idempotent.
const OVERLAP_MS = 5 * 60 * 1000;
const MAX_ROWS = 5000;
const str = (v: unknown, max = 10000) => String(v ?? "").slice(0, max);
const num = (v: unknown) => (Number.isFinite(Number(v)) ? Number(v) : 0);

/**
 * Upsert mit last-write-wins: Bei Konflikt werden ALLE Nicht-Schlüssel-Spalten
 * aus dem eingehenden Datensatz übernommen (aus dem Schema abgeleitet — neue
 * Spalten können hier nicht vergessen werden), aber nur wenn er neuer ist.
 */
function upsertIfNewer<T extends PgTable & { updatedAt: PgColumn }>(
  table: T,
  keys: PgColumn[],
  rows: Record<string, unknown>[],
) {
  const keyNames = new Set(keys.map((k) => k.name));
  const set: Record<string, SQL> = {};
  for (const [prop, col] of Object.entries(getTableColumns(table))) {
    if (!keyNames.has(col.name)) set[prop] = sql.raw(`excluded."${col.name}"`);
  }
  return db.insert(table).values(rows as never).onConflictDoUpdate({
    target: keys,
    set,
    setWhere: sql`excluded.updated_at > ${table.updatedAt}`,
  });
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const userId = session.user.id;

  let body: { since?: number; changes?: Partial<SyncChanges> };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  const now = Date.now();
  const since = Math.max(0, num(body.since) - OVERLAP_MS);
  const ch = body.changes ?? {};

  /* ---------- Push: Client-Änderungen übernehmen (parallel, unabhängige Tabellen) ---------- */
  const pushes: Promise<unknown>[] = [];

  const sessions = (ch.planSessions ?? []).slice(0, MAX_ROWS);
  if (sessions.length) {
    pushes.push(upsertIfNewer(planSession, [planSession.userId, planSession.id],
      sessions.map((s) => ({
        userId,
        id: str(s.id, 64),
        date: str(s.date, 10),
        week: num(s.week),
        type: str(s.type, 20),
        title: str(s.title, 300),
        dur: num(s.dur),
        detail: str(s.detail),
        km: s.km == null ? null : num(s.km),
        hm: s.hm == null ? null : num(s.hm),
        done: !!s.done,
        deleted: !!s.deleted,
        updatedAt: num(s.updatedAt),
      }))));
  }

  const checkins = (ch.checkins ?? []).slice(0, MAX_ROWS);
  if (checkins.length) {
    pushes.push(upsertIfNewer(checkin, [checkin.userId, checkin.date],
      checkins.map((c) => ({
        userId,
        date: str(c.date, 10),
        energy: c.energy == null ? null : num(c.energy),
        knee: c.knee == null ? null : str(c.knee, 10),
        sleep: c.sleep == null ? null : num(c.sleep),
        rpe: c.rpe == null ? null : num(c.rpe),
        note: c.note == null ? null : str(c.note, 5000),
        updatedAt: num(c.updatedAt),
      }))));
  }

  const activities = (ch.activities ?? []).slice(0, MAX_ROWS);
  if (activities.length) {
    pushes.push(upsertIfNewer(activity, [activity.userId, activity.key],
      activities.map((a) => ({
        userId,
        key: str(a.key, 120),
        date: str(a.date, 10),
        type: str(a.type, 20),
        km: num(a.km),
        min: num(a.min),
        hm: num(a.hm),
        hr: num(a.hr),
        title: str(a.title, 300),
        updatedAt: num(a.updatedAt),
      }))));
  }

  if (ch.settings && num(ch.settings.updatedAt) > 0) {
    pushes.push(upsertIfNewer(userSettings, [userSettings.userId], [{
      userId,
      goal: str(ch.settings.goal, 10) || DEFAULT_SETTINGS.goal,
      weight: num(ch.settings.weight) || DEFAULT_SETTINGS.weight,
      updatedAt: num(ch.settings.updatedAt),
    }]));
  }

  await Promise.all(pushes);

  /* ---------- Pull: alles Neue seit `since` zurückgeben ---------- */
  const [outSessions, outCheckins, outActivities, outSettings] = await Promise.all([
    db.select().from(planSession)
      .where(and(eq(planSession.userId, userId), gt(planSession.updatedAt, since))),
    db.select().from(checkin)
      .where(and(eq(checkin.userId, userId), gt(checkin.updatedAt, since))),
    db.select().from(activity)
      .where(and(eq(activity.userId, userId), gt(activity.updatedAt, since))),
    db.select().from(userSettings)
      .where(and(eq(userSettings.userId, userId), gt(userSettings.updatedAt, since))),
  ]);

  const changes: SyncChanges = {
    planSessions: outSessions.map((s): PlanSession => ({
      id: s.id, date: s.date, week: s.week, type: s.type as PlanSession["type"],
      title: s.title, dur: s.dur, detail: s.detail,
      km: s.km ?? undefined, hm: s.hm ?? undefined,
      done: s.done, deleted: s.deleted || undefined, updatedAt: s.updatedAt,
    })),
    checkins: outCheckins.map((c): Checkin => ({
      date: c.date, energy: c.energy ?? undefined,
      knee: (c.knee ?? undefined) as Checkin["knee"],
      sleep: c.sleep ?? undefined, rpe: c.rpe ?? undefined,
      note: c.note ?? undefined, updatedAt: c.updatedAt,
    })),
    activities: outActivities.map((a): Activity => ({
      key: a.key, date: a.date, type: a.type as Activity["type"],
      km: a.km, min: a.min, hm: a.hm, hr: a.hr, title: a.title, updatedAt: a.updatedAt,
    })),
    settings: outSettings[0]
      ? ({ goal: outSettings[0].goal, weight: outSettings[0].weight, updatedAt: outSettings[0].updatedAt } satisfies Settings)
      : undefined,
  };

  return NextResponse.json({ now, changes });
}
