"use client";

import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
} from "react";
import { generatePlan } from "./plan";
import { isOffline } from "./hooks";
import type { Activity, Checkin, PlanSession, Settings, SyncChanges } from "./types";
import { DEFAULT_SETTINGS } from "./types";
import * as ldb from "./local-db";

export type SyncStatus = "idle" | "syncing" | "offline" | "error" | "unauthorized";

interface AppData {
  ready: boolean;
  plan: PlanSession[]; // ohne gelöschte (Tombstones)
  checkins: Record<string, Checkin>;
  activities: Activity[];
  settings: Settings;
  toggleDone: (id: string) => void;
  moveSession: (id: string, date: string, week: number) => void;
  setCheckin: (date: string, patch: Partial<Omit<Checkin, "date" | "updatedAt">>) => void;
  addActivities: (items: Activity[]) => void;
  saveSettings: (patch: Partial<Omit<Settings, "updatedAt">>) => void;
  resetPlan: () => void;
  importBackup: (data: unknown) => boolean;
}

interface SyncState {
  syncStatus: SyncStatus;
  syncNow: () => void;
}

const DataCtx = createContext<AppData | null>(null);
const SyncCtx = createContext<SyncState>({ syncStatus: "idle", syncNow: () => {} });

export function useApp() {
  const v = useContext(DataCtx);
  if (!v) throw new Error("useApp außerhalb von <AppProvider>");
  return v;
}

/** Getrennt vom Daten-Context, damit Sync-Statuswechsel nicht alle Tabs neu rendern. */
export const useSync = () => useContext(SyncCtx);

const sortActivities = (items: Activity[]) =>
  [...items].sort((a, b) => (a.date < b.date ? 1 : -1));

/* ---------- Migration alter localStorage-Daten (statische App) ---------- */
function readLegacy(): { plan: PlanSession[]; checkins: Checkin[]; activities: Activity[]; settings?: Settings } | null {
  try {
    const rawPlan = localStorage.getItem("hc_plan_v2");
    if (!rawPlan) return null;
    const now = Date.now();
    const plan = (JSON.parse(rawPlan) as Omit<PlanSession, "updatedAt">[])
      .map((s) => ({ ...s, done: !!s.done, updatedAt: now }));
    const checkObj = JSON.parse(localStorage.getItem("hc_checkins_v1") || "{}") as Record<string, Omit<Checkin, "date" | "updatedAt">>;
    const checkins = Object.entries(checkObj).map(([date, c]) => ({ ...c, date, updatedAt: now }));
    const activities = (JSON.parse(localStorage.getItem("hc_activities_v1") || "[]") as Omit<Activity, "updatedAt">[])
      .map((a) => ({ ...a, updatedAt: now }));
    const setRaw = JSON.parse(localStorage.getItem("hc_settings_v1") || "null") as { goal?: string; weight?: number } | null;
    const settings = setRaw
      ? { goal: setRaw.goal || DEFAULT_SETTINGS.goal, weight: setRaw.weight || DEFAULT_SETTINGS.weight, updatedAt: now }
      : undefined;
    return { plan, checkins, activities, settings };
  } catch {
    return null;
  }
}

const mergeByKey = <T extends { updatedAt: number }>(
  local: Map<string, T>, incoming: T[], keyOf: (x: T) => string,
): T[] => {
  const fresh: T[] = [];
  for (const item of incoming) {
    const cur = local.get(keyOf(item));
    if (!cur || item.updatedAt > cur.updatedAt) {
      local.set(keyOf(item), item);
      fresh.push(item);
    }
  }
  return fresh;
};

