"use client";

import { BLOCK_START, RACE_DATE } from "@/lib/dates";
import { useToday } from "@/lib/hooks";
import { currentWeek, phaseOfWeek } from "@/lib/plan";
import { useSync } from "@/lib/store";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import * as ldb from "@/lib/local-db";

/* Stilisiertes 45k/2000hm-Profil (Königstuhl-Charakter: zwei große Rampen) */
const PTS = [0, 8, 60, 20, 120, 14, 180, 48, 240, 72, 300, 60, 360, 78, 420, 50, 480, 42, 540, 66, 600, 88, 660, 70, 720, 76, 780, 52, 840, 34, 900, 44, 960, 18, 1000, 10];
let profilePath = "M0,100 ";
for (let i = 0; i < PTS.length; i += 2) profilePath += `L${PTS[i]},${100 - PTS[i + 1]} `;
profilePath += "L1000,100 Z";

export function AppHeader() {
  const { syncStatus, syncNow } = useSync();
  const router = useRouter();
  // Erst nach Mount berechnen (hydration-sicher); Tagesgenauigkeit reicht
  // für Countdown und Fortschrittsbalken.
  const today = useToday();
  const now = today ? new Date(today + "T12:00").getTime() : null;

  const days = now ? Math.max(0, Math.ceil((RACE_DATE.getTime() - now) / 864e5)) : null;
  const doneFrac = now
    ? Math.min(1, Math.max(0, (now - BLOCK_START.getTime()) / (RACE_DATE.getTime() - BLOCK_START.getTime())))
    : 0;
  const cx = doneFrac * 1000;
  const cw = now ? currentWeek() : 1;
  const ph = phaseOfWeek(cw);

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
          <div className="race-title">Heart Core <em>45K</em></div>
          <div className="race-sub">
            HEIDELBERG · 45 KM · 2.000 HM · SO 20.09.2026 · ZIEL <span style={{ color: "var(--orange)" }}>SUB 5:00</span>
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
          <span>TRAININGSBLOCK 08.07.</span>
          <span style={{ color: "var(--orange)" }}>
            {now && ph ? `WOCHE ${cw}/11 · ${ph.name.toUpperCase()}` : ""}
          </span>
          <span>RACE DAY 20.09.</span>
        </div>
      </div>
    </header>
  );
}
