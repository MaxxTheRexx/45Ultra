"use client";

import { useMemo } from "react";
import { fmtDM } from "@/lib/dates";
import { useToday } from "@/lib/hooks";
import { currentWeek, phaseOfWeek, planStartMonday, planModel } from "@/lib/plan-model";
import { useApp, useSync } from "@/lib/store";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import * as ldb from "@/lib/local-db";
import type { PlanConfig } from "@/lib/types";

/* Deterministischer Zufall (mulberry32) — gleiche Config → gleiches Profil. */
function seededProfile(seed: number, steepness: number): string {
  let s = seed >>> 0;
  const rand = () => {
    s |= 0; s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  // Höhen-Amplitude aus der Steilheit (hm/km): flach ~0.3, sehr steil ~0.95
  const amp = Math.min(0.95, Math.max(0.3, steepness / 45));
  const n = 17;
  let h = 0.15;
  const pts: number[] = [];
  for (let i = 0; i <= n; i++) {
    const x = (i / n) * 1000;
    h = Math.min(0.95, Math.max(0.05, h + (rand() - 0.45) * amp));
    // sanftes Auslaufen zum Ziel
    const y = i === 0 ? 0.1 : i === n ? 0.1 : h;
    pts.push(x, 100 - y * 92);
  }
  let path = `M0,100 `;
  for (let i = 0; i < pts.length; i += 2) path += `L${pts[i].toFixed(0)},${pts[i + 1].toFixed(0)} `;
  return path + "L1000,100 Z";
}

const hashStr = (str: string) => {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
};

export function AppHeader() {
  const { syncStatus, syncNow } = useSync();
  const { planConfig, settings } = useApp();
  const router = useRouter();
  // Erst nach Mount berechnen (hydration-sicher); Tagesgenauigkeit reicht.
  const today = useToday();
  const now = today ? new Date(today + "T12:00").getTime() : null;

  const config = planConfig;
  const profilePath = useMemo(() => {
    if (!config) return "M0,100 L1000,100 Z";
    return seededProfile(hashStr(config.raceName + config.distanceKm), config.elevationHm / Math.max(1, config.distanceKm));
  }, [config]);

  if (!config) return null;

  const raceMs = new Date(config.raceDate + "T12:00").getTime();
  const start = planStartMonday(config);
  const startMs = start.getTime();
  const days = now ? Math.max(0, Math.ceil((raceMs - now) / 864e5)) : null;
  const doneFrac = now ? Math.min(1, Math.max(0, (now - startMs) / Math.max(1, raceMs - startMs))) : 0;
  const cx = doneFrac * 1000;
  const weeks = planModel(config).weeks;
  const cw = now ? currentWeek(config) : 1;
  const ph = phaseOfWeek(config, cw);

  const fmtNum = (n: number) => n.toLocaleString("de-DE");
  const subFacts = [
    config.raceLocation?.toUpperCase(),
    `${fmtNum(config.distanceKm)} KM`,
    `${fmtNum(config.elevationHm)} HM`,
    new Date(config.raceDate + "T12:00").toLocaleDateString("de-DE", { weekday: "short", day: "2-digit", month: "2-digit", year: "numeric" }).toUpperCase(),
  ].filter(Boolean).join(" · ");

  const syncLabel =
    syncStatus === "offline" ? "offline · Daten lokal gespeichert"
    : syncStatus === "syncing" ? "synchronisiert …"
    : syncStatus === "error" ? "Sync-Fehler · versucht es wieder"
    : syncStatus === "unauthorized" ? "abgemeldet · anmelden zum Sync"
    : "synchron";
  const dotCls = syncStatus === "offline" ? "off" : (syncStatus === "error" || syncStatus === "unauthorized") ? "err" : "";

  async function logout() {
    await authClient.signOut();
    await ldb.clearAllLocal();
    router.replace("/login");
  }

  return (
    <header>
      <div className="head-top">
        <div>
          <div className="race-title">{renderTitle(config)}</div>
          <div className="race-sub">
            {subFacts} · ZIEL <span style={{ color: "var(--orange)" }}>{settings.goal} h</span>
          </div>
          <div className="race-sub" style={{ fontSize: 11 }}>
            <button onClick={syncNow} title="Jetzt synchronisieren"
              style={{ background: "none", border: "none", color: "inherit", font: "inherit", padding: 0 }}>
              <span className={`sync-dot ${dotCls}`} />{syncLabel}
            </button>
            {" · "}
            <button onClick={logout}
              style={{ background: "none", border: "none", color: "var(--dim)", font: "inherit", padding: 0, textDecoration: "underline" }}>
              abmelden
            </button>
          </div>
        </div>
        <div className="countdown">
          <div className="num">{days ?? "–"}</div>
          <div className="lbl">Tage bis zum Start</div>
        </div>
      </div>
      <div className="profile-wrap" aria-hidden="true">
        <svg viewBox="0 0 1000 100" preserveAspectRatio="none">
          <defs>
            <clipPath id="clipDone"><rect x="0" y="0" width={cx} height="100" /></clipPath>
          </defs>
          <path d={profilePath} fill="#1D2721" stroke="#3A4A40" strokeWidth="1" />
          <path d={profilePath} fill="rgba(255,107,53,.28)" stroke="var(--orange)" strokeWidth="1.5" clipPath="url(#clipDone)" />
          <line x1={cx} y1="0" x2={cx} y2="100" stroke="var(--orange)" strokeWidth="1.5" strokeDasharray="3 3" />
          <circle cx={cx} cy="12" r="4" fill="var(--orange)" />
        </svg>
        <div className="profile-legend">
          <span>START {fmtDM(start)}</span>
          <span style={{ color: "var(--orange)" }}>
            {now && ph ? `WOCHE ${cw}/${weeks} · ${ph.name.toUpperCase()}` : ""}
          </span>
          <span>RENNTAG {fmtDM(new Date(config.raceDate + "T12:00"))}</span>
        </div>
      </div>
    </header>
  );
}

/* Rennname mit hervorgehobenem letzten Wort (z. B. Distanz-Kürzel). */
function renderTitle(config: PlanConfig) {
  const parts = config.raceName.trim().split(/\s+/);
  if (parts.length < 2) return config.raceName;
  const last = parts.pop();
  return <>{parts.join(" ")} <em>{last}</em></>;
}
