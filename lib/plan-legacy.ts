import { addDays, fmtD } from "./dates";
import { KRAFT_A, KRAFT_B, KRAFT_C, S, ruheSeed, stretchSeed, swimSeed, yogaSeed, type SessionSeed } from "./plan-content";
import type { Phase } from "./plan-model";
import type { PlanConfig, PlanSession } from "./types";

/**
 * Eingefrorener HEART-CORE-45K-Plan (der ursprüngliche, hartkodierte).
 * Wird nur noch für Bestandsnutzer mit `preset: "heartcore-legacy"` verwendet,
 * damit deren Plan/Phasen/Ziele/Ernährung pixel-identisch bleiben.
 */

export const LEGACY_WEEKS = 11;
const LEGACY_PLAN_START = new Date(2026, 6, 6); // Mo 06.07.2026
const LEGACY_APP_START = "2026-07-08";

export const LEGACY_PHASES: Phase[] = [
  { kind: "base", w: [1, 3], name: "Basis & Sehnen-Rehab", color: "var(--moss)", desc: "Umfang moderat, Knie- und Kniekehlensehne mit langsamer Kraft belastbar machen. Alle Anstiege gehen. Fußgelenke täglich reizen." },
  { kind: "build", w: [4, 7], name: "Aufbau & Vertical", color: "var(--bone)", desc: "Long Runs wachsen auf 26 km / 900 hm. Hügel-Intervalle abends. Woche 7: Generalprobe mit Edersee-Rucksack." },
  { kind: "build", w: [8, 8], name: "Edersee 65K Überdistanz", color: "var(--red)", desc: "2 Etappen, 65 km gesamt. Der wichtigste Ausdauerreiz des Blocks. Kein Rennen, Wohlfühltempo!" },
  { kind: "peak", w: [9, 9], name: "Recovery + München-Start", color: "var(--sky)", desc: "Nach Edersee 4 bis 5 Tage sehr locker. Dann Berge in München als lockere Wanderungen anfangen." },
  { kind: "peak", w: [10, 10], name: "München Peak", color: "var(--orange)", desc: "Letzte harte Woche: Berg-Wiederholungen + letzter Long Run mit 1.300 hm als Renn-Simulation." },
  { kind: "taper", w: [11, 11], name: "Taper & Race", color: "var(--amber)", desc: "Umfang minus 60 %, Intensität in kleinen Dosen halten. Carboloading Samstag. Sonntag: ernten." },
];

export const legacyPhaseOfWeek = (w: number) => LEGACY_PHASES.find((p) => w >= p.w[0] && w <= p.w[1]);

export function legacyWeekTargets(w: number) {
  if (w <= 3) return { km: 25 + w * 3, hm: 500 + w * 100, kraft: 1, stretch: 100, cross: 2 };
  if (w <= 7) return { km: [42, 46, 50, 46][w - 4], hm: [900, 1100, 1300, 1200][w - 4], kraft: 1, stretch: 120, cross: 2 };
  if (w === 8) return { km: 75, hm: 1400, kraft: 1, stretch: 100, cross: 0 };
  if (w === 9) return { km: 30, hm: 1000, kraft: 0, stretch: 120, cross: 2 };
  if (w === 10) return { km: 42, hm: 1800, kraft: 1, stretch: 120, cross: 1 };
  return { km: 15, hm: 150, kraft: 1, stretch: 100, cross: 0 };
}

export function legacyNutritionFocus(cw: number) {
  return cw <= 3 ? "Basis-Phase: Normale Mischkost, Protein hoch (Muskel- und Sehnenaufbau). Kein KH-Stress, aber nie nüchtern in die Abend-Einheit."
    : cw <= 7 ? "Aufbau-Phase: KH um harte Tage periodisieren. Vor Hügel-Intervallen und Long Runs KH hoch, an Ruhetagen normal. Long-Run-Verpflegung jetzt jede Woche üben (60–80 g KH/h)."
    : cw === 8 ? "Edersee-Woche: Ab Donnerstag KH hochfahren (6–8 g/kg). Am Event: essen nach Uhr, nicht nach Hunger. Elektrolyte! Danach 48 h bewusst viel Protein."
    : cw === 9 ? "Recovery: Viel Protein (2 g/kg), Obst, Gemüse, Schlaf. Das Immunsystem ist nach 65 km angezählt."
    : cw === 10 ? "Peak-Woche München: Wie Aufbau-Phase. Brotzeit auf der Hütte zählt als Long-Run-Verpflegung, aber Radler erst nach dem letzten langen Lauf."
    : "Race Week: Mo–Do normal, Fr leicht erhöht, Sa Carboloading 8–10 g KH/kg (Reis, Saft, Weißbrot, wenig Ballaststoffe). So früh: gewohntes Frühstück 3 h vor Start.";
}

