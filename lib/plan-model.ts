import { addDays, clamp, fmtD, todayStr, weekdayIndex, weekIndexOf, weekMonday } from "./dates";
import {
  KRAFT_A, KRAFT_B, KRAFT_C, S,
  ruheSeed, stretchSeed, yogaSeed, type SessionSeed,
} from "./plan-content";
import {
  generateLegacyPlan, legacyNutritionFocus, legacyPhaseOfWeek,
  legacyWeekTargets, LEGACY_PHASES, LEGACY_WEEKS,
} from "./plan-legacy";
import type { PlanConfig, PlanConfigInput, PlanSession } from "./types";

export type PhaseKind = "base" | "build" | "peak" | "taper";

export interface Phase {
  kind: PhaseKind;
  w: [number, number];
  name: string;
  color: string;
  desc: string;
}

export interface PlanModel {
  weeks: number;
  phases: Phase[];
  phaseOfWeek: (w: number) => Phase | undefined;
  weekTargets: (w: number) => { km: number; hm: number; kraft: number; stretch: number; cross: number };
  /** Alle Einheiten erzeugen (IDs mit Version → kollisionsfrei, saubere Regenerierung). */
  generate: (opts: { now: number; fromDate?: string }) => PlanSession[];
  /** Ernährungsfokus der Woche. */
  nutrition: (w: number) => string;
}

const intensityScale = (c: PlanConfig) => (c.intensity === "anstrengend" ? 1.05 : 0.85);

/** Nächster Montag ab heute (Default für den Planstart). */
export function nextMonday(from = new Date()): Date {
  const d = weekMonday(from);
  if (d.getTime() < from.getTime() - 12 * 3600e3) d.setDate(d.getDate() + 7);
  return d;
}

/** Sinnvolle Startwerte für das Onboarding. */
export function defaultConfigInput(): PlanConfigInput {
  const start = nextMonday();
  const race = addDays(start, 11 * 7 - 1); // ~11 Wochen später, ein Sonntag
  return {
    raceName: "",
    raceLocation: "",
    raceDate: fmtD(race),
    distanceKm: 45,
    elevationHm: 900,
    planStart: fmtD(start),
    trainingDays: 5,
    philosophy: "haeufig",
    intensity: "locker",
  };
}

export const planStartMonday = (c: { planStart: string }) => weekMonday(new Date(c.planStart + "T12:00"));

/** Gesamtzahl Wochen von planStart bis Renntag (inklusive Renn-Woche), 4..24. */
export function planWeeks(c: PlanConfig): number {
  if (c.preset === "heartcore-legacy") return LEGACY_WEEKS;
  const start = planStartMonday(c).getTime();
  const raceMon = weekMonday(new Date(c.raceDate + "T12:00")).getTime();
  return clamp(Math.round((raceMon - start) / (7 * 864e5)) + 1, 4, 24);
}

/** Phasen-Aufteilung (Basis → Aufbau → Peak → Taper), Renntag in der letzten Woche. */
function computePhases(c: PlanConfig): Phase[] {
  const weeks = planWeeks(c);
  const taper = weeks <= 8 ? 1 : 2;
  let peak = clamp(Math.round(weeks * 0.2), 1, 3);
  let base = clamp(Math.round(weeks * 0.35), 1, weeks - taper - peak - 1);
  let build = weeks - base - peak - taper;
  if (build < 1) { build = 1; base = weeks - build - peak - taper; }
  if (base < 1) { base = 1; peak = Math.max(1, weeks - base - build - taper); }

  const ranges: [PhaseKind, number][] = [
    ["base", base], ["build", build], ["peak", peak], ["taper", taper],
  ];
  const META: Record<PhaseKind, { name: string; color: string; desc: string }> = {
    base: { name: "Basis & Grundlage", color: "var(--moss)", desc: "Umfang ruhig aufbauen, Sehnen und Gelenke mit langsamer Kraft belastbar machen. Alle Anstiege gehen, Technik und Fußstabilität schulen." },
    build: { name: "Aufbau & Vertical", color: "var(--bone)", desc: "Long Runs und Höhenmeter wachsen. Gezielte Reize (Hügel/Qualität) je nach Trainingsstil. Verpflegung bei jedem langen Lauf üben." },
    peak: { name: "Peak", color: "var(--orange)", desc: "Höchste spezifische Belastung: längster Lauf und stärkste Höhenmeter als Renn-Simulation. Danach beginnt die Erholung." },
    taper: { name: "Taper & Race", color: "var(--amber)", desc: "Umfang deutlich runter, kurze Reize halten die Spritzigkeit. Carboloading vor dem Renntag. Am Zieltag: ernten." },
  };
  const phases: Phase[] = [];
  let w = 1;
  for (const [kind, len] of ranges) {
    if (len <= 0) continue;
    phases.push({ kind, w: [w, w + len - 1], ...META[kind] });
    w += len;
  }
  return phases;
}

