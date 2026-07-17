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

/** Alle synchronisierbaren Nutzerdaten in einem Paket. */
export interface SyncChanges {
  planSessions: PlanSession[];
  checkins: Checkin[];
  activities: Activity[];
  settings?: Settings;
}

export const TYPELBL: Record<string, string> = {
  trail: "Trail", lauf: "Lauf", kraft: "Kraft", rad: "Rad",
  schwimmen: "Schwimmen", yoga: "Yoga", stretch: "Stretching",
  ruhe: "Ruhe", event: "Event", sonst: "Sonstiges",
};
