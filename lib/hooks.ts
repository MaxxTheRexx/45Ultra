"use client";

import { useSyncExternalStore } from "react";
import { todayStr } from "./dates";

const emptySubscribe = () => () => {};

/**
 * Heutiges Datum (YYYY-MM-DD) — hydration-sicher: beim Server-Rendering
 * `null` (Komponenten rendern dann kurz nichts, statt mit einem falschen
 * Server-Datum zu hydrieren), im Browser das lokale Datum.
 */
export function useToday(): string | null {
  return useSyncExternalStore(emptySubscribe, todayStr, () => null);
}

/** true, sobald der Browser gerade offline ist (SSR zählt als online). */
export const isOffline = () =>
  typeof navigator !== "undefined" && !navigator.onLine;
