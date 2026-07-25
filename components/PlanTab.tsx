"use client";

import { useState } from "react";
import { DOW, addDays, fmtD, fmtDM, todayStr, weekdayIndex, weekIndexOf, weekMonday } from "@/lib/dates";
import { useToday } from "@/lib/hooks";
import { currentWeek, phaseOfWeek, planModel, planStartMonday, weekTargets } from "@/lib/plan-model";
import { KRAFT_A, KRAFT_B, KRAFT_C, STRETCH_STD } from "@/lib/plan-content";
import { profilePathFor } from "@/lib/profile-path";
import { missedSessions } from "@/lib/plan-adapt";
import { weekStats } from "@/lib/stats";
import { useApp } from "@/lib/store";
import { TYPELBL, type PlanSession } from "@/lib/types";
import { HERO_IMG, SESSION_IMG } from "@/lib/img";
import { TrainingDetail } from "./TrainingDetail";
import { useToast } from "./Toast";

function Ex({ t, children }: { t: string; children: React.ReactNode }) {
  return <details className="ex"><summary><span>{t}</span></summary><div className="ex-body">{children}</div></details>;
}

function Bar({ lbl, cur, max, unit }: { lbl: string; cur: number; max: number; unit: string }) {
  const p = Math.min(100, max ? (cur / max) * 100 : 0);
  return (
    <div className="bar-row">
      <div className="bl"><span>{lbl}</span><b>{Math.round(cur)} / {max} {unit}</b></div>
      <div className="bar"><span className={p < 40 ? "crit" : p < 75 ? "low" : ""} style={{ width: `${p}%` }} /></div>
    </div>
  );
}

function Ring({ frac, label, sub }: { frac: number; label: string; sub: string }) {
  const r = 34, c = 2 * Math.PI * r;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
      <svg className="ring" width="84" height="84" viewBox="0 0 84 84">
        <circle className="track" cx="42" cy="42" r={r} />
        <circle className="val" cx="42" cy="42" r={r} strokeDasharray={c} strokeDashoffset={c * (1 - frac)} />
      </svg>
      <div>
        <div style={{ fontFamily: "var(--font-d)", fontWeight: 800, fontSize: 22 }}>{label}</div>
        <div className="sub">{sub}</div>
      </div>
    </div>
  );
}

