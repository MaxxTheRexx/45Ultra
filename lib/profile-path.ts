import type { PlanConfig } from "./types";

/* Deterministischer Zufall (mulberry32) — gleiche Config → gleiches Höhenprofil. */
function seededProfile(seed: number, steepness: number): string {
  let s = seed >>> 0;
  const rand = () => {
    s |= 0; s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const amp = Math.min(0.95, Math.max(0.3, steepness / 45));
  const n = 17;
  let h = 0.15;
  const pts: number[] = [];
  for (let i = 0; i <= n; i++) {
    const x = (i / n) * 1000;
    h = Math.min(0.95, Math.max(0.05, h + (rand() - 0.45) * amp));
    const y = i === 0 ? 0.1 : i === n ? 0.1 : h;
    pts.push(x, 100 - y * 92);
  }
  let path = "M0,100 ";
  for (let i = 0; i < pts.length; i += 2) path += `L${pts[i].toFixed(0)},${pts[i + 1].toFixed(0)} `;
  return path + "L1000,100 Z";
}

const hashStr = (str: string) => {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
};

/** SVG-Pfad des (stilisierten) Streckenprofils aus den Renndaten. */
export const profilePathFor = (c: PlanConfig) =>
  seededProfile(hashStr(c.raceName + c.distanceKm), c.elevationHm / Math.max(1, c.distanceKm));
