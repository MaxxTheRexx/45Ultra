"use client";

import { useMemo, useState } from "react";
import { addDays, fmtD, fmtDM, fmtHM, weekIndexOf } from "@/lib/dates";
import { useToday } from "@/lib/hooks";
import { currentWeek, phaseOfWeek, planModel } from "@/lib/plan-model";
import { scienceFor } from "@/lib/content/training-science";
import { dayNutrition, type CarbFocus } from "@/lib/nutrition-day";
import { SESSION_IMG } from "@/lib/img";
import { useApp } from "@/lib/store";
import { TYPELBL, type Activity, type Checkin, type PlanSession, type SessionType } from "@/lib/types";
import { TrainingDetail } from "./TrainingDetail";
import { useToast } from "./Toast";

function Advice({ c }: { c: Checkin | undefined }) {
  if (c?.knee === "rot")
    return <div className="advice stop"><b>Knie rot:</b> Heute kein Laufen und keine Kraft für die Beine. Tausche gegen Schwimmen oder ganz lockeres Rad + Isometrie (Wandsitz 5x 45 s, schmerzfrei). Bleibt es 3+ Tage rot: Physio-Termin.</div>;
  if (c?.knee === "gelb")
    return <div className="advice warn"><b>Knie gelb:</b> Umfang heute minus 30 %, kein Tempo, keine steilen Downhills. Nach dem Training 10 min kühlen.</div>;
  if (c?.energy != null && c.energy <= 2)
    return <div className="advice warn"><b>Wenig Energie:</b> Einheit kürzen oder auf morgen schieben. Ein guter Tag Pause schlägt drei mittelmäßige Trainings.</div>;
  if (c?.energy != null && c.energy >= 4 && c.knee === "gruen")
    return <div className="advice"><b>Grünes Licht:</b> Alles wie geplant. Wenn du dich stark fühlst: Qualität in die Haupteinheit, nicht einfach länger.</div>;
  return null;
}

function FeelRow<T extends string | number>({ opts, value, onSelect, knee }: {
  opts: { v: T; l: string }[]; value: T | undefined; onSelect: (v: T) => void; knee?: boolean;
}) {
  return (
    <div className="feel-row">
      {opts.map((o) => (
        <button key={String(o.v)}
          className={`feel-btn${knee ? ` knee-btn k-${o.v}` : ""}${value === o.v ? " sel" : ""}`}
          onClick={() => onSelect(o.v)}>{o.l}</button>
      ))}
    </div>
  );
}

/** Foto-Karte mit Overlay; mit onClick wird sie zum Button. */
function PhotoCard({ type, children, onClick, spaced }: {
  type: SessionType; children: React.ReactNode; onClick?: () => void; spaced?: boolean;
}) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag className={`photo-card s-${type}${spaced ? " mb16" : ""}`} onClick={onClick}>
      <img src={SESSION_IMG[type]} alt="" loading="lazy" />
      <div className="pc-overlay" />
      <div className="pc-body">{children}</div>
    </Tag>
  );
}

const FOCUS_STYLE: Record<CarbFocus, { bg: string; fg: string }> = {
  low: { bg: "var(--sky)", fg: "#fff" },
  normal: { bg: "var(--panel2)", fg: "var(--bone)" },
  high: { bg: "var(--orange)", fg: "#fff" },
};

type Recap = {
  date: string; type: PlanSession["type"]; title: string;
  km?: number; hm?: number; min?: number; benefit: string;
  week: number; phaseName?: string;
};

