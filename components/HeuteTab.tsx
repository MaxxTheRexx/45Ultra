"use client";

import { useState } from "react";
import { DOW, addDays, fmtD, fmtDM, weekMonday } from "@/lib/dates";
import { useToday } from "@/lib/hooks";
import { useApp } from "@/lib/store";
import { useToast } from "./Toast";
import { TYPELBL, type Checkin } from "@/lib/types";

function Advice({ c }: { c: Checkin | undefined }) {
  if (c?.knee === "rot")
    return <div className="advice stop"><b>Knie rot:</b> Heute kein Laufen und keine Kraft für die Beine. Tausche gegen Schwimmen oder ganz lockeres Rad + Isometrie (Wandsitz 5x 45 s, schmerzfrei). Bleibt es 3+ Tage rot: Physio-Termin.</div>;
  if (c?.knee === "gelb")
    return <div className="advice warn"><b>Knie gelb:</b> Umfang heute minus 30 %, kein Tempo, keine steilen Downhills. Nach dem Training 10 min kühlen. Isometrischer Wandsitz wirkt oft schmerzlindernd.</div>;
  if (c?.energy != null && c.energy <= 2)
    return <div className="advice warn"><b>Wenig Energie:</b> Einheit kürzen oder auf morgen schieben (Kalender-Tab). Ein guter Tag Pause schlägt drei mittelmäßige Trainings.</div>;
  if (c?.energy != null && c.energy >= 4 && c.knee === "gruen")
    return <div className="advice"><b>Grünes Licht:</b> Alles wie geplant. Wenn du dich stark fühlst: Qualität in die Haupteinheit, nicht einfach länger machen.</div>;
  return null;
}

function FeelRow<T extends string | number>({ opts, value, onSelect, knee }: {
  opts: { v: T; l: string }[];
  value: T | undefined;
  onSelect: (v: T) => void;
  knee?: boolean;
}) {
  return (
    <div className="feel-row">
      {opts.map((o) => (
        <button
          key={String(o.v)}
          className={`feel-btn${knee ? " knee-btn" : ""}${knee ? ` k-${o.v}` : ""}${value === o.v ? " sel" : ""}`}
          onClick={() => onSelect(o.v)}
        >
          {o.l}
        </button>
      ))}
    </div>
  );
}

