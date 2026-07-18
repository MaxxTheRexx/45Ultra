"use client";

import { useToday } from "@/lib/hooks";
import { currentWeek, nutritionFocus, planModel } from "@/lib/plan-model";
import { RECIPES } from "@/lib/plan-content";
import { useApp } from "@/lib/store";

export function WissenTab() {
  const today = useToday();
  const { planConfig } = useApp();
  const cw = today && planConfig ? currentWeek(planConfig) : null;
  const weeks = planConfig ? planModel(planConfig).weeks : 0;

  return (
    <section className="tab">
      <div className="card" style={{ marginBottom: 14 }}>
        <h3><span className="accent">{"//"}</span> Wochenfokus Ernährung</h3>
        <div className="sub" style={{ fontSize: 14, whiteSpace: "pre-line" }}>
          {cw != null && planConfig && (
            <>
              <b className="mono" style={{ color: "var(--orange)" }}>WOCHE {cw}/{weeks}</b>
              {"\n"}{nutritionFocus(planConfig, cw)}
            </>
          )}
        </div>
      </div>
      <div className="card" style={{ marginBottom: 14 }}>
        <h3><span className="accent">{"//"}</span> Faustregeln für Abendtrainierer</h3>
        <div className="sub" style={{ fontSize: 14 }}>
          · <b style={{ color: "var(--bone)" }}>15 bis 16 Uhr:</b> letzter richtiger Snack vor dem Training (Banane, Toast mit Honig, Porridge-Riegel)<br />
          · <b style={{ color: "var(--bone)" }}>Direkt nach dem Training:</b> 20 bis 30 g Protein + Kohlenhydrate, auch wenn es spät ist. Sonst leidet Schlaf und Regeneration<br />
          · <b style={{ color: "var(--bone)" }}>Sehnen-Bonus:</b> 15 g Kollagen (oder Gelatine) + Vitamin C ca. 45 min vor jeder Kraft-Einheit<br />
          · <b style={{ color: "var(--bone)" }}>Protein-Tagesziel:</b> 1,6 bis 2 g pro kg Körpergewicht<br />
          · <b style={{ color: "var(--bone)" }}>Long Run über 2 h:</b> 60 bis 80 g Kohlenhydrate pro Stunde essen und trinken üben. Genau das, was du auch beim Ultra isst
        </div>
      </div>
      <h3 className="section-h3">
        <span className="accent">{"//"}</span> Schnelle Rezepte
      </h3>
      <div className="grid g3">
        {RECIPES.map((r) => (
          <div key={r.t} className="recipe">
            <div className="r-tag">{r.tag}</div>
            <h4>{r.t}</h4>
            <p>{r.p}</p>
            <div className="r-time">⏱ {r.time}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
