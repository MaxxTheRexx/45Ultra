import { fmtD } from "./dates";
import type { Activity, SessionType } from "./types";

/* CSV-Import für Garmin-Connect-Exporte (DE/EN, robust). */

function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [], cur = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) {
      if (ch === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; }
      else cur += ch;
    } else if (ch === '"') q = true;
    else if (ch === ",") { row.push(cur); cur = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (cur !== "" || row.length) { row.push(cur); rows.push(row); row = []; cur = ""; }
    } else cur += ch;
  }
  if (cur !== "" || row.length) { row.push(cur); rows.push(row); }
  return rows;
}

const num = (v: unknown) => {
  if (v == null) return 0;
  const s = ("" + v).replace(/\./g, "").replace(",", ".").replace(/[^\d.-]/g, "");
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
};

// "12,34" oder "12.34" oder "1.234,56"
const numSmart = (v: unknown) => {
  if (v == null) return 0;
  const s = ("" + v).trim().replace(/"/g, "");
  if (/,\d{1,2}$/.test(s)) return num(s);
  const n = parseFloat(s.replace(/,/g, ""));
  return isNaN(n) ? 0 : n;
};

// "1:23:45" oder "45:30"
function timeToMin(t: unknown) {
  if (!t) return 0;
  const p = ("" + t).trim().split(":").map(Number);
  if (p.some(isNaN)) return 0;
  if (p.length === 3) return p[0] * 60 + p[1] + p[2] / 60;
  if (p.length === 2) return p[0] + p[1] / 60;
  return 0;
}

function parseDateAny(s: unknown): string | null {
  if (!s) return null;
  const str = ("" + s).trim();
  let m = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  m = str.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})/);
  if (m) return `${m[3]}-${String(m[2]).padStart(2, "0")}-${String(m[1]).padStart(2, "0")}`;
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : fmtD(d);
}

function classify(typeRaw: string): SessionType {
  const t = (typeRaw || "").toLowerCase();
  if (/trail/.test(t)) return "trail";
  if (/lauf|run/.test(t)) return "lauf";
  if (/rad|cycl|bike|virtual/.test(t)) return "rad";
  if (/schwimm|swim|pool/.test(t)) return "schwimmen";
  if (/yoga|pilates/.test(t)) return "yoga";
  if (/kraft|strength|training/.test(t)) return "kraft";
  if (/wander|hik/.test(t)) return "trail";
  return "sonst";
}

/** Liest Garmin-CSV-Text und liefert neue Aktivitäten (ohne Duplikate zu `existing`). */
export function importCSV(
  text: string,
  existing: Activity[],
): { added: Activity[]; error?: string } {
  const rows = parseCSV(text);
  if (rows.length < 2) return { added: [], error: "CSV leer oder nicht lesbar" };
  const head = rows[0].map((h) => h.toLowerCase());
  const col = (re: RegExp) => head.findIndex((h) => re.test(h));
  const ci = {
    type: col(/aktivitätstyp|activity type|typ$/),
    date: col(/datum|date/),
    dist: col(/distanz|distance/),
    time: col(/^zeit$|^time$|dauer|elapsed|moving/),
    elev: col(/anstieg|elevation gain|aufstieg|total ascent/),
    hr: col(/ø herz|avg hr|durchschnittliche herz|average heart/),
    title: col(/titel|title|name/),
  };
  if (ci.date < 0 || ci.dist < 0)
    return { added: [], error: "Spalten nicht erkannt (Datum/Distanz fehlen)" };
  const seen = new Set(existing.map((a) => a.key));
  const added: Activity[] = [];
  const now = Date.now();
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r[ci.date]) continue;
    const date = parseDateAny(r[ci.date]);
    if (!date) continue;
    const a: Activity = {
      date,
      type: classify(ci.type >= 0 ? r[ci.type] : ""),
      km: numSmart(r[ci.dist]),
      min: Math.round(timeToMin(ci.time >= 0 ? r[ci.time] : "")),
      hm: Math.round(numSmart(ci.elev >= 0 ? r[ci.elev] : 0)),
      hr: Math.round(numSmart(ci.hr >= 0 ? r[ci.hr] : 0)),
      title: ci.title >= 0 ? r[ci.title] : "",
      key: "",
      updatedAt: now,
    };
    a.key = `${a.date}|${a.type}|${a.km.toFixed(1)}|${a.min}`;
    if (seen.has(a.key)) continue;
    seen.add(a.key);
    added.push(a);
  }
  return { added };
}