/** Ist Woche w innerhalb Basis/Aufbau eine Entlastungswoche (jede 4.)? */
const isCutback = (w: number, kind: PhaseKind) =>
  (kind === "base" || kind === "build") && w % 4 === 0;

/** Long-Run-Kennzahlen für Woche w. */
function longRun(c: PlanConfig, phases: Phase[], weeks: number, w: number) {
  const scale = intensityScale(c);
  const peakKm = clamp(c.distanceKm * 0.6, 8, 32);
  const hmPerKm = c.elevationHm / Math.max(1, c.distanceKm);
  const lastBuild = phases.find((p) => p.kind === "build")?.w[1]
    ?? phases.find((p) => p.kind === "base")!.w[1];
  const phase = phases.find((p) => w >= p.w[0] && w <= p.w[1])!;
  let frac: number;
  if (phase.kind === "base" || phase.kind === "build") {
    frac = 0.45 + 0.55 * (w - 1) / Math.max(1, lastBuild - 1);
    if (isCutback(w, phase.kind)) frac *= 0.75;
  } else if (phase.kind === "peak") {
    frac = 1.0;
  } else {
    // Taper: absteigend
    const taperStart = weeks - (weeks <= 8 ? 1 : 2) + 1;
    frac = w === weeks ? 0 : 0.45 - 0.15 * (w - taperStart);
  }
  const km = Math.round(peakKm * frac * scale * 10) / 10;
  const hm = Math.round(peakKm * frac * hmPerKm * 0.9 * scale);
  return { km, hm };
}

const runDur = (km: number, hm: number) => Math.max(20, Math.round(km * 6.5 + hm * 0.06));

/** Kraftblock passend zur Phase. */
function kraftSeed(kind: PhaseKind): SessionSeed {
  if (kind === "taper") return S("kraft", "Kraft C · Erhaltung", 30, KRAFT_C);
  if (kind === "base") return S("kraft", "Kraft A · Grundlage & Sehnen", 45, KRAFT_A);
  return S("kraft", "Kraft B · Aufbau", 50, KRAFT_B);
}

/**
 * Baut die Woche als 7 Tages-Slots (Mo..So).
 * Mo = Ruhetag, langer Lauf am Samstag. Zahl der Einheiten aus trainingDays,
 * Verteilung/Intensität aus philosophy + intensity.
 */