/** Config, die Joshuas bestehenden Plan exakt beschreibt (für die Migration). */
export const LEGACY_HEARTCORE_CONFIG = (now: number): PlanConfig => ({
  raceName: "HEART CORE 45K",
  raceLocation: "Heidelberg",
  raceDate: "2026-09-20",
  distanceKm: 45,
  elevationHm: 2000,
  planStart: "2026-07-06",
  trainingDays: 6,
  philosophy: "haeufig",
  intensity: "anstrengend",
  version: 0,
  preset: "heartcore-legacy",
  updatedAt: now,
});

/* Original-Wochen-Templates (Mo..So) — unverändert. */
function weekTemplate(w: number): SessionSeed[][] {
  const ruhe = ruheSeed, yoga = yogaSeed, swim = swimSeed, stretch = stretchSeed;
  switch (true) {
    case w <= 3: return [
      [ruhe()],
      [S("kraft", "Kraft A · Sehnen-Rehab", 45, KRAFT_A)],
      [S("lauf", "Dauerlauf locker", w === 1 ? 45 : 55, "Flach, ruhiger Puls (Zone 2). Gehpause sofort, wenn das Knie meldet.\nDanach Lauf-ABC 10 min + 4 Steigerungen.", { km: w === 1 ? 7 : 9 })],
      [S("rad", "Rad GA1", 75, "Rennrad locker, hohe Trittfrequenz (90+), kleiner Gang.\nKniekehle beobachten: Sattelhöhe eher 5 mm runter, wenn es zieht.", { km: 0 })],
      [yoga()],
      [S("trail", "Trail Long Run", w === 1 ? 90 : (w === 2 ? 110 : 130), "Trails, bewusst langsam. Alle Anstiege gehen (Powerhike üben!).\nTrinkweste mitnehmen, Essen alle 40 min testen.", { km: w === 1 ? 12 : (w === 2 ? 15 : 17), hm: w === 1 ? 300 : (w === 2 ? 400 : 500) })],
      [swim(), stretch()],
    ];
    case w <= 7: {
      const lr = [
        { km: 20, hm: 600, min: 150 }, { km: 23, hm: 750, min: 170 },
        { km: 26, hm: 900, min: 195 }, { km: 24, hm: 800, min: 180 },
      ][w - 4];
      return [
        [ruhe()],
        [S("kraft", "Kraft B · Aufbau", 50, KRAFT_B)],
        [S("lauf", "Hügel-Intervalle", 70, "15 min einlaufen.\n" + (w < 6 ? "8x 90 s bergauf zügig (RPE 7), Trab zurück." : "6x 3 min bergauf kräftig, Gehpause bergab.") + "\n15 min auslaufen. Abbruch bei Kniesignal über 3/10.", { km: 10, hm: 250 })],
        [S("rad", "Rad GA1/GA2", 100, "90 bis 110 min Rennrad, letzte 20 min zügig.\nAlternativ: Schwimmen 45 min, wenn die Beine schwer sind.", { km: 0 })],
        [yoga()],
        [S("trail", "Trail Long Run" + (w === 7 ? " · Edersee-Generalprobe" : ""), lr.min, (w === 7 ? "Mit Laufrucksack + Übernachtungsgewicht (ca. 4 kg)! " : "") + "Anstiege powerhiken, Downhills locker laufen (Technik!).\nVerpflegung: 60 bis 80 g KH/h, genau wie am Renntag.", { km: lr.km, hm: lr.hm })],
        [S("lauf", "Recovery-Lauf", 40, "Ganz locker, Füße sortieren. Alternativ Rad 60 min.", { km: 6 }), stretch()],
      ];
    }
    case w === 8: return [
      [ruhe()],
      [S("kraft", "Kraft A · leicht", 35, "Reduzierte Version von Kraft A, keine neuen Reize vor dem Wochenende.\nWandsitz, Step-downs, Balance. Kein Nordic Hamstring.")],
      [S("lauf", "Lockerer Lauf + Strides", 40, "30 min locker + 4 Steigerungen. Beine frisch halten.", { km: 6 })],
      [stretch()],
      [S("stretch", "Anreise Edersee + Mobility", 30, "Packliste checken: Blasenpflaster, Salztabletten, Powerbank, Stirnlampe.\n20 min Mobility nach der Anfahrt.")],
      [S("event", "EDERSEE · Etappe 1", 330, "~35 km um den Edersee. Bewusst LANGSAM anlaufen (Ultra-Tempo = Wohlfühltempo minus 10 %).\nEssen ab km 5, alle 30 bis 40 min. Das ist dein Ultra-Hauptreiz, kein Rennen!", { km: 35, hm: 700 })],
      [S("event", "EDERSEE · Etappe 2", 300, "~30 km auf müden Beinen. Genau dafür machst du das: Laufen im ermüdeten Zustand.\nDanach: Protein + Füße hoch.", { km: 30, hm: 600 })],
    ];
    case w === 9: return [
      [ruhe()],
      [S("schwimmen", "Schwimmen regenerativ", 40, "Nur ausschwimmen, Beine lockern.")],
      [stretch()],
      [S("lauf", "Lockerer Lauf", 40, "Erst laufen, wenn Muskelkater komplett weg ist. Sonst spazieren.", { km: 6 })],
      [yoga()],
      [S("trail", "Wanderung / Berge locker", 150, "München-Auftakt: lockere Bergwanderung, 600 bis 800 hm.\nPowerhike-Rhythmus üben, kein Laufdruck.", { km: 12, hm: 700 })],
      [S("lauf", "Trail locker", 80, "1:20 h entspannt auf Trails.", { km: 11, hm: 300 }), stretch()],
    ];
    case w === 10: return [
      [ruhe()],
      [S("kraft", "Kraft B · letzte harte Einheit", 50, KRAFT_B)],
      [S("lauf", "Berg-Wiederholungen", 75, "6x 4 min bergauf kräftig (RPE 7-8), bergab gehen/traben.\nAlternativ Treppen, wenn kein Berg in Reichweite.", { km: 10, hm: 400 })],
      [S("rad", "Rad oder Schwimmen", 75, "Locker, nur Durchblutung.")],
      [yoga()],
      [S("trail", "Long Run Berge · LETZTER LANGER", 195, "3:00 bis 3:15 h, 1.200 bis 1.400 hm. Renntag simulieren:\ngleiche Schuhe, gleiche Weste, gleiche Verpflegung, Downhills zügig.", { km: 24, hm: 1300 })],
      [S("lauf", "Recovery-Lauf", 35, "Ganz locker.", { km: 5 }), stretch()],
    ];
    case w === 11: return [
      [ruhe()],
      [S("kraft", "Kraft C · Erhaltung", 30, KRAFT_C)],
      [S("lauf", "Taper-Lauf + Renntempo", 50, "35 min locker mit 4x 3 min im geplanten Renngefühl.\nDanach Füße hoch.", { km: 8, hm: 100 })],
      [stretch()],
      [S("lauf", "Anschwitzen", 30, "20 min ganz locker + 4 Steigerungen. Sachen fürs Rennen rauslegen.", { km: 4 })],
      [S("stretch", "Ruhe + Carboloading", 20, "8 bis 10 g KH/kg Körpergewicht heute! Reis, Pasta, Saft, Weißbrot.\nFrüh schlafen. Drop Bag packen.")],
      [S("event", "🏁 HEART CORE TRAIL 45K", 300, "Plan: erste 15 km bewusst zurückhalten, ab km 30 ernten.\nAnstiege powerhiken, essen ab km 5, 60-80 g KH/h.\nDu hast alles dafür getan. Genieß es!", { km: 45, hm: 2000 })],
    ];
  }
  return [[], [], [], [], [], [], []];
}

/** Erzeugt den originalen 11-Wochen-Plan (nur für den Legacy-Pfad). */
export function generateLegacyPlan(now = Date.now()): PlanSession[] {
  const plan: PlanSession[] = [];
  for (let w = 1; w <= LEGACY_WEEKS; w++) {
    const mon = addDays(LEGACY_PLAN_START, (w - 1) * 7);
    weekTemplate(w).forEach((sessions, dow) => {
      const dstr = fmtD(addDays(mon, dow));
      if (dstr < LEGACY_APP_START) return;
      sessions.forEach((s, i) =>
        plan.push({ ...s, id: `w${w}d${dow}i${i}`, date: dstr, week: w, done: false, updatedAt: now }),
      );
    });
  }
  return plan;
}
