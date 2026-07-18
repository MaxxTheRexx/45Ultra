"use client";

import { useToday } from "@/lib/hooks";
import { currentWeek, nutritionFocus, planModel } from "@/lib/plan-model";
import { RECIPES } from "@/lib/plan-content";
import { INSIGHTS } from "@/lib/content/insights";
import { VIDEOS } from "@/lib/content/videos";
import { VideoFacade } from "./VideoFacade";
import { useApp } from "@/lib/store";

export function WissenTab() {
  const today = useToday();
  const { planConfig } = useApp();
  const cw = today && planConfig ? currentWeek(planConfig) : null;
  const weeks = planConfig ? planModel(planConfig).weeks : 0;
  const philosophy = planConfig?.philosophy;

  // Passende Insights zuerst (an die Trainingsphilosophie gekoppelt).
  const insights = [...INSIGHTS].sort((a, b) => {
    const am = philosophy && a.philosophyTags.includes(philosophy) ? 0 : 1;
    const bm = philosophy && b.philosophyTags.includes(philosophy) ? 0 : 1;
    return am - bm;
  });

  return (
    <section className="tab">
      {/* ---------- Insights von Profis ---------- */}
      <h3 className="section-h3"><span className="accent">{"//"}</span> Insights von Profis</h3>
      <div className="sub" style={{ marginBottom: 12 }}>
        Warum dein Plan so aussieht — kompakt erklärt, mit Quellen zum Nachlesen.
      </div>
      <div className="grid g2" style={{ marginBottom: 22 }}>
        {insights.map((ins) => (
          <details key={ins.id} className="ex" style={{ margin: 0 }}>
            <summary>
              <span>{ins.title}
                {philosophy && ins.philosophyTags.includes(philosophy) &&
                  <span className="pill" style={{ marginLeft: 8, borderColor: "var(--orange)", color: "var(--orange)" }}>zu deinem Stil</span>}
              </span>
            </summary>
            <div className="ex-body">
              <p style={{ fontWeight: 600, color: "var(--bone)", marginBottom: 8 }}>{ins.teaser}</p>
              {ins.body.map((p, i) => <p key={i} style={{ marginBottom: 8 }}>{p}</p>)}
              <div style={{ marginTop: 10, fontSize: 12 }}>
                <b>Quellen:</b>{" "}
                {ins.sources.map((s, i) => (
                  <span key={i}>
                    {i > 0 && " · "}
                    <a href={s.url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--orange)", fontWeight: 600 }}>{s.label} ↗</a>
                  </span>
                ))}
              </div>
            </div>
          </details>
        ))}
      </div>

      {/* ---------- Übungsvideos ---------- */}
      <h3 className="section-h3"><span className="accent">{"//"}</span> Übungsvideos</h3>
      <div className="sub" style={{ marginBottom: 12 }}>
        Kurze Demos zu den Kraft- und Stabi-Übungen aus deinem Plan.
      </div>
      <div className="grid g3" style={{ marginBottom: 22 }}>
        {VIDEOS.map((v) => <VideoFacade key={v.youtubeId} video={v} />)}
      </div>

      {/* ---------- Ernährung ---------- */}
      <h3 className="section-h3"><span className="accent">{"//"}</span> Ernährung</h3>
      <div className="card" style={{ marginBottom: 14 }}>
        <h3><span className="accent">{"//"}</span> Wochenfokus</h3>
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
      <h3 className="section-h3"><span className="accent">{"//"}</span> Schnelle Rezepte</h3>
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