function weekPlan(c: PlanConfig, phases: Phase[], weeks: number, w: number): SessionSeed[][] {
  const days: SessionSeed[][] = [[], [], [], [], [], [], []];
  const phase = phases.find((p) => w >= p.w[0] && w <= p.w[1])!;
  const scale = intensityScale(c);
  const lr = longRun(c, phases, weeks, w);

  // Renn-Woche: Event auf den echten Renn-Wochentag, davor nur leichte Reize.
  if (w === weeks) {
    const raceDow = weekdayIndex(new Date(c.raceDate + "T12:00"));
    days[0] = [ruheSeed()];
    if (raceDow >= 3) days[2] = [S("lauf", "Taper-Lauf + Renntempo", 45, "30 min locker mit 3x 3 min im geplanten Renngefühl. Danach Füße hoch.", { km: Math.round(c.distanceKm * 0.15), hm: 0 })];
    if (raceDow >= 5) days[raceDow - 1] = [S("stretch", "Ruhe + Carboloading", 20, "8–10 g KH/kg Körpergewicht heute (Reis, Pasta, Saft, Weißbrot). Früh schlafen, Drop Bag packen.")];
    else if (raceDow >= 2) days[raceDow - 1] = [stretchSeed()];
    days[raceDow] = [S("event", `🏁 ${c.raceName}`, runDur(c.distanceKm, c.elevationHm), `Renntag! ${c.distanceKm} km · ${c.elevationHm} hm.\nErste Kilometer bewusst zurückhalten, Anstiege powerhiken, ab der Hälfte ernten.\nEssen ab km 5, 60–80 g KH/h. Du hast alles dafür getan — genieß es!`, { km: c.distanceKm, hm: c.elevationHm })];
    return days;
  }

  days[0] = [ruheSeed()];                 // Mo Ruhe
  days[5] = [S("trail", "Long Run", runDur(lr.km, lr.hm), "Bewusst langsam, alle Anstiege powerhiken (Technik!).\nVerpflegung üben: 60–80 g KH/h, genau wie am Renntag.", { km: lr.km, hm: lr.hm })];

  // Verfügbare Slot-Tage (Priorität): Di, Do, Mi, So, Fr.
  // Long Run (Sa) zählt als einer der Trainingstage; Mo bleibt Ruhe.
  const slotDays = [1, 3, 2, 6, 4];
  const extra = Math.max(0, Math.min(slotDays.length, c.trainingDays - 1));
  const chosen = slotDays.slice(0, extra);

  const kraft = () => kraftSeed(phase.kind);
  const easyKm = Math.max(4, Math.round(c.distanceKm * 0.18 * scale));
  const easy = () => S("lauf", "Dauerlauf locker", runDur(easyKm, 0), "Ruhiger Puls (Zone 2). Gehpausen erlaubt, sobald es zwickt.\nDanach Lauf-ABC + 4 Steigerungen.", { km: easyKm });
  const recovery = () => S("lauf", "Recovery-Lauf", runDur(Math.round(easyKm * 0.7), 0), "Ganz locker, Beine ausschütteln. Alternativ 40 min Rad.", { km: Math.round(easyKm * 0.7) });
  const cross = () => S("rad", "Rad GA1", 75, "Locker, hohe Trittfrequenz, kleiner Gang. Gelenkschonende Grundlage. Alternativ Schwimmen.");
  const quality = () => {
    const km = Math.max(6, Math.round(c.distanceKm * 0.22));
    const reps = phase.kind === "peak" ? "6x 3 min bergauf kräftig (RPE 8), Gehpause bergab." : "8x 90 s bergauf zügig (RPE 7), Trab zurück.";
    return S("lauf", "Hügel-Intervalle", runDur(km, Math.round(km * 25)), `15 min einlaufen.\n${reps}\n15 min auslaufen. Abbruch bei Schmerz über 3/10.`, { km, hm: Math.round(km * 25) });
  };

  // Session-Prioritäten je Philosophie
  const hard = phase.kind === "build" || phase.kind === "peak";
  const builders = c.philosophy === "intensiv"
    ? [kraft, hard ? quality : easy, cross, yogaSeed, easy]
    : [easy, kraft, cross, yogaSeed, recovery];

  chosen.forEach((dow, i) => { days[dow] = [builders[i % builders.length]()]; });
  // Sonntag zusätzlich Stretching, wenn frei
  if (!days[6].length) days[6] = [stretchSeed()];
  return days;
}

function parametricNutrition(c: PlanConfig, weeks: number, phaseOfWeek: (w: number) => Phase | undefined, w: number): string {
  if (w === weeks) return "Race Week: Mo–Do normal essen, Fr leicht erhöht, Sa Carboloading 8–10 g KH/kg (Reis, Saft, Weißbrot, wenig Ballaststoffe). Am Morgen: gewohntes Frühstück 3 h vor dem Start.";
  const kind = phaseOfWeek(w)?.kind ?? "base";
  return kind === "base" ? "Basis-Phase: Normale Mischkost, Protein hoch (1,6–2 g/kg für Muskel- und Sehnenaufbau). Nie nüchtern in die Haupteinheit."
    : kind === "build" ? "Aufbau-Phase: Kohlenhydrate um harte Tage periodisieren — vor Qualität und Long Run hoch, an Ruhetagen normal. Long-Run-Verpflegung jede Woche üben (60–80 g KH/h)."
    : kind === "peak" ? "Peak-Phase: Volle KH-Speicher vor den Schlüsseleinheiten, danach zügig Protein + KH zum Auffüllen. Schlaf priorisieren, das Immunsystem ist gefordert."
    : "Taper-Phase: Umfang sinkt, Kohlenhydrate bleiben — nicht in ein Kaloriendefizit rutschen. Viel Protein, viel Schlaf, damit die Formkurve nach oben zeigt.";
}

