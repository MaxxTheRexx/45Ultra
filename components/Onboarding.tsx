"use client";

import { useMemo, useState } from "react";
import { fmtD } from "@/lib/dates";
import { defaultConfigInput, planModel, planStartMonday } from "@/lib/plan-model";
import { useApp, type PlanConfigInput } from "@/lib/store";
import { PlanConfigForm, type ConfigSection } from "./PlanConfigForm";

const STEPS: { title: string; sections: ConfigSection[] }[] = [
  { title: "Dein Rennen", sections: ["race"] },
  { title: "Dein Zeitplan", sections: ["schedule"] },
  { title: "Dein Stil", sections: ["style"] },
  { title: "Fertig", sections: [] },
];

export function Onboarding() {
  const { applyPlanConfig, saveSettings, settings } = useApp();
  const [step, setStep] = useState(0);
  const [cfg, setCfg] = useState<PlanConfigInput>(defaultConfigInput());
  const [goal, setGoal] = useState(settings.goal);

  // Vorschau der Planstruktur aus der aktuellen Eingabe.
  const preview = useMemo(() => {
    try {
      return { weeks: planModel({ ...cfg, version: 1, updatedAt: 0 }).weeks };
    } catch { return null; }
  }, [cfg]);

  const raceOk = cfg.raceName.trim().length > 0 && cfg.distanceKm > 0;
  const scheduleOk = new Date(cfg.raceDate) > new Date(cfg.planStart) && (preview?.weeks ?? 0) >= 4;

  function finish() {
    const normalized: PlanConfigInput = { ...cfg, planStart: fmtD(planStartMonday(cfg)) };
    saveSettings({ goal: goal || settings.goal });
    applyPlanConfig(normalized);
    // AppShell rendert danach automatisch, sobald planConfig gesetzt ist.
  }

  const canNext = step === 0 ? raceOk : step === 1 ? scheduleOk : true;

  return (
    <div className="auth-wrap">
      <div className="auth-card" style={{ maxWidth: 460 }}>
        <h1>Willkommen 👋</h1>
        <div className="auth-sub">SCHRITT {step + 1} VON {STEPS.length} · {STEPS[step].title.toUpperCase()}</div>

        {step < 3 && (
          <PlanConfigForm value={cfg} onChange={(patch) => setCfg((c) => ({ ...c, ...patch }))} sections={STEPS[step].sections} />
        )}

        {step === 1 && (
          <>
            <div className="auth-field">
              <label htmlFor="ob-goal">Zielzeit (h:mm)</label>
              <input id="ob-goal" value={goal} placeholder="z. B. 5:00" onChange={(e) => setGoal(e.target.value)} />
            </div>
            {preview && (
              <div className="advice" style={{ marginTop: 4 }}>
                → {preview.weeks} Wochen Plan{scheduleOk ? "" : " · mind. 4 Wochen zwischen Start und Renntag nötig"}
              </div>
            )}
          </>
        )}

        {step === 3 && preview && (
          <div className="sub" style={{ fontSize: 14, lineHeight: 1.7 }}>
            <b style={{ color: "var(--bone)" }}>{cfg.raceName}</b>{cfg.raceLocation ? ` · ${cfg.raceLocation}` : ""}<br />
            {cfg.distanceKm} km · {cfg.elevationHm} hm · Renntag {new Date(cfg.raceDate + "T12:00").toLocaleDateString("de-DE")}<br />
            <b className="mono" style={{ color: "var(--orange)" }}>{preview.weeks} Wochen</b> · {cfg.trainingDays} Trainingstage/Woche<br />
            Stil: {cfg.philosophy === "haeufig" ? "viele kleine Einheiten" : "wenige intensive Einheiten"}, {cfg.intensity === "locker" ? "eher locker" : "darf anstrengend sein"}<br />
            Zielzeit: {goal || "—"} h
            <div className="advice" style={{ marginTop: 12 }}>
              Beim Klick auf &bdquo;Plan erstellen&ldquo; wird dein individueller {preview.weeks}-Wochen-Plan generiert.
            </div>
          </div>
        )}

        <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
          {step > 0 && (
            <button className="btn ghost" onClick={() => setStep((s) => s - 1)} style={{ flex: 1 }}>Zurück</button>
          )}
          {step < 3 ? (
            <button className="btn" disabled={!canNext} onClick={() => setStep((s) => s + 1)} style={{ flex: 2 }}>Weiter</button>
          ) : (
            <button className="btn" onClick={finish} style={{ flex: 2 }}>Plan erstellen</button>
          )}
        </div>
      </div>
      <div className="footer-note" style={{ paddingTop: 20 }}>
        Alles später in den Einstellungen änderbar.
      </div>
    </div>
  );
}
