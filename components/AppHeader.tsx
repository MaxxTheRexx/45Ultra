"use client";

import { useToday } from "@/lib/hooks";
import { useApp, useSync } from "@/lib/store";
import type { PlanConfig } from "@/lib/types";

/** Schlanker Kopf: Wortmarke/Rennname, Ziel-Zeile, Sync-Status, Countdown-Chip.
    Höhenprofil + Logout leben jetzt im Plan- bzw. Profil-Tab. */
export function AppHeader() {
  const { syncStatus, syncNow } = useSync();
  const { planConfig, settings } = useApp();
  const today = useToday();
  const config = planConfig;
  if (!config) return null;

  const now = today ? new Date(today + "T12:00").getTime() : null;
  const raceMs = new Date(config.raceDate + "T12:00").getTime();
  const days = now ? Math.max(0, Math.ceil((raceMs - now) / 864e5)) : null;

  const fmtNum = (n: number) => n.toLocaleString("de-DE");
  const subFacts = [
    config.raceLocation,
    `${fmtNum(config.distanceKm)} km`,
    `${fmtNum(config.elevationHm)} hm`,
    `Ziel ${settings.goal} h`,
  ].filter(Boolean).join(" · ");

  const syncLabel =
    syncStatus === "offline" ? "offline · lokal gespeichert"
    : syncStatus === "syncing" ? "synchronisiert …"
    : syncStatus === "error" ? "Sync-Fehler · erneuter Versuch"
    : syncStatus === "unauthorized" ? "abgemeldet · anmelden zum Sync"
    : "synchron";
  const dotCls = syncStatus === "offline" ? "off" : (syncStatus === "error" || syncStatus === "unauthorized") ? "err" : "";

  return (
    <header>
      <div className="head-top">
        <div>
          <div className="race-title">{renderTitle(config)}</div>
          <div className="race-sub" style={{ textTransform: "none", letterSpacing: 0 }}>{subFacts}</div>
          <button onClick={syncNow} title="Jetzt synchronisieren"
            style={{ background: "none", border: "none", color: "var(--muted)", font: "inherit", fontSize: 12, padding: 0, marginTop: 6 }}>
            <span className={`sync-dot ${dotCls}`} />{syncLabel}
          </button>
        </div>
        {days != null && (
          <div className="countdown">
            <div className="num">{days}</div>
            <div className="lbl">Tage bis Start</div>
          </div>
        )}
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
