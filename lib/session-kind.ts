import type { PlanSession } from "./types";

/**
 * Einordnung einer Einheit nach ihrer Rolle im Plan — eine Quelle für alle
 * Verbraucher (Umplanung, Ernährung, Wissenschafts-Texte). Die Generatoren
 * vergeben die Titel, hier werden sie an genau einer Stelle gedeutet.
 */

/** „Long Run", „Trail Long Run", „… · Edersee-Generalprobe" */
const LONG_RUN_RE = /long run|langer|edersee|generalprobe/i;
/** „Hügel-Intervalle", „Berg-Wiederholungen" — bewusst ohne „Tempo" (das trägt der Taper-Lauf). */
const QUALITY_RE = /hügel|huegel|berg|intervall|wiederholung/i;

/** Ab dieser Dauer zählt ein Trail-Lauf als langer Lauf. */
const LONG_RUN_MIN = 90;

type SessionLike = Pick<PlanSession, "type" | "title">;

export const isLongRunTitle = (title: string) => LONG_RUN_RE.test(title);
export const isQualityTitle = (title: string) => QUALITY_RE.test(title);

/** Berg-/Intervallreiz im Lauf. */
export const isQualityRun = (s: SessionLike) => s.type === "lauf" && isQualityTitle(s.title);

/** Langer Lauf: der Ausdauer-Hauptreiz der Woche. */
export const isLongRun = (s: SessionLike & Pick<PlanSession, "dur">) =>
  s.type === "trail" && (s.dur >= LONG_RUN_MIN || isLongRunTitle(s.title));

/**
 * Schlüssel-Einheit: trägt den Wochenfortschritt und darf nicht still verfallen.
 * Jeder Trail-Lauf plus die Qualitätsreize auf der Straße.
 */
export const isKeySession = (s: SessionLike) => s.type === "trail" || isQualityRun(s);
