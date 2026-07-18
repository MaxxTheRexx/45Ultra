/**
 * Kuratierte Übungsvideos (etablierte, evidenzbasierte Physio-/Lauf-Kanäle).
 * STATUS: Vorschlag zur Freigabe — siehe docs/video-kuratierung.md.
 * Jeder Eintrag hat eine youtubeId (für Einbettung) und funktioniert per
 * "Auf YouTube ansehen"-Link auch, falls ein Kanal die Einbettung sperrt.
 */
export interface VideoEntry {
  youtubeId: string;
  title: string;
  channel: string;
  topic: string; // grobe Zuordnung zum Übungsblock
}

export const VIDEOS: VideoEntry[] = [
  { youtubeId: "_e9vFU9-tkc", title: "Nordic Hamstring Curls richtig aufbauen", channel: "E3 Rehab", topic: "Kraft · hintere Kette" },
  { youtubeId: "9TemDaazL8A", title: "Nordic Hamstring Curl — Kurzdemo", channel: "E3 Rehab", topic: "Kraft · hintere Kette" },
];
