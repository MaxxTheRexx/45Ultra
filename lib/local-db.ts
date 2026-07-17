"use client";

import { openDB, type IDBPDatabase } from "idb";
import type { Activity, Checkin, PlanSession, Settings, SyncChanges } from "./types";

/**
 * Lokaler Speicher (IndexedDB) — die primäre Datenquelle der App.
 * Der Server ist nur Sync-Ziel; die App funktioniert komplett offline.
 *
 * Stores:
 *  - planSessions / checkins / activities: die Nutzdaten
 *  - meta: settings, lastSync, userId, hasAuthed
 *  - dirty: Referenzen geänderter Datensätze, die noch zum Server müssen
 */

/** Registry der synchronisierten Entitäten — einzige Stelle, die Kind ↔ Store ↔ Schlüssel verknüpft. */
const ENTITIES = {
  plan: { store: "planSessions", changesKey: "planSessions" },
  checkin: { store: "checkins", changesKey: "checkins" },
  activity: { store: "activities", changesKey: "activities" },
} as const;

type EntityKind = keyof typeof ENTITIES;
type DirtyRef = { store: EntityKind | "settings"; key: string };

const DATA_STORES = ["planSessions", "checkins", "activities"] as const;
const ALL_STORES = [...DATA_STORES, "meta", "dirty"] as const;

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDb() {
  dbPromise ??= openDB("heartcore", 1, {
    upgrade(db) {
      db.createObjectStore("planSessions", { keyPath: "id" });
      db.createObjectStore("checkins", { keyPath: "date" });
      db.createObjectStore("activities", { keyPath: "key" });
      db.createObjectStore("meta");
      db.createObjectStore("dirty");
    },
  });
  return dbPromise;
}

export async function loadAll() {
  const db = await getDb();
  const [plan, checkins, activities, settings, lastSync, userId, hasAuthed] =
    await Promise.all([
      db.getAll("planSessions") as Promise<PlanSession[]>,
      db.getAll("checkins") as Promise<Checkin[]>,
      db.getAll("activities") as Promise<Activity[]>,
      db.get("meta", "settings") as Promise<Settings | undefined>,
      db.get("meta", "lastSync") as Promise<number | undefined>,
      db.get("meta", "userId") as Promise<string | undefined>,
      db.get("meta", "hasAuthed") as Promise<boolean | undefined>,
    ]);
  return { plan, checkins, activities, settings, lastSync: lastSync ?? 0, userId, hasAuthed: !!hasAuthed };
}

/** Nur die Anmelde-Metadaten lesen (schneller Startpfad, keine Nutzdaten). */
export async function getAuthMeta() {
  const db = await getDb();
  const [userId, hasAuthed] = await Promise.all([
    db.get("meta", "userId") as Promise<string | undefined>,
    db.get("meta", "hasAuthed") as Promise<boolean | undefined>,
  ]);
  return { userId, hasAuthed: !!hasAuthed };
}

export async function getLastSync(): Promise<number> {
  const db = await getDb();
  return ((await db.get("meta", "lastSync")) as number | undefined) ?? 0;
}

async function putRecords<T>(
  kind: EntityKind,
  items: T[],
  keyOf: (item: T) => string,
  markDirty: boolean,
) {
  if (!items.length) return;
  const db = await getDb();
  const tx = db.transaction([ENTITIES[kind].store, "dirty"], "readwrite");
  for (const item of items) {
    tx.objectStore(ENTITIES[kind].store).put(item);
    if (markDirty) {
      const key = keyOf(item);
      tx.objectStore("dirty").put({ store: kind, key } satisfies DirtyRef, `${kind}:${key}`);
    }
  }
  await tx.done;
}

export const putPlanSessions = (items: PlanSession[], markDirty: boolean) =>
  putRecords("plan", items, (s) => s.id, markDirty);
export const putCheckins = (items: Checkin[], markDirty: boolean) =>
  putRecords("checkin", items, (c) => c.date, markDirty);
export const putActivities = (items: Activity[], markDirty: boolean) =>
  putRecords("activity", items, (a) => a.key, markDirty);

export async function putSettings(settings: Settings, markDirty: boolean) {
  const db = await getDb();
  const tx = db.transaction(["meta", "dirty"], "readwrite");
  tx.objectStore("meta").put(settings, "settings");
  if (markDirty) tx.objectStore("dirty").put({ store: "settings", key: "settings" } satisfies DirtyRef, "settings");
  await tx.done;
}

export async function setMeta(values: Partial<Record<"lastSync" | "userId" | "hasAuthed", unknown>>) {
  const db = await getDb();
  const tx = db.transaction("meta", "readwrite");
  for (const [key, value] of Object.entries(values)) tx.store.put(value, key);
  await tx.done;
}

/** Alle lokalen Daten löschen (Logout / Nutzerwechsel auf dem Gerät). */
export async function clearAllLocal() {
  const db = await getDb();
  const tx = db.transaction(ALL_STORES as unknown as string[], "readwrite");
  for (const store of ALL_STORES) tx.objectStore(store).clear();
  await tx.done;
}

/** Ein gesendeter Dirty-Eintrag: Referenz + updatedAt der gesendeten Version. */
type SentEntry = { ref: DirtyRef; stamp: number };

/** Sammelt alle als "dirty" markierten Datensätze für den Push zum Server. */
export async function collectDirty(): Promise<{ changes: SyncChanges; sent: Map<string, SentEntry> }> {
  const db = await getDb();
  const tx = db.transaction(ALL_STORES as unknown as string[], "readonly");
  const dirtyStore = tx.objectStore("dirty");
  const [keys, refs] = await Promise.all([
    dirtyStore.getAllKeys() as Promise<string[]>,
    dirtyStore.getAll() as Promise<DirtyRef[]>,
  ]);
  const records = await Promise.all(
    refs.map((ref) =>
      ref.store === "settings"
        ? tx.objectStore("meta").get("settings")
        : tx.objectStore(ENTITIES[ref.store].store).get(ref.key),
    ),
  );
  await tx.done;

  const changes: SyncChanges = { planSessions: [], checkins: [], activities: [] };
  const sent = new Map<string, SentEntry>();
  refs.forEach((ref, i) => {
    const rec = records[i] as { updatedAt: number } | undefined;
    if (!rec) return;
    if (ref.store === "settings") changes.settings = rec as Settings;
    else (changes[ENTITIES[ref.store].changesKey] as unknown[]).push(rec);
    sent.set(keys[i], { ref, stamp: rec.updatedAt });
  });
  return { changes, sent };
}

/** Nach erfolgreichem Push: gesendete Dirty-Einträge löschen (sofern unverändert). */
export async function clearDirty(sent: Map<string, SentEntry>) {
  const db = await getDb();
  const tx = db.transaction(ALL_STORES as unknown as string[], "readwrite");
  const entries = [...sent.entries()];
  const current = await Promise.all(
    entries.map(([, { ref }]) =>
      ref.store === "settings"
        ? tx.objectStore("meta").get("settings")
        : tx.objectStore(ENTITIES[ref.store].store).get(ref.key),
    ),
  );
  entries.forEach(([dirtyKey, { stamp }], i) => {
    const rec = current[i] as { updatedAt: number } | undefined;
    // Nur löschen, wenn der Datensatz während des Syncs nicht erneut geändert wurde.
    if (!rec || rec.updatedAt <= stamp) tx.objectStore("dirty").delete(dirtyKey);
  });
  await tx.done;
}
