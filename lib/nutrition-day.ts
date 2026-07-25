import type { PhaseKind } from "./plan-model";
import { isLongRun, isQualityRun } from "./session-kind";
import type { PlanSession } from "./types";

/**
 * Regelbasierter Tages-Ernährungscoach. Pur — leitet aus heutigen + morgigen
 * Einheiten und der Phase eine Empfehlung (Low/Normal/High-Carb), einen kurzen
 * Grund und ein Timing-Merkzettel ab.
 */
export type CarbFocus = "low" | "normal" | "high";
export interface DayNutrition {
  focus: CarbFocus;
  label: string;
  why: string;
  timing: string[];
}

type Load = "hart" | "moderat" | "frei";

function classify(sessions: PlanSession[]): Load {
  if (sessions.some((s) => s.type === "event")) return "hart";
  if (sessions.some((s) => isLongRun(s) || isQualityRun(s))) return "hart";
  if (sessions.some((s) => ["lauf", "trail", "kraft", "rad", "schwimmen"].includes(s.type))) return "moderat";
  return "frei";
}

export function dayNutrition(
  todaySessions: PlanSession[],
  tomorrowSessions: PlanSession[],
  phase: PhaseKind | undefined,
  isDayBeforeRace: boolean,
): DayNutrition {
  const today = classify(todaySessions);
  const tomorrow = classify(tomorrowSessions);
  const hasKraft = todaySessions.some((s) => s.type === "kraft");
  const isEvent = todaySessions.some((s) => s.type === "event");
  const longRun = todaySessions.find(isLongRun);

  if (isEvent) {
    return {
      focus: "high", label: "High-Carb · Renntag",
      why: "Renntag — deine Kohlenhydratspeicher sollen randvoll sein.",
      timing: ["Gewohntes Frühstück ~3 h vor dem Start", "Ab km 5: 60–80 g KH pro Stunde", "Elektrolyte nicht vergessen"],
    };
  }
  if (isDayBeforeRace) {
    return {
      focus: "high", label: "High-Carb · Carboloading",
      why: "Tag vor dem Rennen: Speicher auffüllen (8–10 g KH/kg).",
      timing: ["Reis, Pasta, Saft, Weißbrot", "Wenig Ballaststoffe (Magen)", "Früh ins Bett"],
    };
  }
  if (today === "hart") {
    return {
      focus: "high", label: "High-Carb · harte Einheit",
      why: "Für eine harte Einheit brauchst du volle Glykogenspeicher.",
      timing: [
        "Letzte große Mahlzeit ~3 h vorher",
        "Direkt danach 20–30 g Protein + Kohlenhydrate (45-Minuten-Fenster)",
        ...(longRun ? ["Unterwegs 60–80 g KH/h üben"] : []),
      ],
    };
  }
  if (today === "moderat" && hasKraft) {
    return {
      focus: "normal", label: "Normal · Protein-Fokus",
      why: "Krafttag: Eiweiß baut Muskeln und Sehnen mit auf.",
      timing: ["Kollagen-Shot ~45 min vor der Kraft-Einheit", "20–30 g Protein direkt danach", "1,6–2 g Protein pro kg über den Tag"],
    };
  }
  if (tomorrow === "hart") {
    return {
      focus: "high", label: "High-Carb · morgen wird hart",
      why: "Heute schon auffüllen — morgen steht eine harte Einheit an.",
      timing: ["Abends kohlenhydratreich (Reis/Pasta)", "Nicht nüchtern in die Morgeneinheit"],
    };
  }
  if (today === "frei" && (phase === "peak" || phase === "taper")) {
    return {
      focus: "normal", label: "Normal · Taper/Peak",
      why: "Umfang sinkt, aber kein Kaloriendefizit — die Form soll halten.",
      timing: ["Ausgewogen essen, kein Loch", "Schlaf priorisieren"],
    };
  }
  if (today === "frei") {
    return {
      focus: "low", label: "Low-Carb möglich",
      why: "Lockerer Tag: der Fettstoffwechsel darf arbeiten, Protein bleibt hoch.",
      timing: ["Protein zu jeder Mahlzeit", "Gemüse & gute Fette", "Viel trinken"],
    };
  }
  return {
    focus: "normal", label: "Normal",
    why: "Ausgewogene Mischkost, Protein im Blick.",
    timing: ["Vor dem Training ein leichter KH-Snack", "Nach dem Training Protein + KH"],
  };
}
