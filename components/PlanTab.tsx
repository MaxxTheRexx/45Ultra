"use client";

import { addDays, fmtDM } from "@/lib/dates";
import { planModel, planStartMonday } from "@/lib/plan-model";
import { KRAFT_A, KRAFT_B, KRAFT_C, STRETCH_STD } from "@/lib/plan-content";
import { useApp } from "@/lib/store";

function Ex({ t, children }: { t: string; children: React.ReactNode }) {
  return (
    <details className="ex">
      <summary>{t}</summary>
      <div className="ex-body">{children}</div>
    </details>
  );
}

export function PlanTab() {
  const { planConfig } = useApp();
  if (!planConfig) return null;
  const model = planModel(planConfig);
  const start = planStartMonday(planConfig);
  const dr = (w: number) => {
    const a = addDays(start, (w - 1) * 7), b = addDays(a, 6);
    return { from: fmtDM(a), to: fmtDM(b) };
  };
  const ziel = planConfig.raceLocation || planConfig.raceName;
  return (
    <section className="tab">
      <div className="card" style={{ marginBottom: 14 }}>
        <h3><span className="accent">{"//"}</span> Der Weg nach {ziel} · {model.weeks} Wochen</h3>
        <div>
          {model.phases.map((p) => (
            <div key={p.name + p.w[0]} className="phase" style={{ "--sc": p.color } as React.CSSProperties}>
              <div className="ph-dates">
                WOCHE {p.w[0]}{p.w[1] > p.w[0] ? `–${p.w[1]}` : ""} · {dr(p.w[0]).from} – {dr(p.w[1]).to}
              </div>
              <h4>{p.name}</h4>
              <p>{p.desc}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="grid g2">
        <div className="card">
          <h3><span className="accent">{"//"}</span> Kraft &amp; Sehnen-Protokoll</h3>
          <div className="sub" style={{ marginBottom: 10 }}>
            2x pro Woche. Sehnen brauchen langsame, schwere Reize und 48h Pause dazwischen. Bei Schmerz über 3/10: abbrechen.
          </div>
          <Ex t="Kraft A · Grundlage & Sehnen (Basis-Phase)">{KRAFT_A}</Ex>
          <Ex t="Kraft B · Aufbau (Aufbau- & Peak-Phase)">{KRAFT_B}</Ex>
          <Ex t="Kraft C · Erhaltung (Taper)">{KRAFT_C}</Ex>
          <Ex t="Warum das fürs Knie funktioniert">
            {`Sehnen (Patellasehne, Beugersehne Kniekehle) passen sich an langsame, schwere Last an, nicht an Dehnen oder Schonen.
Isometrie (Wandsitz) wirkt zusätzlich akut schmerzlindernd.
Regel: Schmerz bis 3/10 während der Übung ist ok, wenn er am nächsten Morgen weg ist. Darüber: Last reduzieren.
Auf dem Rad: Trittfrequenz hoch, dicke Gänge meiden, Sattelhöhe prüfen (Kniekehle zieht oft bei zu hohem Sattel).`}
          </Ex>
        </div>
        <div className="card">
          <h3><span className="accent">{"//"}</span> Stretching &amp; Mobility <span className="sub">(täglich 10 bis 20 min)</span></h3>
          <Ex t="Tägliche Basis-Routine (10 min)">{STRETCH_STD}</Ex>
          <Ex t="Fußknöchel-Programm für Trail (3x/Woche, 10 min)">
            {`· Einbeinstand Augen zu 3x 30 s
· Einbeinstand auf Kissen/Balance-Pad 3x 45 s
· Sprunggelenk-ABC (Alphabet mit dem Fuß schreiben) je Fuß
· Seitliche Hüpfer über Linie 3x 20
· Zehen-Greifer (Handtuch ranziehen) 3x 15
· Wadenmobilisation an der Wand (Knee-to-wall) 2x 10 je Seite`}
          </Ex>
          <Ex t="Nach dem Long Run (15 min)">
            {`Erst 5 min gehen, dann:
Hüftbeuger-Ausfallschritt 2x 60 s je Seite
Waden an Stufe 2x 60 s
Gesäß/Piriformis Figur-4 2x 60 s
Faszienrolle Oberschenkel vorne + außen
Beine 10 min an die Wand hoch`}
          </Ex>
          <Ex t="Yoga-Empfehlung (Fr im Studio)">
            {`Hatha oder Yin, keine Power-Flows in harten Wochen.
Fokus: Hüftöffner, hintere Kette, Fußgelenke.
Yin am Abend hilft zusätzlich beim Einschlafen nach spätem Training.`}
          </Ex>
        </div>
      </div>
    </section>
  );
}
