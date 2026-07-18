import type { PlanSession, SessionType } from "./types";

/* ---------- Übungs-Bibliothek (deutsche Inhalte, quellenneutral) ---------- */
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
export type SessionSeed = Omit<PlanSession, "id" | "date" | "week" | "done" | "updatedAt">;

export const S = (
  type: SessionType, title: string, dur: number, detail: string,
  extra: { km?: number; hm?: number } = {},
): SessionSeed => ({ type, title, dur, detail, ...extra });

/* Wiederkehrende Bausteine, unabhängig von Renndaten. */
export const ruheSeed = () =>
  S("ruhe", "Ruhetag", 20, "Komplett frei oder Spaziergang.\n15 bis 20 min Stretching am Abend:\n" + STRETCH_STD);
export const stretchSeed = () => S("stretch", "Stretching-Abend", 20, STRETCH_STD);
export const yogaSeed = () =>
  S("yoga", "Yoga + Fuß/Knie-Stabi", 75, "60 min Yoga (Hatha/Yin, nichts Explosives).\nDanach 15 min: Einbeinstand instabil, Zehen greifen, Sprunggelenk-ABC.");
export const swimSeed = (min = 45) =>
  S("schwimmen", "Schwimmen locker", min, "Technikfokus, lockere Bahnen. Null Belastung fürs Knie, gute Grundlage.");

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
  { tag: "Long Run · unterwegs", t: "Ultra-Verpflegung selbstgemacht", p: "Reiskuchen (Sushi-Reis + Kokosmilch + Salz, in Würfel), salzige Mini-Kartoffeln, Datteln. Vor dem Renntag testen!", time: "20 min am Vortag" },
];
