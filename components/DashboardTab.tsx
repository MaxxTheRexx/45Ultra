"use client";

import { useMemo } from "react";
import { addDays, fmtD, fmtHM, weekMonday } from "@/lib/dates";
import { useToday } from "@/lib/hooks";
import { currentWeek, weekTargets } from "@/lib/plan";
import { goalMin, predictRace, weekStats } from "@/lib/stats";
import { useApp } from "@/lib/store";
import { TYPELBL } from "@/lib/types";

function Bar({ lbl, cur, max, unit }: { lbl: string; cur: number; max: number; unit: string }) {
  const p = Math.min(100, max ? (cur / max) * 100 : 0);
  return (
    <div className="bar-row">
      <div className="bl"><span>{lbl}</span><b>{Math.round(cur)} / {max} {unit}</b></div>
      <div className="bar"><span className={p < 40 ? "crit" : p < 75 ? "low" : ""} style={{ width: `${p}%` }} /></div>
    </div>
  );
}

function Spark({ weeks, unit }: { weeks: { m: Date; v: number }[]; unit: string }) {
  const max = Math.max(1, ...weeks.map((w) => w.v));
  return (
    <>
      <div className="spark">
        {weeks.map((w, i) => (
          <div key={i} className={i === weeks.length - 1 ? "cur" : ""}
            style={{ height: `${Math.max(3, (w.v / max) * 100)}%` }}
            title={`${Math.round(w.v)} ${unit}`} />
        ))}
      </div>
      <div className="spark-lbl">
        {weeks.map((w, i) => <span key={i}>{w.m.getDate()}.{w.m.getMonth() + 1}</span>)}
      </div>
    </>
  );
}