export function HeuteTab() {
  const { plan, checkins, toggleDone, setCheckin } = useApp();
  const toast = useToast();
  const today = useToday();
  // null = noch nicht angefasst → gespeicherte Notiz anzeigen
  const [noteDraft, setNoteDraft] = useState<string | null>(null);

  if (!today) return null;
  const c = checkins[today];
  const note = noteDraft ?? c?.note ?? "";
  const ses = plan.filter((s) => s.date === today);
  const mon = weekMonday(new Date());

  return (
    <section className="tab">
      <div className="grid g2">
        <div className="card">
          <h3><span className="accent">{"//"}</span> Heute ansteht</h3>
          <div>
            {ses.length ? ses.map((s) => (
              <div key={s.id} className={`today-session s-${s.type}`}>
                <div className="t-type">
                  {TYPELBL[s.type]} · ca. {s.dur} min {s.type !== "ruhe" && s.type !== "stretch" ? "· abends" : ""}
                </div>
                <div className="t-title">{s.title} {s.done ? "✓" : ""}</div>
                <div className="t-detail">{s.detail}</div>
                <button className={`btn small${s.done ? " ghost" : ""}`} style={{ marginTop: 8 }} onClick={() => toggleDone(s.id)}>
                  {s.done ? "Doch nicht erledigt" : "Als erledigt markieren"}
                </button>
              </div>
            )) : <div className="sub">Kein Training geplant. Freier Tag!</div>}
          </div>
          <Advice c={c} />
        </div>
        <div>
          <div className="card" style={{ marginBottom: 14 }}>
            <h3><span className="accent">{"//"}</span> Morgen-Check-in</h3>
            <div className="sub">Wie fühlst du dich heute? Der Plan passt sich an.</div>
            <div style={{ marginTop: 10, fontSize: 13, color: "var(--muted)" }}>Energie / Beine</div>
            <FeelRow
              opts={[{ v: 1, l: "1 · Leer" }, { v: 2, l: "2 · Müde" }, { v: 3, l: "3 · Ok" }, { v: 4, l: "4 · Gut" }, { v: 5, l: "5 · Stark" }]}
              value={c?.energy} onSelect={(v) => setCheckin(today, { energy: v })}
            />
            <div style={{ marginTop: 10, fontSize: 13, color: "var(--muted)" }}>Rechtes Knie / Kniekehle</div>
            <FeelRow
              knee
              opts={[{ v: "gruen" as const, l: "🟢 Ruhig" }, { v: "gelb" as const, l: "🟡 Spürbar" }, { v: "rot" as const, l: "🔴 Schmerz" }]}
              value={c?.knee} onSelect={(v) => setCheckin(today, { knee: v })}
            />
            <div style={{ marginTop: 10, fontSize: 13, color: "var(--muted)" }}>Schlaf</div>
            <FeelRow
              opts={[{ v: 1, l: "Schlecht" }, { v: 2, l: "Mittel" }, { v: 3, l: "Gut" }]}
              value={c?.sleep} onSelect={(v) => setCheckin(today, { sleep: v })}
            />
          </div>
          <div className="card">
            <h3><span className="accent">{"//"}</span> Abend-Check</h3>
            <div className="sub">Nach dem Training: kurz eintragen, wie es lief.</div>
            <div style={{ marginTop: 10, fontSize: 13, color: "var(--muted)" }}>Anstrengung (RPE)</div>
            <FeelRow
              opts={[{ v: 1, l: "Locker" }, { v: 2, l: "Moderat" }, { v: 3, l: "Hart" }, { v: 4, l: "Sehr hart" }]}
              value={c?.rpe} onSelect={(v) => setCheckin(today, { rpe: v })}
            />
            <div style={{ marginTop: 10, fontSize: 13, color: "var(--muted)" }}>Notiz (optional)</div>
            <textarea
              rows={2} style={{ width: "100%", marginTop: 6 }}
              placeholder="z.B. Knie ab km 8 gespürt, Trail rutschig ..."
              value={note} onChange={(e) => setNoteDraft(e.target.value)}
            />
            <button className="btn small" style={{ marginTop: 8 }}
              onClick={() => { setCheckin(today, { note }); toast("Abend-Check gespeichert"); }}>
              Abend-Check speichern
            </button>
          </div>
        </div>
      </div>
      <div className="card" style={{ marginTop: 14 }}>
        <h3><span className="accent">{"//"}</span> Diese Woche im Blick</h3>
        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
          {[...Array(7)].map((_, i) => {
            const d = addDays(mon, i), ds = fmtD(d);
            const daySes = plan.filter((s) => s.date === ds);
            const main = daySes.find((s) => ["trail", "lauf", "event", "kraft", "rad"].includes(s.type)) || daySes[0];
            const isToday = ds === today;
            return (
              <div key={ds} style={{
                minWidth: 110, flex: 1,
                background: isToday ? "var(--panel2)" : "transparent",
                border: `1px solid ${isToday ? "var(--orange)" : "var(--line)"}`,
                borderRadius: 8, padding: 8,
              }}>
                <div className="mono" style={{ fontSize: 10, color: "var(--dim)" }}>
                  {DOW[i]} {fmtDM(d)}
                </div>
                {main ? (
                  <>
                    <div className={`s-${main.type}`} style={{ fontSize: 12, fontWeight: 600, color: "var(--sc,var(--bone))", marginTop: 2 }}>
                      {main.title}
                    </div>
                    <div className="sub" style={{ fontSize: 10.5 }}>{main.dur} min{main.done ? " ✓" : ""}</div>
                  </>
                ) : <div className="sub" style={{ fontSize: 11 }}>frei</div>}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
