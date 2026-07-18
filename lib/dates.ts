export const DOW = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

/** Auf [lo, hi] begrenzen. */
export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

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

/** Planwoche eines Datums relativ zum (individuellen) Planstart. */
export function weekIndexOf(planStart: string, dateStr: string) {
  const start = weekMonday(new Date(planStart + "T12:00")).getTime();
  const d = new Date(dateStr + "T12:00");
  return Math.floor((weekMonday(d).getTime() - start) / (7 * 864e5)) + 1;
}

export const fmtHM = (min: number) => {
  const h = Math.floor(min / 60), m = Math.round(min % 60);
  return `${h}:${String(m).padStart(2, "0")}`;
};
