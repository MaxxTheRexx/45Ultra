"use client";

import type { PlanConfigInput } from "@/lib/store";

export type ConfigSection = "race" | "schedule" | "style";

/**
 * Wiederverwendbares Formular für die Renn-/Plankonfiguration.
 * Kontrolliert (value + onChange). `sections` bestimmt, welche Feldgruppen
 * sichtbar sind — Onboarding zeigt sie einzeln, die Einstellungen alle.
 */
export function PlanConfigForm({
  value, onChange, sections = ["race", "schedule", "style"],
}: {
  value: PlanConfigInput;
  onChange: (patch: Partial<PlanConfigInput>) => void;
  sections?: ConfigSection[];
}) {
  const show = (s: ConfigSection) => sections.includes(s);

  return (
    <div>
      {show("race") && (
        <>
          <div className="auth-field">
            <label htmlFor="cfg-name">Wie heißt dein Rennen / Ziel?</label>
            <input id="cfg-name" value={value.raceName} placeholder="z. B. Zugspitz Trail 30K"
              onChange={(e) => onChange({ raceName: e.target.value })} />
          </div>
          <div className="auth-field">
            <label htmlFor="cfg-loc">Ort (optional)</label>
            <input id="cfg-loc" value={value.raceLocation ?? ""} placeholder="z. B. Garmisch"
              onChange={(e) => onChange({ raceLocation: e.target.value })} />
          </div>
          <div className="auth-field">
            <label htmlFor="cfg-date">Renntag</label>
            <input id="cfg-date" type="date" value={value.raceDate}
              onChange={(e) => onChange({ raceDate: e.target.value })} />
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <div className="auth-field" style={{ flex: 1 }}>
              <label htmlFor="cfg-km">Distanz (km)</label>
              <input id="cfg-km" type="number" min={3} max={160} value={value.distanceKm}
                onChange={(e) => onChange({ distanceKm: +e.target.value })} />
            </div>
            <div className="auth-field" style={{ flex: 1 }}>
              <label htmlFor="cfg-hm">Höhenmeter</label>
              <input id="cfg-hm" type="number" min={0} max={8000} step={50} value={value.elevationHm}
                onChange={(e) => onChange({ elevationHm: +e.target.value })} />
            </div>
          </div>
        </>
      )}

      {show("schedule") && (
        <div className="auth-field">
          <label htmlFor="cfg-start">Wann startet dein Trainingsplan?</label>
          <input id="cfg-start" type="date" value={value.planStart}
            onChange={(e) => onChange({ planStart: e.target.value })} />
          <div className="sub" style={{ marginTop: 4 }}>Wird automatisch auf den Wochenanfang (Montag) gelegt.</div>
        </div>
      )}

      {show("style") && (
        <>
          <div className="auth-field">
            <label htmlFor="cfg-days">Trainingstage pro Woche: <b className="mono" style={{ color: "var(--orange)" }}>{value.trainingDays}</b></label>
            <input id="cfg-days" type="range" min={3} max={7} value={value.trainingDays}
              style={{ width: "100%" }}
              onChange={(e) => onChange({ trainingDays: +e.target.value })} />
          </div>
          <div className="auth-field">
            <label>Trainingsstil</label>
            <div className="feel-row">
              <button type="button" className={`feel-btn${value.philosophy === "haeufig" ? " sel" : ""}`}
                onClick={() => onChange({ philosophy: "haeufig" })}>Viele kleine Einheiten</button>
              <button type="button" className={`feel-btn${value.philosophy === "intensiv" ? " sel" : ""}`}
                onClick={() => onChange({ philosophy: "intensiv" })}>Wenige intensive Einheiten</button>
            </div>
            <div className="sub" style={{ marginTop: 4 }}>
              {value.philosophy === "haeufig"
                ? "Häufig, überwiegend locker — schonend für Gelenke und Alltag."
                : "Seltener, dafür fordernde Reize (Intervalle, Tempo) — polarisiert."}
            </div>
          </div>
          <div className="auth-field">
            <label>Grund-Intensität</label>
            <div className="feel-row">
              <button type="button" className={`feel-btn${value.intensity === "locker" ? " sel" : ""}`}
                onClick={() => onChange({ intensity: "locker" })}>Eher locker</button>
              <button type="button" className={`feel-btn${value.intensity === "anstrengend" ? " sel" : ""}`}
                onClick={() => onChange({ intensity: "anstrengend" })}>Darf anstrengend sein</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