export function PlanTab() {
  const { plan, planConfig, activities, toggleDone, moveSession } = useApp();
  const toast = useToast();
  const today = useToday();
  const [mondayOverride, setMonday] = useState<Date | null>(null);
  const [movingId, setMovingId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [detail, setDetail] = useState<PlanSession | null>(null);

  if (!planConfig || !today) return null;
  const config = planConfig;
  const model = planModel(config);
  const start = planStartMonday(config);
  const cw = currentWeek(config);
  const ziel = config.raceLocation || config.raceName;

  const raceMs = new Date(config.raceDate + "T12:00").getTime();
  const days = Math.max(0, Math.ceil((raceMs - new Date(today + "T12:00").getTime()) / 864e5));

  // Nächste offene Einheit ab heute
  const next = [...plan]
    .filter((s) => !s.done && s.date >= today)
    .sort((a, b) => (a.date < b.date ? -1 : 1))[0];

  // Wochenfortschritt (aktuelle Woche)
  const weekMon = weekMonday(new Date());
  const ws = weekStats(weekMon, activities, plan);
  const tgt = weekTargets(config, cw);
  const weekSessions = plan.filter((s) => weekIndexOf(config.planStart, s.date) === cw && s.type !== "ruhe");
  const doneCount = weekSessions.filter((s) => s.done).length;
  const frac = weekSessions.length ? doneCount / weekSessions.length : 0;

  const { expired, lapsedKey } = missedSessions(plan, config, today);

  const monday = mondayOverride ?? weekMon;
  const w = weekIndexOf(config.planStart, fmtD(monday));
  const ph = phaseOfWeek(config, w);
  const end = addDays(monday, 6);

  function tryMove(id: string, dateStr: string) {
    const s = plan.find((x) => x.id === id);
    if (!s) return;
    const wd = weekdayIndex(new Date(dateStr + "T12:00"));
    if (wd === 0 && !["stretch", "ruhe", "yoga"].includes(s.type)) {
      toast("Montag ist Ruhetag. Nur Stretching/Yoga erlaubt.");
      return;
    }
    moveSession(id, dateStr, weekIndexOf(config.planStart, dateStr));
    toast(`„${s.title}“ → ${DOW[wd]} verschoben`);
  }

  const dr = (wk: number) => {
    const a = addDays(start, (wk - 1) * 7), b = addDays(a, 6);
    return { from: fmtDM(a), to: fmtDM(b) };
  };

  return (
    <section className="tab">
      {/* Hero */}
      <div className="photo-card" style={{ minHeight: 190, marginBottom: 16 }}>
        <img src={HERO_IMG.plan} alt="" />
        <div className="pc-overlay" />
        <div className="pc-body" style={{ minHeight: 190 }}>
          <div className="chip-row" style={{ marginBottom: 8 }}>
            <span className="chip solid">Woche {cw} / {model.weeks}</span>
            {ph && <span className="chip">{ph.name}</span>}
            <span className="chip">noch {days} Tage</span>
          </div>
          <div className="pc-title">Der Weg nach {ziel}</div>
          <svg viewBox="0 0 1000 100" preserveAspectRatio="none" style={{ width: "100%", height: 40, opacity: .9 }}>
            <path d={profilePathFor(config)} fill="rgba(255,255,255,.18)" stroke="#fff" strokeWidth="2" />
          </svg>
        </div>
      </div>

      {/* Als Nächstes */}
      {next && (
        <>
          <h3 className="section-h3"><span className="accent">{"//"}</span> Als Nächstes</h3>
          <button className={`photo-card s-${next.type}`} style={{ minHeight: 160, marginBottom: 16 }} onClick={() => setDetail(next)}>
            <img src={SESSION_IMG[next.type]} alt="" />
            <div className="pc-overlay" />
            <div className="pc-body" style={{ minHeight: 160 }}>
              <div className="pc-kicker">{next.date === today ? "Heute" : fmtDM(new Date(next.date + "T12:00"))} · {TYPELBL[next.type]}</div>
              <div className="pc-title">{next.title}</div>
              <div className="chip-row">
                <span className="chip">{next.dur} min</span>
                {next.km ? <span className="chip">{next.km} km</span> : null}
                {next.hm ? <span className="chip">{next.hm} hm</span> : null}
              </div>
            </div>
          </button>
        </>
      )}

      {/* Wochenfortschritt */}
      <div className="card" style={{ marginBottom: 16 }}>
        <h3><span className="accent">{"//"}</span> Woche {cw} im Blick</h3>
        <Ring frac={frac} label={`${doneCount}/${weekSessions.length}`} sub="Einheiten erledigt" />
        <hr className="sep" />
        <Bar lbl="Lauf-Kilometer" cur={ws.km} max={tgt.km} unit="km" />
        <Bar lbl="Höhenmeter" cur={ws.hm} max={tgt.hm} unit="hm" />
        <Bar lbl="Kraft-Einheiten" cur={ws.kraft} max={tgt.kraft} unit="x" />
      </div>

      {/* Wochenansicht */}
      <div className="cal-head">
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button className="btn ghost small" onClick={() => setMonday(addDays(monday, -7))}>←</button>
          <button className="btn ghost small" onClick={() => setMonday(weekMonday(new Date()))}>Heute</button>
          <button className="btn ghost small" onClick={() => setMonday(addDays(monday, 7))}>→</button>
        </div>
        <div className="cal-week-label">{fmtDM(monday)} – {fmtDM(end)}</div>
        <div className="sub">
          {w >= 1 && w <= model.weeks
            ? <>Woche <b className="mono" style={{ color: "var(--orange)" }}>{w}/{model.weeks}</b> · {ph?.name ?? ""}</>
            : "außerhalb des Plans"}
        </div>
      </div>
      <div className="sub" style={{ marginBottom: 10 }}>
        Einheit antippen = Details &amp; Wissenschaft. Ziehen (Desktop) oder im Detail &bdquo;Verschieben&ldquo; wählen und Zieltag antippen. Klick auf ✓ = erledigt.
      </div>
      <div className="cal-grid">
        {[...Array(7)].map((_, i) => {
          const d = addDays(monday, i), ds = fmtD(d);
          const ses = plan.filter((s) => s.date === ds);
          return (
            <div
              key={ds}
              className={`cal-day${ds === todayStr() ? " today-col" : ""}${dragOver === ds ? " dragover" : ""}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(ds); }}
              onDragLeave={() => setDragOver((cur) => (cur === ds ? null : cur))}
              onDrop={(e) => { e.preventDefault(); setDragOver(null); tryMove(e.dataTransfer.getData("text"), ds); }}
              onClick={() => { if (movingId) { tryMove(movingId, ds); setMovingId(null); } }}
            >
              <div className="d-head">
                <span>{DOW[i]}{i === 0 ? " · Ruhe" : ""}</span>
                <span className="dnum">{fmtDM(d)}</span>
              </div>
              {ses.map((s) => (
                <div
                  key={s.id}
                  className={`sess s-${s.type}${s.done ? " done" : ""}${movingId === s.id ? " moving" : ""}`}
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData("text", s.id)}
                  onClick={(e) => { e.stopPropagation(); setDetail(s); }}
                >
                  <div className="s-t">
                    {TYPELBL[s.type]}
                    {lapsedKey.has(s.id) && <span style={{ color: "var(--red)" }}> · verfallen</span>}
                    {expired.has(s.id) && <span style={{ color: "var(--dim)" }}> · verpasst</span>}
                  </div>
                  <div className="s-n">{s.title}</div>
                  <div className="s-d">
                    {s.dur} min {s.km ? `· ${s.km} km` : ""} {s.hm ? `· ${s.hm} hm` : ""}
                    <span style={{ float: "right", cursor: "pointer" }} title="erledigt"
                      onClick={(e) => { e.stopPropagation(); toggleDone(s.id); }}>{s.done ? "✓" : "○"}</span>
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {/* Phasen-Timeline */}
      <h3 className="section-h3" style={{ marginTop: 22 }}><span className="accent">{"//"}</span> Phasen · {model.weeks} Wochen</h3>
      <div style={{ marginBottom: 16 }}>
        {model.phases.map((p) => (
          <div key={p.name + p.w[0]} className="phase" style={{ "--sc": p.color } as React.CSSProperties}>
            <div className="ph-dates">
              Woche {p.w[0]}{p.w[1] > p.w[0] ? `–${p.w[1]}` : ""} · {dr(p.w[0]).from} – {dr(p.w[1]).to}
            </div>
            <h4>{p.name}</h4>
            <p>{p.desc}</p>
          </div>
        ))}
      </div>

      {/* Protokolle */}
      <div className="grid g2">
        <div className="card">
          <h3><span className="accent">{"//"}</span> Kraft &amp; Sehnen-Protokoll</h3>
          <div className="sub" style={{ marginBottom: 10 }}>
            2x pro Woche. Sehnen brauchen langsame, schwere Reize und 48h Pause dazwischen. Bei Schmerz über 3/10: abbrechen.
          </div>
          <Ex t="Kraft A · Grundlage & Sehnen (Basis-Phase)">{KRAFT_A}</Ex>
          <Ex t="Kraft B · Aufbau (Aufbau- & Peak-Phase)">{KRAFT_B}</Ex>
          <Ex t="Kraft C · Erhaltung (Taper)">{KRAFT_C}</Ex>
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
        </div>
      </div>

      {detail && (
        <TrainingDetail session={detail} onClose={() => setDetail(null)}
          onStartMove={(id) => { setMovingId(id); toast("Jetzt Zieltag in der Wochenansicht antippen"); }} />
      )}
    </section>
  );
}
