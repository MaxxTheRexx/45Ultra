import type { SessionType } from "./types";

/** Foto pro Trainingstyp (public/img, offline vorab gecacht). */
export const SESSION_IMG: Record<SessionType, string> = {
  trail: "/img/trail.webp",
  lauf: "/img/lauf.webp",
  kraft: "/img/kraft.webp",
  rad: "/img/rad.webp",
  schwimmen: "/img/schwimmen.webp",
  yoga: "/img/yoga.webp",
  stretch: "/img/stretch.webp",
  ruhe: "/img/ruhe.webp",
  event: "/img/event.webp",
  sonst: "/img/lauf.webp",
};

/** Große Motiv-Bilder für Hero-/Kontext-Flächen. */
export const HERO_IMG = {
  login: "/img/hero-login.webp",
  heute: "/img/hero-heute.webp",
  plan: "/img/hero-plan.webp",
  recap: "/img/recap.webp",
  nutrition: "/img/nutrition.webp",
} as const;
