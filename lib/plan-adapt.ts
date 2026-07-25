import { addDays, fmtD, weekIndexOf, weekMonday } from "./dates";
import { isKeySession } from "./session-kind";
import type { PlanConfig, PlanSession } from "./types";

/**
 * Adaptive Planlogik — pur, deterministisch, idempotent.
 *
 * Wenn eine Schlüssel-Einheit (langer Lauf oder Berg-/Hügel-Qualität) in der
 * AKTUELLEN Woche überfällig und nicht erledigt ist, wird sie auf einen freien
 * Tag der Restwoche geschoben (nie Montag=Ruhe, nie am/nach Renntag). Verpasste
 * lockere Einheiten verfallen still.
 */

export interface AdaptMove { id: string; date: string; week: number }

/** Offene Schlüssel-Einheit — erledigte und gelöschte scheiden aus. */
const isOpenKey = (s: PlanSession) => !s.done && !s.deleted && isKeySession(s);

/** Schlüssel-Einheiten der aktuellen Woche, die vor heute lagen → auf freie Tage schieben. */
export function rebalance(plan: PlanSession[], config: PlanConfig, today: string): AdaptMove[] {
  const wToday = weekIndexOf(config.planStart, today);
  const active = plan.filter((s) => !s.deleted);

  const missedKey = active
    .filter((s) => isOpenKey(s) && s.date < today && s.week === wToday)
    .sort((a, b) => (a.date < b.date ? -1 : 1));
  if (!missedKey.length) return [];

  const mon = weekMonday(new Date(today + "T12:00"));
  // Tage, die schon eine Haupteinheit tragen (Ruhe/Stretch zählen nicht als belegt).
  const taken = new Set(active.filter((s) => !["ruhe", "stretch"].includes(s.type)).map((s) => s.date));

  const slots: string[] = [];
  for (let dow = 1; dow <= 6; dow++) { // Mo (0) nie
    const ds = fmtD(addDays(mon, dow));
    if (ds < today) continue;            // nur ab heute
    if (ds >= config.raceDate) continue; // nie am/nach Renntag
    if (taken.has(ds)) continue;         // Tag schon belegt
    slots.push(ds);
  }

  const moves: AdaptMove[] = [];
  for (const s of missedKey) {
    const slot = slots.shift();
    if (!slot) break; // kein Slot mehr → bleibt liegen ("verfallen")
    moves.push({ id: s.id, date: slot, week: wToday });
  }
  return moves;
}

/** Rein visuelle Einordnung überfälliger Einheiten (keine Mutation). */
export function missedSessions(plan: PlanSession[], config: PlanConfig, today: string): {
  expired: Set<string>; lapsedKey: Set<string>;
} {
  const wToday = weekIndexOf(config.planStart, today);
  const overdue = plan.filter((s) => !s.deleted && !s.done && s.date < today);
  const expired = new Set<string>();
  const lapsedKey = new Set<string>();
  // Schlüssel-Einheiten, für die rebalance keinen Slot mehr findet, gelten als „verfallen".
  const moved = new Set(rebalance(plan, config, today).map((m) => m.id));
  for (const s of overdue) {
    if (isOpenKey(s) && s.week === wToday) {
      if (!moved.has(s.id)) lapsedKey.add(s.id);
    } else {
      expired.add(s.id);
    }
  }
  return { expired, lapsedKey };
}
