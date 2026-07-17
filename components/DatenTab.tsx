"use client";

import { useRef, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { importCSV } from "@/lib/csv";
import { todayStr } from "@/lib/dates";
import { useApp } from "@/lib/store";
import { DEFAULT_SETTINGS } from "@/lib/types";
import { useToast } from "./Toast";

export function DatenTab() {
  const { activities, plan, checkins, settings, addActivities, saveSettings, resetPlan, importBackup } = useApp();
  const toast = useToast();
  const [csvStatus, setCsvStatus] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [goal, setGoal] = useState(settings.goal);
  const [weight, setWeight] = useState(String(settings.weight));
  const csvInput = useRef<HTMLInputElement>(null);
  const jsonInput = useRef<HTMLInputElement>(null);

  function handleCSV(text: string) {
    const { added, error } = importCSV(text, activities);
    if (error) { toast(error); return; }
    addActivities(added);
    setCsvStatus(`${added.length} neue Aktivitäten importiert · ${activities.length + added.length} gesamt`);
    toast(`${added.length} Aktivitäten importiert`);
  }

  function exportJSON() {
    const data = {
      plan,
      checkins,
      activities,
      settings: { goal: settings.goal, weight: settings.weight },
    };
    const blob = new Blob([JSON.stringify(data, null, 1)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "heartcore-backup-" + todayStr() + ".json";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <section className="tab">
      <div className="grid g2">
        <div className="card">
          <h3><span className="accent">{"//"}</span> Aktivitäten importieren (CSV)</h3>
          <div className="sub" style={{ marginBottom: 10 }}>
            Garmin Connect → Aktivitäten → CSV-Export. Deutsch oder Englisch, die App erkennt die Spalten selbst. Neuer Import ergänzt, Duplikate werden übersprungen.
          </div>
          <div
            className={`drop${dragOver ? " over" : ""}`}
            onClick={() => csvInput.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              const f = e.dataTransfer.files[0];
              if (f) f.text().then(handleCSV);
            }}
          >
            CSV hier ablegen oder klicken
            <input
              ref={csvInput} type="file" accept=".csv" style={{ display: "none" }}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) f.text().then(handleCSV);
                e.target.value = "";
              }}
            />
          </div>
          <div className="sub mono" style={{ marginTop: 10 }}>{csvStatus}</div>
        </div>
        <div className="card">
          <h3><span className="accent">{"//"}</span> App-Daten</h3>
          <div className="sub" style={{ marginBottom: 10 }}>
            Deine Daten liegen lokal auf diesem Gerät und werden automatisch mit deinem Account synchronisiert, sobald du online bist. Backup als Datei geht zusätzlich.
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button className="btn ghost small" onClick={exportJSON}>Backup exportieren</button>
            <button className="btn ghost small" onClick={() => jsonInput.current?.click()}>Backup importieren</button>
            <button
              className="btn ghost small" style={{ borderColor: "var(--red)", color: "var(--red)" }}
              onClick={() => {
                if (confirm("Plan komplett neu generieren? Verschiebungen und Erledigt-Haken gehen verloren. Check-ins und Aktivitäten bleiben.")) {
                  resetPlan();
                  toast("Plan neu generiert");
                }
              }}
            >
              Plan neu generieren
            </button>
          </div>
          <input
            ref={jsonInput} type="file" accept=".json" style={{ display: "none" }}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              f.text().then((t) => {
                try {
                  const ok = importBackup(JSON.parse(t));
                  toast(ok ? "Backup importiert" : "Datei nicht lesbar");
                } catch {
                  toast("Datei nicht lesbar");
                }
              });
              e.target.value = "";
            }}
          />
          <hr className="sep" />
          <h3><span className="accent">{"//"}</span> Einstellungen</h3>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <label className="sub" htmlFor="set-goal">Zielzeit (h:mm)</label>
            <input id="set-goal" style={{ width: 90 }} value={goal} onChange={(e) => setGoal(e.target.value)} />
            <label className="sub" htmlFor="set-weight">Gewicht (kg)</label>
            <input id="set-weight" style={{ width: 70 }} type="number" value={weight} onChange={(e) => setWeight(e.target.value)} />
            <button
              className="btn small"
              onClick={() => {
                saveSettings({ goal: goal || DEFAULT_SETTINGS.goal, weight: +weight || DEFAULT_SETTINGS.weight });
                toast("Gespeichert");
              }}
            >
              Speichern
            </button>
          </div>
          <hr className="sep" />
          <h3><span className="accent">{"//"}</span> Sicherheit</h3>
          <div className="sub" style={{ marginBottom: 10 }}>
            Ein Passkey ersetzt das Passwort auf diesem Gerät (Face ID, Touch ID oder Geräte-PIN). Einmal einrichten, danach ohne Tippen anmelden.
          </div>
          <button
            className="btn ghost small"
            onClick={async () => {
              const res = await authClient.passkey.addPasskey();
              toast(res?.error ? "Passkey konnte nicht eingerichtet werden" : "Passkey eingerichtet");
            }}
          >
            Passkey für dieses Gerät einrichten
          </button>
        </div>
      </div>
    </section>
  );
}
