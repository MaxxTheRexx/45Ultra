export const RACE_DATE = new Date(2026, 8, 20); // 20.09.2026
export const PLAN_START = new Date(2026, 6, 6); // Mo 06.07.2026 (Woche 1)
export const APP_START_DATE = "2026-07-08";
/** Beginn des Trainingsblocks als Date (gleiche Quelle wie APP_START_DATE). */
export const BLOCK_START = new Date(APP_START_DATE + "T00:00");

export const DOW = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

// Immer LOKALES Datum formatieren — toISOString() (UTC) würde vor 2 Uhr
// nachts bzw. bei Mitternachts-Dates alles um einen Tag verschieben.
const pad = (n: number) => String(n).padStart(2, "0");
export const fmtD = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** Kurzformat für die Anzeige: "17.7." */
export const fmtDM = (d: Date) => `${d.getDate()}.${d.getMonth() + 1}.`;

export const todayStr = () => fmtD(new Date());

/** Wochentag mit Montag = 0 … Sonntag = 6. */
export const weekdayIndex = (d: Date) => (d.getDay() + 6) % 7;

export function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export function weekMonday(d: Date) {
  const x = new Date(d);
  x.setDate(x.getDate() - weekdayIndex(x));
  x.setHours(0, 0, 0, 0);
  return x;
}

export function weekIndexOf(dateStr: string) {
  const d = new Date(dateStr + "T12:00");
  return Math.floor((weekMonday(d).getTime() - PLAN_START.getTime()) / (7 * 864e5)) + 1;
}

export const fmtHM = (min: number) => {
  const h = Math.floor(min / 60), m = Math.round(min % 60);
  return `${h}:${String(m).padStart(2, "0")}`;
};
