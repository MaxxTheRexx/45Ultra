import { addDays, fmtD, todayStr, weekIndexOf, APP_START_DATE, PLAN_START } from "./dates";
import type { PlanSession, SessionType } from "./types";

/* ---------- Übungs-Bibliothek ---------- */
export const KRAFT_A = `Sehnen-Rehab-Block (ca. 45 min, abends ok):
· Isometrischer Wandsitz 5x 45 s (Patellasehne beruhigen)
· Spanische Kniebeuge mit Band 4x 10 langsam
· Step-downs von Stufe, exzentrisch 3 s runter, 3x 12 je Seite
· Nordic Hamstring Curls 3x 6 (Kniekehle / Beugersehne)
· Wadenheber exzentrisch an Stufe 3x 15
· Fußknöchel: Einbeinstand auf Kissen 3x 45 s je Seite
· Monster Walks mit Miniband 3x 15 Schritte
· Abschluss: Seitstütz 3x 40 s`;

export const KRAFT_B = `Aufbau-Block (ca. 50 min):
· Bulgarian Split Squats 4x 8 je Seite (Kurzhanteln/Rucksack)
· Einbeiniges Kreuzheben 3x 8 je Seite
· Step-ups auf hohe Box 3x 10 je Seite
· Nordic Hamstring Curls 3x 8
· Wadenheber einbeinig 3x 12
· Fußknöchel: seitliche Hüpfer 3x 20 + Balance-Pad 2x 60 s
· Core: Plank Shoulder Taps 3x 20, Seitstütz 3x 45 s`;

export const KRAFT_C = `Erhaltungs-Block Taper (ca. 30 min, leicht):
· Wandsitz isometrisch 3x 40 s
· Split Squats nur Körpergewicht 3x 8
· Nordic Hamstring 2x 5
· Einbeinstand instabil 3x 45 s
· Wadenheber 2x 15`;

export const STRETCH_STD = `Quadrizeps, Hüftbeuger, Waden (gestreckt + gebeugt), hintere Kette, Adduktoren. Je 2x 45 s. Danach Kniekehle sanft mit Nervenmobilisation (Bein heben, Fuß pumpen 15x).`;

/* ---------- Session-Fabrik ---------- */
type SessionSeed = Omit<PlanSession, "id" | "date" | "week" | "done" | "updatedAt">;

const S = (
  type: SessionType, title: string, dur: number, detail: string,
  extra: { km?: number; hm?: number } = {},
): SessionSeed => ({ type, title, dur, detail, ...extra });