export function DashboardTab() {
  const { activities, plan, settings, checkins } = useApp();
  const today = useToday();

  // Der komplette Statistik-Block hängt nur an den Daten — nicht an
  // Sync-Status oder anderen Re-Render-Auslösern.
  const stats = useMemo(() => {
    if (!today) return null;
    const pr = predictRace(activities);
    const cw = currentWeek();
    const tgt = weekTargets(cw);

    // Letzte 8 Wochen einmal berechnen; aktuelle Woche = letzter Eintrag.
    const wk = [];
    for (let i = 7; i >= 0; i--) {
      const m = addDays(weekMonday(new Date()), -7 * i);
      wk.push({ m, s: weekStats(m, activities, plan) });
    }
    const act = wk[7].s;

    const defs: [string, string][] = [];
    const kneeReds = Object.entries(checkins)
      .filter(([d, c]) => c.knee === "rot" && d >= fmtD(addDays(new Date(), -14))).length;
    if (kneeReds >= 2) defs.push(["🔴 Knie meldet sich häufig", "2+ rote Tage in 14 Tagen. Laufumfang halten, aber Tempo raus. Physio-Check einplanen, Isometrie täglich."]);
    if (pr) {
      if (pr.st.avgHm < 0.6 * tgt.hm) defs.push(["⛰️ Zu wenig Höhenmeter", "Der größte Hebel für 2.000 hm am Renntag. Hügelläufe priorisieren, in München nachladen."]);
      if (pr.st.longest < 25 && cw >= 4) defs.push(["🏃 Langer Lauf zu kurz", `Längster Lauf zuletzt ${pr.st.longest.toFixed(0)} km. Bis Edersee Richtung 26 km aufbauen.`]);
      if (pr.st.avgKm < 0.7 * tgt.km) defs.push(["📉 Wochenumfang unter Soll", "Konstanz schlägt Einzelleistung. Lieber 4 kurze Läufe als 1 langer."]);
    }
    if (act.kraft + wk[6].s.kraft < 2) defs.push(["💪 Kraft kommt zu kurz", "Weniger als 1x/Woche in den letzten 2 Wochen. Genau das schützt Knie und Sprunggelenke. Nicht streichen!"]);
    if (!defs.length) defs.push(["✅ Keine akuten Baustellen", "Weiter so. Konstanz halten, Schlaf priorisieren."]);

    return { pr, cw, tgt, wk, act, defs };
  }, [today, activities, plan, checkins]);

  if (!stats) return null;
  const { pr, cw, tgt, wk, act, defs } = stats;
  const diff = pr ? pr.total - goalMin(settings) : 0;

  return (
    <section className="tab">
      <div className="grid g2" style={{ marginBottom: 14 }}>
        <div className="card">
          <h3><span className="accent">{"//"}</span> Prognose Zielzeit · 45 km / 2.000 hm</h3>
          {!pr ? (
            <>
              <div className="pred-time">–:––<small> h</small></div>
              <div className="sub" style={{ marginTop: 6 }}>Zu wenig Daten. CSV importieren (mind. 3 Läufe der letzten 6 Wochen).</div>
            </>
          ) : (
            <>
              <div className="pred-time">{fmtHM(pr.total)}<small> h</small></div>
              <div className="sub" style={{ marginTop: 6 }}>
                {diff <= 0
                  ? <span className="delta-ok">▲ {fmtHM(Math.abs(diff))} h schneller als Ziel {settings.goal}. Stark!</span>
                  : <span className="delta-bad">▼ {fmtHM(diff)} h über Ziel {settings.goal}. Hebel: Höhenmeter + langer Lauf.</span>}
              </div>
              <hr className="sep" />
              <div className="sub" style={{ whiteSpace: "pre-line" }}>
                {`Modell (letzte 6 Wochen, ${pr.st.n} Läufe), eher konservativ:
45 km + 2.000 hm ≈ ${pr.eqKm.toFixed(0)} Flach-km (${(pr.kFactor * 10).toFixed(1)} min-km je 100 hm)
Ø Flach-Pace ${fmtHM(pr.st.flatPace)} /km · Trailfaktor ${pr.trailFactor.toFixed(2)} · Ermüdungsfaktor ${pr.paceAdj.toFixed(2)}
Ausdauer-Malus ${Math.round(pr.endurancePenalty)} min (längster Lauf ${pr.st.longest.toFixed(0)} km, Ziel 32+)
Trainingsstand: Ø ${pr.st.avgKm.toFixed(0)} km + ${pr.st.avgHm.toFixed(0)} hm pro Woche
Mehr Wochen-hm und ein längerer Long Run drücken die Prognose am stärksten.`}
              </div>
            </>
          )}
        </div>
        <div className="card">
          <h3><span className="accent">{"//"}</span> Wochenziele · Woche {cw}/11</h3>
          <div>
            <Bar lbl="Lauf-Kilometer" cur={act.km} max={tgt.km} unit="km" />
            <Bar lbl="Höhenmeter" cur={act.hm} max={tgt.hm} unit="hm" />
            <Bar lbl="Kraft-Einheiten" cur={act.kraft} max={tgt.kraft} unit="x" />
            <Bar lbl="Rad / Schwimmen" cur={act.cross} max={tgt.cross} unit="x" />
            <Bar lbl="Stretching & Yoga" cur={act.stretch} max={tgt.stretch} unit="min" />
          </div>
        </div>
      </div>
      <div className="grid g2" style={{ marginBottom: 14 }}>
        <div className="card">
          <h3><span className="accent">{"//"}</span> Lauf-km pro Woche <span className="sub">(letzte 8)</span></h3>
          <Spark weeks={wk.map((w) => ({ m: w.m, v: w.s.km }))} unit="km" />
        </div>
        <div className="card">
          <h3><span className="accent">{"//"}</span> Höhenmeter pro Woche <span className="sub">(letzte 8)</span></h3>
          <Spark weeks={wk.map((w) => ({ m: w.m, v: w.s.hm }))} unit="hm" />
        </div>
      </div>
      <div className="grid g2">
        <div className="card">
          <h3><span className="accent">{"//"}</span> Defizite &amp; Baustellen</h3>
          <div>
            {defs.map((d, i) => (
              <div key={i} style={{ marginBottom: 12 }}>
                <b style={{ fontSize: 14 }}>{d[0]}</b>
                <div className="sub">{d[1]}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <h3><span className="accent">{"//"}</span> Letzte Aktivitäten <span className="sub">(CSV)</span></h3>
          <div style={{ maxHeight: 280, overflowY: "auto" }}>
            <table className="dt">
              <thead><tr><th>Datum</th><th>Typ</th><th>km</th><th>hm</th><th>Zeit</th></tr></thead>
              <tbody>
                {activities.length ? activities.slice(0, 40).map((a) => (
                  <tr key={a.key}>
                    <td>{a.date.slice(8, 10)}.{a.date.slice(5, 7)}.</td>
                    <td>{TYPELBL[a.type] || a.type}</td>
                    <td className="mono">{a.km ? a.km.toFixed(1) : "–"}</td>
                    <td className="mono">{a.hm || "–"}</td>
                    <td className="mono">{a.min ? fmtHM(a.min) : "–"}</td>
                  </tr>
                )) : (
                  <tr><td colSpan={5} className="sub">Noch keine Daten. CSV im Tab &quot;Daten&quot; importieren.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
