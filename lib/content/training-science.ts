import type { PhaseKind } from "@/lib/plan-model";
import { isLongRunTitle, isQualityTitle } from "@/lib/session-kind";
import type { PlanSession, SessionType } from "@/lib/types";

/**
 * Wissenschaftlicher Hintergrund pro Trainingsart. Reine Daten, Muster wie
 * insights.ts. scienceFor() verfeinert erst per Titel-Regex, dann per Typ.
 */
export interface TrainingScience {
  why: string[];   // wissenschaftlicher Hintergrund, 1–2 Absätze
  benefit: string; // "Was bringt es" — ein Satz
  placement: string; // Baustein-Satz: wo die Einheit im Plan steht
  sources: { label: string; url: string }[];
}

const SRC = {
  seiler: { label: "Seiler & Kjerland 2006 (polarisiert)", url: "https://pubmed.ncbi.nlm.nih.gov/16430681/" },
  sanMillan: { label: "San Millán & Brooks 2018 (Zone 2)", url: "https://pubmed.ncbi.nlm.nih.gov/29045386/" },
  bohm: { label: "Bohm, Mersmann & Arampatzis 2015 (Sehnen)", url: "https://pubmed.ncbi.nlm.nih.gov/27747850/" },
  hyldahl: { label: "Hyldahl 2017 (Repeated-Bout-Effekt)", url: "https://pubmed.ncbi.nlm.nih.gov/28084303/" },
  bosquet: { label: "Bosquet et al. 2007 (Taper-Metaanalyse)", url: "https://pubmed.ncbi.nlm.nih.gov/17762377/" },
  jeukendrup: { label: "Jeukendrup 2014 (Kohlenhydrat-Aufnahme)", url: "https://pubmed.ncbi.nlm.nih.gov/24791918/" },
  midgley: { label: "Midgley et al. 2007 (VO2max-Intervalle)", url: "https://pubmed.ncbi.nlm.nih.gov/17004848/" },
  lauersen: { label: "Lauersen et al. 2014 (Verletzungsprävention)", url: "https://pubmed.ncbi.nlm.nih.gov/24100287/" },
  beattie: { label: "Beattie et al. 2014 (Kraft & Ausdauerleistung)", url: "https://pubmed.ncbi.nlm.nih.gov/24532151/" },
  behm: { label: "Behm et al. 2016 (Stretching-Review)", url: "https://pubmed.ncbi.nlm.nih.gov/26642915/" },
  fullagar: { label: "Fullagar et al. 2015 (Schlaf & Erholung)", url: "https://pubmed.ncbi.nlm.nih.gov/25315456/" },
  tanaka: { label: "Tanaka 1994 (Cross-Training)", url: "https://pubmed.ncbi.nlm.nih.gov/7809554/" },
};

const PLACEMENT: Record<PhaseKind, string> = {
  base: "Baustein der Basis-Phase: hier legst du die aerobe Grundlage und machst Sehnen & Gelenke belastbar.",
  build: "Baustein der Aufbau-Phase: jetzt wachsen Umfang, Höhenmeter und spezifische Reize Richtung Renntempo.",
  peak: "Baustein der Peak-Phase: höchste spezifische Belastung als Renn-Simulation, bevor die Erholung beginnt.",
  taper: "Baustein der Taper-Phase: Umfang runter, Spritzigkeit halten — die Formkurve zeigt nach oben.",
};

