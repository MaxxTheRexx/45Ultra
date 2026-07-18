import type { Philosophy } from "@/lib/types";

/**
 * Kuratierte Trainings-Insights mit Quellenangaben. Reine Daten — leicht
 * erweiterbar. `philosophyTags` koppelt sie an die Onboarding-Wahl
 * (haeufig = viele kleine Einheiten, intensiv = wenige intensive).
 */
export interface Insight {
  id: string;
  title: string;
  teaser: string;
  body: string[]; // Absätze
  philosophyTags: Philosophy[];
  sources: { label: string; url: string }[];
}

export const INSIGHTS: Insight[] = [
  {
    id: "polarized",
    title: "Polarisiert trainieren (80/20)",
    teaser: "Rund 80 % locker, 20 % wirklich hart — und wenig dazwischen.",
    body: [
      "Ausdauersportler:innen auf hohem Niveau verbringen den Großteil ihrer Zeit in niedriger Intensität (Zone 1–2) und nur einen kleinen, aber konsequenten Anteil in hoher Intensität. Der mittlere „graue Bereich“ wird bewusst gemieden.",
      "Praktisch heißt das: die meisten Läufe so locker, dass du dich unterhalten könntest — und wenige, dafür klar fordernde Qualitätseinheiten (Intervalle, Tempo, Berg).",
      "Passt zum Stil „wenige intensive Einheiten“: harte Reize gezielt setzen, den Rest ehrlich locker halten.",
    ],
    philosophyTags: ["intensiv"],
    sources: [
      { label: "Seiler & Kjerland 2006, Scand J Med Sci Sports", url: "https://pubmed.ncbi.nlm.nih.gov/16430681/" },
      { label: "Stephen Seiler — Polarized Training (Übersicht)", url: "https://www.trainingpeaks.com/blog/polarized-training-for-endurance-athletes/" },
    ],
  },
  {
    id: "zone2",
    title: "Zone 2: die aerobe Basis",
    teaser: "Lockeres Grundlagentempo baut den Motor, der dich lange trägt.",
    body: [
      "Zone-2-Training (ruhiger, gleichmäßiger Puls, Nasenatmung noch möglich) verbessert die Fettverbrennung und die Ausdauer-Grundlage — die Voraussetzung dafür, viele Stunden am Berg durchzuhalten.",
      "Der häufigste Fehler ist, „locker“ zu schnell zu laufen. Diszipliniert langsam zu bleiben ist der eigentliche Trainingsreiz.",
      "Basis für beide Stile — und der Kern der Philosophie „viele kleine, überwiegend lockere Einheiten“.",
    ],
    philosophyTags: ["haeufig", "intensiv"],
    sources: [
      { label: "San Millán & Brooks 2018, Med Sci Sports Exerc", url: "https://pubmed.ncbi.nlm.nih.gov/29045386/" },
    ],
  },
  {
    id: "frequenz",
    title: "Häufig & locker statt selten & hart",
    teaser: "Mehr kurze Einheiten verteilen die Last und schonen Gelenke.",
    body: [
      "Für Einsteiger:innen und verletzungsanfällige Läufer:innen ist eine höhere Frequenz kürzerer, lockerer Läufe oft nachhaltiger als wenige lange, harte Einheiten: der Körper gewöhnt sich schrittweise, ohne einzelne Spitzenbelastungen.",
      "Konstanz schlägt Einzelleistung. Vier ruhige Läufe pro Woche bringen mehr als ein einzelner Held-Lauf mit anschließender Zwangspause.",
    ],
    philosophyTags: ["haeufig"],
    sources: [
      { label: "Tanaka 1994 — Trainingsfrequenz & Adaptation", url: "https://pubmed.ncbi.nlm.nih.gov/7809554/" },
    ],
  },
  {
    id: "sehnen",
    title: "Sehnen mögen langsame, schwere Last",
    teaser: "Isometrie und exzentrisches Training machen Sehnen belastbar.",
    body: [
      "Sehnen (Patella-, Achilles-, Beugersehne) passen sich an langsame, schwere und exzentrische Reize an — nicht an Dehnen oder Schonen. Genau darum stehen Wandsitz, Step-downs und Nordic Curls im Plan.",
      "Faustregel: Schmerz bis etwa 3/10 während der Übung ist ok, wenn er am nächsten Morgen wieder weg ist. Darüber: Last reduzieren.",
    ],
    philosophyTags: ["haeufig", "intensiv"],
    sources: [
      { label: "Bohm, Mersmann & Arampatzis 2015, Sports Med Open", url: "https://pubmed.ncbi.nlm.nih.gov/27747850/" },
    ],
  },
  {
    id: "downhill",
    title: "Bergab trainieren schützt bergab",
    teaser: "Exzentrische Downhill-Belastung reduziert späteren Muskelkater.",
    body: [
      "Lange Bergab-Passagen belasten die Oberschenkel exzentrisch und verursachen den typischen Trail-Muskelkater. Gezieltes, dosiertes Downhill-Training baut einen Schutzeffekt auf (der „repeated bout effect“): der zweite harte Downhill tut deutlich weniger weh.",
      "Deshalb im Plan: Downhills bewusst laufen, nicht nur bergauf trainieren.",
    ],
    philosophyTags: ["intensiv"],
    sources: [
      { label: "Repeated-Bout-Effekt — Review (Hyldahl 2017)", url: "https://pubmed.ncbi.nlm.nih.gov/28084303/" },
    ],
  },
  {
    id: "taper",
    title: "Taper: weniger Umfang, gleiche Intensität",
    teaser: "Vor dem Rennen Umfang runter — kurze Reize aber behalten.",
    body: [
      "In den letzten 1–2 Wochen den Umfang deutlich senken (grob −40 bis −60 %), die Intensität aber in kleinen Dosen halten. So verschwindet die Ermüdung, während die Form erhalten bleibt.",
      "Nicht der Fehler, komplett zu pausieren — die Beine sollen frisch, aber wach bleiben.",
    ],
    philosophyTags: ["haeufig", "intensiv"],
    sources: [
      { label: "Bosquet et al. 2007, Med Sci Sports Exerc (Meta-Analyse)", url: "https://pubmed.ncbi.nlm.nih.gov/17762377/" },
    ],
  },
];