export function HeuteTab() {
  const { plan, checkins, activities, planConfig, setCheckin } = useApp();
  const toast = useToast();
  const today = useToday();
  const [noteDraft, setNoteDraft] = useState<string | null>(null);
  const [detail, setDetail] = useState<PlanSession | null>(null);

  // Tippen im Notizfeld darf den ganzen Plan nicht neu durchsuchen.
  const derived = useMemo(() => {
    if (!today || !planConfig) return null;
    const config = planConfig;
    const todaySes = plan.filter((s) => s.date === today);
    const tomorrow = fmtD(addDays(new Date(today + "T12:00"), 1));
    const tomorrowSes = plan.filter((s) => s.date === tomorrow);

    // Recap: jüngste erledigte Einheit oder jüngste importierte Aktivität.
    const lastDone = plan.filter((s) => s.done && s.date <= today).sort((a, b) => (a.date < b.date ? 1 : -1))[0];
    const lastAct: Activity | undefined = activities[0]; // Store sortiert absteigend
    const base = lastAct && (!lastDone || lastAct.date >= lastDone.date)
      ? { date: lastAct.date, type: lastAct.type, title: lastAct.title || TYPELBL[lastAct.type],
          km: lastAct.km, hm: lastAct.hm, min: lastAct.min }
      : lastDone
        ? { date: lastDone.date, type: lastDone.type, title: lastDone.title,
            km: lastDone.km, hm: lastDone.hm, min: lastDone.dur }
        : null;
    const recap: Recap | null = base && (() => {
      const week = weekIndexOf(config.planStart, base.date);
      return { ...base, week, phaseName: phaseOfWeek(config, week)?.name,
        benefit: scienceFor(base).benefit };
    })();

    // Carboloading gehört auf den Tag vor dem Rennen — egal welcher Wochentag.
    const dayBeforeRace = fmtD(addDays(new Date(config.raceDate + "T12:00"), -1));
    const cw = currentWeek(config);
    const nutri = dayNutrition(todaySes, tomorrowSes, phaseOfWeek(config, cw)?.kind, today === dayBeforeRace);

    return { todaySes, recap, nutri, weeks: planModel(config).weeks };
  }, [plan, activities, planConfig, today]);

  if (!today || !derived) return null;
  const { todaySes, recap, nutri, weeks } = derived;
  const c = checkins[today];
  const note = noteDraft ?? c?.note ?? "";
  const fs = FOCUS_STYLE[nutri.focus];

  // Check-out erst nach dem Training bzw. am Abend.
  const checkoutOpen = todaySes.some((s) => s.done) || new Date().getHours() >= 17;

  return (
    <section className="tab">
      {/* Recap */}
      {recap && (
        <>
          <h3 className="section-h3"><span className="accent">{"//"}</span> Zuletzt absolviert</h3>
          <PhotoCard type={recap.type} spaced>
            <div className="pc-kicker">{fmtDM(new Date(recap.date + "T12:00"))} · {TYPELBL[recap.type]}</div>
            <div className="pc-title">{recap.title}</div>
            <div className="chip-row" style={{ marginBottom: 8 }}>
              {recap.km ? <span className="chip">{recap.km.toFixed(1)} km</span> : null}
              {recap.hm ? <span className="chip">{recap.hm} hm</span> : null}
              {recap.min ? <span className="chip">{fmtHM(recap.min)} h</span> : null}
            </div>
            <p className="pc-note">
              Woche {recap.week} von {weeks}{recap.phaseName ? ` · ${recap.phaseName}` : ""}. {recap.benefit}
            </p>
          </PhotoCard>
        </>
      )}

      {/* Heute geplant */}
      <h3 className="section-h3"><span className="accent">{"//"}</span> Heute</h3>
      {todaySes.length ? (
        <div className="grid g2" style={{ marginBottom: 16 }}>
          {todaySes.map((s) => (
            <PhotoCard key={s.id} type={s.type} onClick={() => setDetail(s)}>
              <div className="pc-kicker">{TYPELBL[s.type]}{s.type !== "ruhe" && s.type !== "stretch" ? " · abends" : ""}</div>
              <div className="pc-title">{s.title} {s.done ? "✓" : ""}</div>
              <div className="chip-row">
                <span className="chip">{s.dur} min</span>
                {s.km ? <span className="chip">{s.km} km</span> : null}
                {s.hm ? <span className="chip">{s.hm} hm</span> : null}
                {s.done ? <span className="chip done">erledigt</span> : null}
              </div>
            </PhotoCard>
          ))}
        </div>
      ) : (
        <PhotoCard type="ruhe" spaced>
          <div className="pc-title">Freier Tag</div>
          <p className="pc-note">Kein Training geplant — Erholung ist Teil des Plans.</p>
        </PhotoCard>
      )}
      <Advice c={c} />

      {/* Ernährungscoach */}
      <div className="card" style={{ marginTop: 16, marginBottom: 16 }}>
        <h3><span className="accent">{"//"}</span> Ernährung heute</h3>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <span className="chip" style={{ background: fs.bg, color: fs.fg, border: "none", fontSize: 13 }}>{nutri.label}</span>
        </div>
        <div className="sub" style={{ fontSize: 14, color: "var(--bone)", marginBottom: 10 }}>{nutri.why}</div>
        <ul style={{ margin: 0, paddingLeft: 18, color: "var(--muted)", fontSize: 13.5, lineHeight: 1.7 }}>
          {nutri.timing.map((t, i) => <li key={i}>{t}</li>)}
        </ul>
      </div>

      {/* Check-in / Check-out */}
      <div className="grid g2">
        <div className="card">
          <h3><span className="accent">{"//"}</span> 🌅 Morgen-Check-in</h3>
          <div className="sub">Wie fühlst du dich heute? Der Plan passt sich an.</div>
          <div style={{ marginTop: 10, fontSize: 13, color: "var(--muted)" }}>Energie / Beine</div>
          <FeelRow opts={[{ v: 1, l: "1 · Leer" }, { v: 2, l: "2 · Müde" }, { v: 3, l: "3 · Ok" }, { v: 4, l: "4 · Gut" }, { v: 5, l: "5 · Stark" }]}
            value={c?.energy} onSelect={(v) => setCheckin(today, { energy: v })} />
          <div style={{ marginTop: 10, fontSize: 13, color: "var(--muted)" }}>Rechtes Knie / Kniekehle</div>
          <FeelRow knee opts={[{ v: "gruen" as const, l: "🟢 Ruhig" }, { v: "gelb" as const, l: "🟡 Spürbar" }, { v: "rot" as const, l: "🔴 Schmerz" }]}
            value={c?.knee} onSelect={(v) => setCheckin(today, { knee: v })} />
          <div style={{ marginTop: 10, fontSize: 13, color: "var(--muted)" }}>Schlaf</div>
          <FeelRow opts={[{ v: 1, l: "Schlecht" }, { v: 2, l: "Mittel" }, { v: 3, l: "Gut" }]}
            value={c?.sleep} onSelect={(v) => setCheckin(today, { sleep: v })} />
        </div>
        <div className="card" style={{ opacity: checkoutOpen ? 1 : .55 }}>
          <h3><span className="accent">{"//"}</span> 🌙 Abend-Check-out</h3>
          {!checkoutOpen && <div className="pill" style={{ marginBottom: 10 }}>ab 17:00 oder nach deinem Training</div>}
          <div className="sub">Nach dem Training: kurz eintragen, wie es lief.</div>
          <div style={{ marginTop: 10, fontSize: 13, color: "var(--muted)" }}>Anstrengung (RPE)</div>
          <FeelRow opts={[{ v: 1, l: "Locker" }, { v: 2, l: "Moderat" }, { v: 3, l: "Hart" }, { v: 4, l: "Sehr hart" }]}
            value={c?.rpe} onSelect={(v) => checkoutOpen && setCheckin(today, { rpe: v })} />
          <div style={{ marginTop: 10, fontSize: 13, color: "var(--muted)" }}>Notiz (optional)</div>
          <textarea rows={2} style={{ width: "100%", marginTop: 6 }} disabled={!checkoutOpen}
            placeholder="z.B. Knie ab km 8 gespürt, Trail rutschig ..."
            value={note} onChange={(e) => setNoteDraft(e.target.value)} />
          <button className="btn small" style={{ marginTop: 8 }} disabled={!checkoutOpen}
            onClick={() => { setCheckin(today, { note }); toast("Check-out gespeichert"); }}>
            Check-out speichern
          </button>
        </div>
      </div>

      {detail && <TrainingDetail session={detail} onClose={() => setDetail(null)} />}
    </section>
  );
}