/* ---------- Wochen-Templates (Mo..So) ---------- */
function weekTemplate(w: number): SessionSeed[][] {
  const ruhe = () => S("ruhe", "Ruhetag", 20, "Komplett frei oder Spaziergang.\n15 bis 20 min Stretching am Abend:\n" + STRETCH_STD);
  const yoga = () => S("yoga", "Yoga + Fuß/Knie-Stabi", 75, "60 min Yoga-Studio (Hatha/Yin, nichts Explosives).\nDanach 15 min: Einbeinstand instabil, Zehen greifen, Sprunggelenk-ABC.");
  const swim = (min = 45) => S("schwimmen", "Schwimmen locker", min, "Technikfokus, lockere Bahnen. Null Belastung fürs Knie, gute Grundlage.");
  const stretch = () => S("stretch", "Stretching-Abend", 20, STRETCH_STD);
  switch (true) {
    /* Phase 1 · Wo 1-3 · Basis + Sehnen-Rehab */
    case w <= 3: return [
      [ruhe()],
      [S("kraft", "Kraft A · Sehnen-Rehab", 45, KRAFT_A)],
      [S("lauf", "Dauerlauf locker", w === 1 ? 45 : 55, "Flach, ruhiger Puls (Zone 2). Gehpause sofort, wenn das Knie meldet.\nDanach Lauf-ABC 10 min + 4 Steigerungen.", { km: w === 1 ? 7 : 9 })],
      [S("rad", "Rad GA1", 75, "Rennrad locker, hohe Trittfrequenz (90+), kleiner Gang.\nKniekehle beobachten: Sattelhöhe eher 5 mm runter, wenn es zieht.", { km: 0 })],
      [yoga()],
      [S("trail", "Trail Long Run", w === 1 ? 90 : (w === 2 ? 110 : 130), "Trails, bewusst langsam. Alle Anstiege gehen (Powerhike üben!).\nTrinkweste mitnehmen, Essen alle 40 min testen.", { km: w === 1 ? 12 : (w === 2 ? 15 : 17), hm: w === 1 ? 300 : (w === 2 ? 400 : 500) })],
      [swim(), stretch()],
    ];
    /* Phase 2 · Wo 4-7 · Aufbau */
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
    /* Wo 8 · Edersee-Woche */
    case w === 8: return [
      [ruhe()],
      [S("kraft", "Kraft A · leicht", 35, "Reduzierte Version von Kraft A, keine neuen Reize vor dem Wochenende.\nWandsitz, Step-downs, Balance. Kein Nordic Hamstring.")],
      [S("lauf", "Lockerer Lauf + Strides", 40, "30 min locker + 4 Steigerungen. Beine frisch halten.", { km: 6 })],
      [stretch()],
      [S("stretch", "Anreise Edersee + Mobility", 30, "Packliste checken: Blasenpflaster, Salztabletten, Powerbank, Stirnlampe.\n20 min Mobility nach der Anfahrt.")],
      [S("event", "EDERSEE · Etappe 1", 330, "~35 km um den Edersee. Bewusst LANGSAM anlaufen (Ultra-Tempo = Wohlfühltempo minus 10 %).\nEssen ab km 5, alle 30 bis 40 min. Das ist dein Ultra-Hauptreiz, kein Rennen!", { km: 35, hm: 700 })],
      [S("event", "EDERSEE · Etappe 2", 300, "~30 km auf müden Beinen. Genau dafür machst du das: Laufen im ermüdeten Zustand.\nDanach: Protein + Füße hoch.", { km: 30, hm: 600 })],
    ];
    /* Wo 9 · Recovery + Ankunft München */
    case w === 9: return [
      [ruhe()],
      [S("schwimmen", "Schwimmen regenerativ", 40, "Nur ausschwimmen, Beine lockern.")],
      [stretch()],
      [S("lauf", "Lockerer Lauf", 40, "Erst laufen, wenn Muskelkater komplett weg ist. Sonst spazieren.", { km: 6 })],
      [yoga()],
      [S("trail", "Wanderung / Berge locker", 150, "München-Auftakt: lockere Bergwanderung, 600 bis 800 hm.\nPowerhike-Rhythmus üben, kein Laufdruck.", { km: 12, hm: 700 })],
      [S("lauf", "Trail locker", 80, "1:20 h entspannt auf Trails.", { km: 11, hm: 300 }), stretch()],
    ];
    /* Wo 10 · München · letzte harte Woche */
    case w === 10: return [
      [ruhe()],
      [S("kraft", "Kraft B · letzte harte Einheit", 50, KRAFT_B)],
      [S("lauf", "Berg-Wiederholungen", 75, "6x 4 min bergauf kräftig (RPE 7-8), bergab gehen/traben.\nAlternativ Treppen, wenn kein Berg in Reichweite.", { km: 10, hm: 400 })],
      [S("rad", "Rad oder Schwimmen", 75, "Locker, nur Durchblutung.")],
      [yoga()],
      [S("trail", "Long Run Berge · LETZTER LANGER", 195, "3:00 bis 3:15 h, 1.200 bis 1.400 hm. Renntag simulieren:\ngleiche Schuhe, gleiche Weste, gleiche Verpflegung, Downhills zügig.", { km: 24, hm: 1300 })],
      [S("lauf", "Recovery-Lauf", 35, "Ganz locker.", { km: 5 }), stretch()],
    ];
    /* Wo 11 · Taper + RACE */
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

/**
 * Erzeugt den kompletten 11-Wochen-Plan.
 * IDs sind deterministisch (Woche/Tag/Index) — so erzeugt jeder Client
 * denselben Plan und Sync führt nicht zu Duplikaten.
 */
export function generatePlan(now = Date.now()): PlanSession[] {
  const plan: PlanSession[] = [];
  for (let w = 1; w <= 11; w++) {
    const mon = addDays(PLAN_START, (w - 1) * 7);
    const tpl = weekTemplate(w);
    tpl.forEach((sessions, dow) => {
      const dstr = fmtD(addDays(mon, dow));
      if (dstr < APP_START_DATE) return; // Start der App
      sessions.forEach((s, i) =>
        plan.push({ ...s, id: `w${w}d${dow}i${i}`, date: dstr, week: w, done: false, updatedAt: now }),
      );
    });
  }
  return plan;
}

/* ---------- Phasen-Metadaten ---------- */
export const PHASES = [
  { w: [1, 3] as const, name: "Basis & Sehnen-Rehab", color: "var(--moss)", desc: "Umfang moderat, Knie- und Kniekehlensehne mit langsamer Kraft belastbar machen. Alle Anstiege gehen. Fußgelenke täglich reizen." },
  { w: [4, 7] as const, name: "Aufbau & Vertical", color: "var(--bone)", desc: "Long Runs wachsen auf 26 km / 900 hm. Hügel-Intervalle abends. Woche 7: Generalprobe mit Edersee-Rucksack." },
  { w: [8, 8] as const, name: "Edersee 65K Überdistanz", color: "var(--red)", desc: "2 Etappen, 65 km gesamt. Der wichtigste Ausdauerreiz des Blocks. Kein Rennen, Wohlfühltempo!" },
  { w: [9, 9] as const, name: "Recovery + München-Start", color: "var(--sky)", desc: "Nach Edersee 4 bis 5 Tage sehr locker. Dann Berge in München als lockere Wanderungen anfangen." },
  { w: [10, 10] as const, name: "München Peak", color: "var(--orange)", desc: "Letzte harte Woche: Berg-Wiederholungen + letzter Long Run mit 1.300 hm als Renn-Simulation." },
  { w: [11, 11] as const, name: "Taper & Race", color: "var(--amber)", desc: "Umfang minus 60 %, Intensität in kleinen Dosen halten. Carboloading Samstag. Sonntag: ernten." },
];

export function phaseOfWeek(w: number) {
  return PHASES.find((p) => w >= p.w[0] && w <= p.w[1]);
}

export const PLAN_WEEKS = 11;

/** Aktuelle Planwoche, auf 1..PLAN_WEEKS begrenzt. */
export function currentWeek() {
  return Math.min(PLAN_WEEKS, Math.max(1, weekIndexOf(todayStr())));
}

/* ---------- Wochenziele je Phase ---------- */
export function weekTargets(w: number) {
  if (w <= 3) return { km: 25 + w * 3, hm: 500 + w * 100, kraft: 1, stretch: 100, cross: 2 };
  if (w <= 7) return { km: [42, 46, 50, 46][w - 4], hm: [900, 1100, 1300, 1200][w - 4], kraft: 1, stretch: 120, cross: 2 };
  if (w === 8) return { km: 75, hm: 1400, kraft: 1, stretch: 100, cross: 0 };
  if (w === 9) return { km: 30, hm: 1000, kraft: 0, stretch: 120, cross: 2 };
  if (w === 10) return { km: 42, hm: 1800, kraft: 1, stretch: 120, cross: 1 };
  return { km: 15, hm: 150, kraft: 1, stretch: 100, cross: 0 };
}

/* ---------- Rezepte ---------- */
export const RECIPES = [
  { tag: "Vor dem Training · 15 Uhr", t: "Honig-Toast + Banane", p: "2 Scheiben Toast mit Honig, 1 Banane, Espresso optional. Schnelle KH, magenfreundlich, 2 h vor dem Abendlauf.", time: "3 min" },
  { tag: "Nach dem Training · spät", t: "Skyr-Recovery-Bowl", p: "300 g Skyr, Beeren (TK geht), 40 g Granola, 1 EL Honig, Handvoll Nüsse. 30 g Protein + KH, ohne Kochen.", time: "4 min" },
  { tag: "Abendessen", t: "Express-Reis-Bowl", p: "Kochbeutelreis, 2 Spiegeleier, TK-Edamame, Sojasauce, Sesam, Avocado wenn da. Salzig genug nach Schwitzeinheit.", time: "12 min" },
  { tag: "Abendessen", t: "Pasta mit Linsen-Bolognese", p: "Rote Linsen 10 min mit Passata, Zwiebel, Brühe köcheln. Auf Pasta. Doppelte Menge kochen = Mittag für morgen.", time: "20 min" },
  { tag: "Abendessen", t: "Ofensüßkartoffel + Hüttenkäse", p: "Süßkartoffel 8 min Mikrowelle statt 45 min Ofen. Aufschneiden, Hüttenkäse, Olivenöl, Salz, Chiliflocken.", time: "12 min" },
  { tag: "Abendessen", t: "Wrap-Duo", p: "2 Wraps mit Hähnchenstreifen oder Falafel, Joghurtsauce, Salat, Paprika. Einer sofort, einer für die Kühlbox.", time: "10 min" },
  { tag: "Frühstück", t: "Overnight Oats", p: "60 g Haferflocken, 250 ml Milch, Chia, Apfelmus, Zimt. Abends anrühren, morgens fertig. An Long-Run-Tagen doppelt.", time: "3 min abends" },
  { tag: "Sehnen-Support", t: "Kollagen-Shot vor Kraft", p: "15 g Kollagenpulver (oder 2 Blatt Gelatine aufgelöst) + Saft einer Orange. 45 min vor jeder Kraft-Einheit trinken.", time: "2 min" },
  { tag: "Long Run · unterwegs", t: "Ultra-Verpflegung selbstgemacht", p: "Reiskuchen (Sushi-Reis + Kokosmilch + Salz, in Würfel), salzige Mini-Kartoffeln, Datteln. Alles am Edersee testen!", time: "20 min am Vortag" },
];

export function nutritionFocus(cw: number) {
  return cw <= 3 ? "Basis-Phase: Normale Mischkost, Protein hoch (Muskel- und Sehnenaufbau). Kein KH-Stress, aber nie nüchtern in die Abend-Einheit."
    : cw <= 7 ? "Aufbau-Phase: KH um harte Tage periodisieren. Vor Hügel-Intervallen und Long Runs KH hoch, an Ruhetagen normal. Long-Run-Verpflegung jetzt jede Woche üben (60–80 g KH/h)."
    : cw === 8 ? "Edersee-Woche: Ab Donnerstag KH hochfahren (6–8 g/kg). Am Event: essen nach Uhr, nicht nach Hunger. Elektrolyte! Danach 48 h bewusst viel Protein."
    : cw === 9 ? "Recovery: Viel Protein (2 g/kg), Obst, Gemüse, Schlaf. Das Immunsystem ist nach 65 km angezählt."
    : cw === 10 ? "Peak-Woche München: Wie Aufbau-Phase. Brotzeit auf der Hütte zählt als Long-Run-Verpflegung, aber Radler erst nach dem letzten langen Lauf."
    : "Race Week: Mo–Do normal, Fr leicht erhöht, Sa Carboloading 8–10 g KH/kg (Reis, Saft, Weißbrot, wenig Ballaststoffe). So früh: gewohntes Frühstück 3 h vor Start.";
}