/**
 * Memoisiertes Strategie-Objekt für eine Config. Das `preset` wird hier EINMAL
 * ausgewertet; alle Berechnungen (Phasen, Ziele, Generierung, Ernährung) laufen
 * danach über dieses Objekt — Aufrufer kennen das Preset nicht.
 */
const MODEL_CACHE_MAX = 32;
const modelCache = new Map<string, PlanModel>();
export function planModel(c: PlanConfig): PlanModel {
  const cacheKey = `${c.preset ?? ""}|${c.planStart}|${c.raceDate}|${c.distanceKm}|${c.elevationHm}|${c.trainingDays}|${c.philosophy}|${c.intensity}|${c.version}`;
  const cached = modelCache.get(cacheKey);
  if (cached) return cached;

  let model: PlanModel;
  if (c.preset === "heartcore-legacy") {
    model = {
      weeks: LEGACY_WEEKS,
      phases: LEGACY_PHASES,
      phaseOfWeek: legacyPhaseOfWeek,
      weekTargets: legacyWeekTargets,
      generate: (opts) => generateLegacyPlan(opts.now),
      nutrition: legacyNutritionFocus,
    };
  } else {
    const weeks = planWeeks(c);
    const phases = computePhases(c);
    const phaseOfWeek = (w: number) => phases.find((p) => w >= p.w[0] && w <= p.w[1]);
    const weekTargets = (w: number) => {
      const week = weekPlan(c, phases, weeks, w).flat();
      const runs = week.filter((s) => ["lauf", "trail", "event"].includes(s.type));
      return {
        km: Math.round(runs.reduce((a, s) => a + (s.km ?? 0), 0)),
        hm: Math.round(runs.reduce((a, s) => a + (s.hm ?? 0), 0)),
        kraft: week.filter((s) => s.type === "kraft").length,
        cross: week.filter((s) => s.type === "rad" || s.type === "schwimmen").length,
        stretch: week.filter((s) => ["stretch", "yoga", "ruhe"].includes(s.type)).length * 25,
      };
    };
    const start = planStartMonday(c);
    const generate: PlanModel["generate"] = (opts) => {
      const out: PlanSession[] = [];
      for (let w = 1; w <= weeks; w++) {
        const mon = addDays(start, (w - 1) * 7);
        weekPlan(c, phases, weeks, w).forEach((sessions, dow) => {
          const dstr = fmtD(addDays(mon, dow));
          if (opts.fromDate && dstr < opts.fromDate) return; // Vergangenes nicht neu anlegen
          sessions.forEach((s, i) =>
            out.push({ ...s, id: `p${c.version}w${w}d${dow}i${i}`, date: dstr, week: w, done: false, updatedAt: opts.now }),
          );
        });
      }
      return out;
    };
    model = { weeks, phases, phaseOfWeek, weekTargets, generate, nutrition: (w) => parametricNutrition(c, weeks, phaseOfWeek, w) };
  }
  if (modelCache.size >= MODEL_CACHE_MAX) modelCache.delete(modelCache.keys().next().value!);
  modelCache.set(cacheKey, model);
  return model;
}

/** Erzeugt alle Trainingseinheiten für eine Config. */
export const generatePlanFromConfig = (c: PlanConfig, opts: { now: number; fromDate?: string }) =>
  planModel(c).generate(opts);

/** Aktuelle Planwoche für eine Config, auf 1..weeks begrenzt. */
export function currentWeek(c: PlanConfig): number {
  return clamp(weekIndexOf(c.planStart, todayStr()), 1, planModel(c).weeks);
}

export function phaseOfWeek(c: PlanConfig, w: number) {
  return planModel(c).phaseOfWeek(w);
}

export function weekTargets(c: PlanConfig, w: number) {
  return planModel(c).weekTargets(w);
}

/** Ernährungsfokus der Woche (delegiert an das Strategie-Objekt). */
export function nutritionFocus(c: PlanConfig, w: number): string {
  return planModel(c).nutrition(w);
}