export function AppProvider({ userId, children }: { userId: string | null; children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [planAll, setPlanAllState] = useState<PlanSession[]>([]);
  const [checkins, setCheckinsState] = useState<Record<string, Checkin>>({});
  const [activities, setActivitiesState] = useState<Activity[]>([]);
  const [settings, setSettingsState] = useState<Settings>(DEFAULT_SETTINGS);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");

  // Refs spiegeln den aktuellen Stand, damit Mutationen und Sync außerhalb
  // von setState-Updatern arbeiten können (Updater müssen frei von
  // Seiteneffekten sein — React darf sie mehrfach aufrufen).
  const planRef = useRef(planAll);
  const checkinsRef = useRef(checkins);
  const activitiesRef = useRef(activities);
  const settingsRef = useRef(settings);

  const setPlanAll = useCallback((v: PlanSession[]) => { planRef.current = v; setPlanAllState(v); }, []);
  const setCheckins = useCallback((v: Record<string, Checkin>) => { checkinsRef.current = v; setCheckinsState(v); }, []);
  const setActivities = useCallback((v: Activity[]) => { activitiesRef.current = v; setActivitiesState(v); }, []);
  const setSettings = useCallback((v: Settings) => { settingsRef.current = v; setSettingsState(v); }, []);

  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const syncing = useRef(false);

  /* ---------- Sync ---------- */
  const runSync = useCallback(async () => {
    if (syncing.current) return;
    if (isOffline()) {
      setSyncStatus("offline");
      return;
    }
    syncing.current = true;
    setSyncStatus("syncing");
    try {
      const lastSync = await ldb.getLastSync();
      const { changes, sent } = await ldb.collectDirty();
      const res = await fetch("/api/sync", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ since: lastSync, changes }),
      });
      if (res.status === 401) { setSyncStatus("unauthorized"); return; }
      if (!res.ok) { setSyncStatus("error"); return; }
      const { now, changes: incoming } = (await res.json()) as { now: number; changes: SyncChanges };
      await ldb.clearDirty(sent);

      // Server-Änderungen einarbeiten (last-write-wins gegen lokalen Stand)
      if (incoming.planSessions.length) {
        const map = new Map(planRef.current.map((s) => [s.id, s]));
        const fresh = mergeByKey(map, incoming.planSessions, (s) => s.id);
        if (fresh.length) {
          await ldb.putPlanSessions(fresh, false);
          setPlanAll([...map.values()]);
        }
      }
      if (incoming.checkins.length) {
        const map = new Map(Object.entries(checkinsRef.current));
        const fresh = mergeByKey(map, incoming.checkins, (c) => c.date);
        if (fresh.length) {
          await ldb.putCheckins(fresh, false);
          setCheckins(Object.fromEntries(map));
        }
      }
      if (incoming.activities.length) {
        const map = new Map(activitiesRef.current.map((a) => [a.key, a]));
        const fresh = mergeByKey(map, incoming.activities, (a) => a.key);
        if (fresh.length) {
          await ldb.putActivities(fresh, false);
          setActivities(sortActivities([...map.values()]));
        }
      }
      if (incoming.settings && incoming.settings.updatedAt > settingsRef.current.updatedAt) {
        await ldb.putSettings(incoming.settings, false);
        setSettings(incoming.settings);
      }
      await ldb.setMeta({ lastSync: now, hasAuthed: true });
      setSyncStatus("idle");
    } catch {
      setSyncStatus(isOffline() ? "offline" : "error");
    } finally {
      syncing.current = false;
    }
  }, [setActivities, setCheckins, setPlanAll, setSettings]);

  const requestSync = useCallback(() => {
    if (syncTimer.current) clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(() => void runSync(), 1500);
  }, [runSync]);

  /* ---------- Initialisierung ---------- */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const stored = await ldb.loadAll();

      // Gerät gehörte einem anderen Account: lokale Daten verwerfen
      if (userId && stored.userId && stored.userId !== userId) {
        await ldb.clearAllLocal();
        stored.plan = []; stored.checkins = []; stored.activities = [];
        stored.settings = undefined; stored.lastSync = 0;
      }
      if (userId) await ldb.setMeta({ userId });

      let plan = stored.plan;
      let checks = stored.checkins;
      let acts = stored.activities;
      let sett = stored.settings;

      if (plan.length === 0) {
        const legacy = readLegacy();
        if (legacy) {
          plan = legacy.plan;
          checks = legacy.checkins;
          acts = legacy.activities;
          sett = legacy.settings ?? sett;
          await ldb.putCheckins(checks, true);
          await ldb.putActivities(acts, true);
          if (sett) await ldb.putSettings(sett, true);
        } else {
          plan = generatePlan();
        }
        await ldb.putPlanSessions(plan, true);
      }

      if (cancelled) return;
      setPlanAll(plan);
      setCheckins(Object.fromEntries(checks.map((c) => [c.date, c])));
      setActivities(sortActivities(acts));
      setSettings(sett ?? { ...DEFAULT_SETTINGS, updatedAt: Date.now() });
      setReady(true);
      void runSync();
    })();
    return () => { cancelled = true; };
  }, [userId, runSync, setActivities, setCheckins, setPlanAll, setSettings]);

  /* ---------- Auto-Sync: online-Event, Sichtbarkeit, Intervall ---------- */
  useEffect(() => {
    const onOnline = () => void runSync();
    const onVisible = () => { if (document.visibilityState === "visible") void runSync(); };
    window.addEventListener("online", onOnline);
    document.addEventListener("visibilitychange", onVisible);
    const iv = setInterval(() => {
      if (document.visibilityState === "visible") void runSync();
    }, 5 * 60 * 1000);
    return () => {
      window.removeEventListener("online", onOnline);
      document.removeEventListener("visibilitychange", onVisible);
      clearInterval(iv);
    };
  }, [runSync]);

  /* ---------- Mutationen (arbeiten auf den Refs, Seiteneffekte einmalig) ---------- */
  const patchSessions = useCallback((ids: Set<string>, patch: (s: PlanSession) => PlanSession) => {
    const changed: PlanSession[] = [];
    const next = planRef.current.map((s) => {
      if (!ids.has(s.id)) return s;
      const u = patch(s);
      changed.push(u);
      return u;
    });
    if (!changed.length) return;
    setPlanAll(next);
    void ldb.putPlanSessions(changed, true);
    requestSync();
  }, [requestSync, setPlanAll]);

  const toggleDone = useCallback((id: string) => {
    patchSessions(new Set([id]), (s) => ({ ...s, done: !s.done, updatedAt: Date.now() }));
  }, [patchSessions]);

  const moveSession = useCallback((id: string, date: string, week: number) => {
    patchSessions(new Set([id]), (s) => ({ ...s, date, week, updatedAt: Date.now() }));
  }, [patchSessions]);

  const setCheckin = useCallback((date: string, patch: Partial<Omit<Checkin, "date" | "updatedAt">>) => {
    const cur = checkinsRef.current[date] ?? { date, updatedAt: 0 };
    const next: Checkin = { ...cur, ...patch, date, updatedAt: Date.now() };
    setCheckins({ ...checkinsRef.current, [date]: next });
    void ldb.putCheckins([next], true);
    requestSync();
  }, [requestSync, setCheckins]);

  const addActivities = useCallback((items: Activity[]) => {
    if (!items.length) return;
    const map = new Map(activitiesRef.current.map((a) => [a.key, a]));
    items.forEach((a) => map.set(a.key, a));
    setActivities(sortActivities([...map.values()]));
    void ldb.putActivities(items, true);
    requestSync();
  }, [requestSync, setActivities]);

  const saveSettings = useCallback((patch: Partial<Omit<Settings, "updatedAt">>) => {
    const next = { ...settingsRef.current, ...patch, updatedAt: Date.now() };
    setSettings(next);
    void ldb.putSettings(next, true);
    requestSync();
  }, [requestSync, setSettings]);

  /** Plan neu generieren: alte Einheiten als gelöscht markieren (Tombstones für den Sync). */
  const resetPlan = useCallback(() => {
    const now = Date.now();
    const tombstones = planRef.current
      .filter((s) => !s.deleted)
      .map((s) => ({ ...s, deleted: true, updatedAt: now }));
    const fresh = generatePlan(now + 1);
    setPlanAll([...tombstones, ...fresh]);
    void ldb.putPlanSessions([...tombstones, ...fresh], true);
    requestSync();
  }, [requestSync, setPlanAll]);

  const importBackup = useCallback((data: unknown): boolean => {
    try {
      const d = data as { plan?: PlanSession[]; checkins?: Record<string, Checkin> | Checkin[]; activities?: Activity[]; settings?: Settings };
      const now = Date.now();
      if (Array.isArray(d.plan)) {
        const plan = d.plan.map((s) => ({ ...s, updatedAt: now }));
        void ldb.putPlanSessions(plan, true);
        setPlanAll(plan);
      }
      if (d.checkins) {
        const arr = Array.isArray(d.checkins)
          ? d.checkins
          : Object.entries(d.checkins).map(([date, c]) => ({ ...c, date }));
        const checks = arr.map((c) => ({ ...c, updatedAt: now }));
        void ldb.putCheckins(checks, true);
        setCheckins(Object.fromEntries(checks.map((c) => [c.date, c])));
      }
      if (Array.isArray(d.activities)) {
        const acts = d.activities.map((a) => ({ ...a, updatedAt: now }));
        void ldb.putActivities(acts, true);
        setActivities(sortActivities(acts));
      }
      if (d.settings) {
        const s = {
          goal: d.settings.goal || DEFAULT_SETTINGS.goal,
          weight: d.settings.weight || DEFAULT_SETTINGS.weight,
          updatedAt: now,
        };
        void ldb.putSettings(s, true);
        setSettings(s);
      }
      requestSync();
      return true;
    } catch {
      return false;
    }
  }, [requestSync, setActivities, setCheckins, setPlanAll, setSettings]);

  const plan = useMemo(() => planAll.filter((s) => !s.deleted), [planAll]);

  const dataValue = useMemo<AppData>(() => ({
    ready, plan, checkins, activities, settings,
    toggleDone, moveSession, setCheckin, addActivities, saveSettings,
    resetPlan, importBackup,
  }), [ready, plan, checkins, activities, settings, toggleDone, moveSession,
    setCheckin, addActivities, saveSettings, resetPlan, importBackup]);

  const syncValue = useMemo<SyncState>(
    () => ({ syncStatus, syncNow: () => void runSync() }),
    [syncStatus, runSync],
  );

  return (
    <DataCtx.Provider value={dataValue}>
      <SyncCtx.Provider value={syncValue}>{children}</SyncCtx.Provider>
    </DataCtx.Provider>
  );
}
