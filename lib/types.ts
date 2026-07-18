export type SessionType =
  | "trail" | "lauf" | "kraft" | "rad" | "schwimmen"
  | "yoga" | "stretch" | "ruhe" | "event" | "sonst";

export type KneeState = "gruen" | "gelb" | "rot";

/** Eine geplante Trainingseinheit. `id` wird clientseitig erzeugt. */
export interface PlanSession {
  id: string;
  date: string; // YYYY-MM-DD
  week: number;
  type: SessionType;
  title: string;
  dur: number; // Minuten
  detail: string;
  km?: number;
  hm?: number;
  done: boolean;
  updatedAt: number; // Unix ms — für Sync (last-write-wins)
  deleted?: boolean;
}

/** Morgen-/Abend-Check-in eines Tages. Schlüssel: date. */
export interface Checkin {
  date: string; // YYYY-MM-DD
  energy?: number;
  knee?: KneeState;
  sleep?: number;
  rpe?: number;
  note?: string;
  updatedAt: number;
}

/** Importierte Aktivität (Garmin-CSV). Schlüssel: key (Duplikat-Schutz). */
export interface Activity {
  key: string; // date|type|km|min
  date: string;
  type: SessionType;
  km: number;
  min: number;
  hm: number;
  hr: number;
  title: string;
  updatedAt: number;
}

export interface Settings {
  goal: string; // "5:00"
  weight: number;
  updatedAt: number;
}

export const DEFAULT_SETTINGS: Settings = { goal: "5:00", weight: 75, updatedAt: 0 };

/** Trainingsphilosophie: viele kleine vs. wenige intensive Einheiten. */
export type Philosophy = "haeufig" | "intensiv";
/** Grund-Intensität des Plans. */
export type IntensityPref = "locker" | "anstrengend";

/**
 * Individuelle Renn- und Plankonfiguration eines Nutzers.
 * Wird als Ganzes synchronisiert (ein updatedAt, last-write-wins).
 * `version` steckt in den Session-IDs (`p{version}w{w}d{dow}i{i}`) und wird
 * bei jeder Neu-Generierung hochgezählt — so kollidieren neue Sessions nie
 * mit Alt-IDs und Regenerierung erzeugt saubere Tombstones.
 */
export interface PlanConfig {
  raceName: string;
  raceLocation?: string;
  raceDate: string;    // YYYY-MM-DD
  distanceKm: number;
  elevationHm: number;
  planStart: string;   // YYYY-MM-DD, beim Speichern auf Montag normalisiert
  trainingDays: number; // 3..7
  philosophy: Philosophy;
  intensity: IntensityPref;
  version: number;
  preset?: "heartcore-legacy"; // nur vom Migrationspfad gesetzt
  updatedAt: number;
}

/** Editierbare Config-Felder (ohne intern verwaltete version/updatedAt/preset). */
export type PlanConfigInput = Omit<PlanConfig, "version" | "updatedAt" | "preset">;

/** PlanConfig → editierbare Felder (eine Quelle für die Feld-Abgrenzung). */
export function toPlanConfigInput(c: PlanConfig): PlanConfigInput {
  const rest = { ...c } as Partial<PlanConfig>;
  delete rest.version; delete rest.updatedAt; delete rest.preset;
  return rest as PlanConfigInput;
}

/** Alle synchronisierbaren Nutzerdaten in einem Paket. */
export interface SyncChanges {
  planSessions: PlanSession[];
  checkins: Checkin[];
  activities: Activity[];
  settings?: Settings;
  planConfig?: PlanConfig;
}

export const TYPELBL: Record<string, string> = {
  trail: "Trail", lauf: "Lauf", kraft: "Kraft", rad: "Rad",
  schwimmen: "Schwimmen", yoga: "Yoga", stretch: "Stretching",
  ruhe: "Ruhe", event: "Event", sonst: "Sonstiges",
};