const CATALOG: Record<string, TrainingScience> = {
  longrun: {
    why: [
      "Der lange Lauf ist der wichtigste spezifische Reiz für ein Trail-/Ultra-Rennen. Über die Dauer verbessert sich der Fettstoffwechsel, die Ermüdungsresistenz der Muskulatur und die Fähigkeit, viele Stunden gleichmäßig zu laufen.",
      "Die Downhill-Abschnitte belasten die Oberschenkel exzentrisch — dosiert wiederholt baut das einen Schutz gegen den typischen Trail-Muskelkater auf. Gleichzeitig übst du hier deine Renn-Verpflegung (60–80 g KH/h).",
    ],
    benefit: "Er macht dich lange haltbar — körperlich und im Kopf.",
    placement: PLACEMENT.build,
    sources: [SRC.sanMillan, SRC.hyldahl, SRC.jeukendrup],
  },
  huegel: {
    why: [
      "Hügel- und Berg-Intervalle heben die VO2max und die Laktatschwelle — dein Motor wird größer und du kannst höhere Tempi länger halten. Bergauf ist dabei gelenkschonender als flaches Tempotraining.",
      "In einem polarisierten Ansatz sind das die wenigen, klar harten Reize (etwa 20 % des Trainings), während der Rest bewusst locker bleibt.",
    ],
    benefit: "Mehr Spitzenleistung am Berg — genau da, wo Trailrennen entschieden werden.",
    placement: PLACEMENT.build,
    sources: [SRC.midgley, SRC.seiler],
  },
  dauerlauf: {
    why: [
      "Lockere Dauerläufe in Zone 2 (unterhalten wäre möglich) bauen die aerobe Grundlage: mehr Kapillaren, mehr Mitochondrien, besserer Fettstoffwechsel. Das ist das Fundament, auf dem alles andere steht.",
      "Der häufigste Fehler ist, „locker“ zu schnell zu laufen. Diszipliniert langsam zu bleiben ist hier der eigentliche Trainingsreiz.",
    ],
    benefit: "Der günstige Dauerreiz, der deine Ausdauer Woche für Woche wachsen lässt.",
    placement: PLACEMENT.base,
    sources: [SRC.sanMillan, SRC.seiler],
  },
  recovery: {
    why: [
      "Der Recovery-Lauf ist bewusst kurz und sehr locker. Er fördert die Durchblutung und den Abtransport von Stoffwechselprodukten, ohne neue Ermüdung aufzubauen — aktive Erholung statt Zusatzbelastung.",
    ],
    benefit: "Er beschleunigt deine Erholung, statt sie zu bremsen.",
    placement: "Verbindungsstück zwischen harten Einheiten — hält die Beine locker.",
    sources: [SRC.seiler],
  },
  taperlauf: {
    why: [
      "In der Taper-Phase sinkt der Umfang deutlich (grob −40 bis −60 %), die Intensität bleibt aber in kleinen Dosen erhalten. So verschwindet die Ermüdung, während die Form gehalten wird.",
      "Kurze Renntempo-Abschnitte halten das Nervensystem wach, ohne müde zu machen.",
    ],
    benefit: "Frische Beine am Renntag — ohne die Form zu verlieren.",
    placement: PLACEMENT.taper,
    sources: [SRC.bosquet],
  },
  kraft: {
    why: [
      "Krafttraining macht Sehnen und Muskeln belastbar. Sehnen (Patella-, Achilles-, Beugersehne) passen sich an langsame, schwere und exzentrische Last an — nicht an Dehnen oder Schonen. Genau das steckt in Wandsitz, Step-downs und Nordic Curls.",
      "Über die Verletzungsprävention hinaus verbessert Maximalkraft nachweislich die Laufökonomie: Du brauchst pro Schritt weniger Energie.",
    ],
    benefit: "Weniger Verletzungen und ein ökonomischerer Laufstil.",
    placement: "Ganzjähriger Schutz-Baustein — 1–2× pro Woche, auch wenn es mal wenig Zeit gibt.",
    sources: [SRC.bohm, SRC.lauersen, SRC.beattie],
  },
  rad: {
    why: [
      "Radfahren bringt aerobe Grundlage ohne Aufprallbelastung — ideal, um Umfang zu ergänzen, wenn die Beine vom Laufen schwer sind. Hohe Trittfrequenz, kleiner Gang schont die Kniekehle.",
    ],
    benefit: "Zusätzliche Ausdauer bei null Stoßbelastung für die Gelenke.",
    placement: "Gelenkschonende Ergänzung zum Laufumfang.",
    sources: [SRC.sanMillan, SRC.tanaka],
  },
  schwimmen: {
    why: [
      "Schwimmen ist regeneratives Cross-Training: Herz-Kreislauf-Reiz bei völliger Entlastung von Knie und Sprunggelenk. Gut für aktive Erholung und an Tagen mit müden Beinen.",
    ],
    benefit: "Ausdauer und Erholung zugleich — komplett gelenkfrei.",
    placement: "Regenerativer Baustein, besonders nach harten Blöcken.",
    sources: [SRC.tanaka],
  },
  yoga: {
    why: [
      "Yoga verbessert Beweglichkeit, Rumpfstabilität und Körperwahrnehmung. Wichtig: Dehnen ersetzt kein Krafttraining für die Sehnen — es ergänzt es. Fokus auf Hüftöffner, hintere Kette und Fußgelenke.",
      "Ruhige Abend-Sessions (Yin) helfen zusätzlich beim Einschlafen nach spätem Training.",
    ],
    benefit: "Beweglichkeit, Stabilität und ein ruhigeres Nervensystem.",
    placement: "Mobilitäts- und Regenerations-Baustein.",
    sources: [SRC.behm, SRC.bohm],
  },
  stretch: {
    why: [
      "Gezielte Mobility hält den Bewegungsradius von Hüfte, Waden und Sprunggelenk erhalten — wichtig für Technik am Trail. Statisches Dehnen direkt vor harten Einheiten kann die Leistung kurzfristig senken; als eigene Einheit oder danach ist es sinnvoll.",
    ],
    benefit: "Geschmeidige Gelenke und weniger muskuläre Verspannung.",
    placement: "Tägliche kleine Pflege — hält dich beweglich.",
    sources: [SRC.behm],
  },
  ruhe: {
    why: [
      "Anpassung passiert nicht im Training, sondern in der Erholung. Am Ruhetag reparieren sich Muskeln und Sehnen und werden stärker. Schlaf ist dabei der stärkste Hebel für Regeneration und Immunfunktion.",
    ],
    benefit: "Hier wirst du tatsächlich stärker — Ruhe ist Teil des Plans, kein Ausfall.",
    placement: "Fester Baustein: ohne Erholung keine Anpassung.",
    sources: [SRC.fullagar, SRC.bosquet],
  },
  event: {
    why: [
      "Der Wettkampf ist der Zielreiz, auf den alles hinarbeitet. Pacing (erste Hälfte bewusst zurückhalten) und Verpflegung (60–80 g KH/h, früh beginnen) entscheiden über die zweite Rennhälfte.",
    ],
    benefit: "Der Tag der Ernte — hier zahlt sich der ganze Block aus.",
    placement: "Das Ziel des gesamten Plans.",
    sources: [SRC.jeukendrup, SRC.hyldahl],
  },
};

const BY_TYPE: Record<SessionType, TrainingScience> = {
  trail: CATALOG.longrun,
  lauf: CATALOG.dauerlauf,
  kraft: CATALOG.kraft,
  rad: CATALOG.rad,
  schwimmen: CATALOG.schwimmen,
  yoga: CATALOG.yoga,
  stretch: CATALOG.stretch,
  ruhe: CATALOG.ruhe,
  event: CATALOG.event,
  sonst: CATALOG.dauerlauf,
};

/** Wählt den passenden Wissenschafts-Eintrag: erst Titel, dann Typ. */
export function scienceFor(s: Pick<PlanSession, "type" | "title">): TrainingScience {
  const t = s.title.toLowerCase();
  if (isLongRunTitle(t)) return CATALOG.longrun;
  if (/recovery|regenerativ/.test(t)) return CATALOG.recovery;
  if (/taper|anschwitzen|renntempo/.test(t)) return CATALOG.taperlauf;
  if (isQualityTitle(t)) return CATALOG.huegel;
  if (/carbo|ruhe \+/.test(t)) return CATALOG.ruhe;
  return BY_TYPE[s.type] ?? CATALOG.dauerlauf;
}
