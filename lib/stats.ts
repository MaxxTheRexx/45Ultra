import { addDays, fmtD, weekMonday } from "./dates";
import type { Activity, PlanSession, Settings } from "./types";

/* Wochen-Statistik: kombiniert CSV-Aktivitäten + erledigte Plan-Einheiten
   (ohne Doppelzählung: CSV gewinnt bei Läufen). */
export function weekStats(monday: Date, activities: Activity[], plan: PlanSession[]) {
  const from = fmtD(monday), to = fmtD(addDays(monday, 6));
  const acts = activities.filter((a) => a.date >= from && a.date <= to);
  const doneSess = plan.filter((s) => s.done && s.date >= from && s.date <= to);
  const runActs = acts.filter((a) => a.type === "lauf" || a.type === "trail");
  let km = runActs.reduce((s, a) => s + a.km, 0);
  let hm = runActs.reduce((s, a) => s + a.hm, 0);
  if (runActs.length === 0) { // Fallback auf Plan-Haken
    const runSess = doneSess.filter((s) => ["lauf", "trail", "event"].includes(s.type));
    km = runSess.reduce((s, x) => s + (x.km || 0), 0);
    hm = runSess.reduce((s, x) => s + (x.hm || 0), 0);
  }
  const kraft = Math.max(
    acts.filter((a) => a.type === "kraft").length,
    doneSess.filter((s) => s.type === "kraft").length,
  );
  const cross = Math.max(
    acts.filter((a) => a.type === "rad" || a.type === "schwimmen").length,
    doneSess.filter((s) => ["rad", "schwimmen"].includes(s.type)).length,
  );
  const stretch =
    doneSess.filter((s) => ["stretch", "yoga", "ruhe"].includes(s.type)).length * 25 +
    acts.filter((a) => a.type === "yoga").reduce((s, a) => s + a.min, 0);
  return { km, hm, kraft, cross, stretch, longest: Math.max(0, ...runActs.map((a) => a.km)) };
}

export function last6wRunStats(activities: Activity[]) {
  const runs = activities.filter((a) => (a.type === "lauf" || a.type === "trail") && a.km > 2);
  const cutoff = fmtD(addDays(new Date(), -42));
  const recent = runs.filter((a) => a.date >= cutoff);
  const weeks: Record<string, { km: number; hm: number }> = {};
  recent.forEach((a) => {
    const wk = fmtD(weekMonday(new Date(a.date + "T12:00")));
    weeks[wk] = weeks[wk] || { km: 0, hm: 0 };
    weeks[wk].km += a.km;
    weeks[wk].hm += a.hm;
  });
  const wvals = Object.values(weeks);
  const avgKm = wvals.length ? wvals.reduce((s, w) => s + w.km, 0) / Math.max(6, wvals.length) : 0;
  const avgHm = wvals.length ? wvals.reduce((s, w) => s + w.hm, 0) / Math.max(6, wvals.length) : 0;
  const longest = Math.max(0, ...recent.map((a) => a.km));
  const paced = recent.filter((a) => a.min > 0 && a.km > 3 && a.hm < a.km * 15);
  const flatPace = paced.length ? paced.reduce((s, a) => s + a.min / a.km, 0) / paced.length : 6.0;
  return { avgKm, avgHm, longest, flatPace, n: recent.length };
}

/* Prognose-Modell: Flach-Äquivalent (100 hm ≈ 1 km), skaliert mit Trainingszustand. */
export function predictRace(activities: Activity[]) {
  const st = last6wRunStats(activities);
  if (st.n < 3) return null;
  const fitKm = Math.min(1, st.avgKm / 50);              // 50 km/Wo = voll
  const fitHm = Math.min(1, st.avgHm / 1200);            // 1200 hm/Wo = voll
  const kFactor = 1.15 - 0.25 * fitHm;                   // hm-Kosten: 1,15 → 0,90 km pro 100 hm
  const eqKm = 45 + 20 * kFactor;                        // Flach-Äquivalent
  const trailFactor = 1.10 - 0.05 * fitHm;               // Technik/Untergrund: 1,10 → 1,05
  const paceAdj = 1.06 - 0.08 * fitKm;                   // Umfang macht die Pace haltbarer
  const endurancePenalty = Math.max(0, 32 - st.longest) * 1.6; // min, wenn längster Lauf < 32 km
  const total = eqKm * st.flatPace * trailFactor * paceAdj + endurancePenalty;
  return { total, eqKm, endurancePenalty, st, trailFactor, paceAdj, kFactor };
}

export function goalMin(settings: Settings) {
  const p = (settings.goal || "5:00").split(":");
  return +p[0] * 60 + (+p[1] || 0);
}
