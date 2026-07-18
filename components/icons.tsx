/* Schlichtes Inline-SVG-Icon-Set (ersetzt Emoji). Erben Farbe via currentColor. */
type P = { size?: number };
const svg = (children: React.ReactNode, size = 22) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);

export const IconHeute = ({ size }: P) => svg(<><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M19 5l-1.5 1.5M6.5 17.5L5 19" /></>, size);
export const IconKalender = ({ size }: P) => svg(<><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M3 9h18M8 2v4M16 2v4" /></>, size);
export const IconDashboard = ({ size }: P) => svg(<><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></>, size);
export const IconPlan = ({ size }: P) => svg(<><path d="M3 20l6-16 6 16M9 4l6 16 6-16" /></>, size);
export const IconWissen = ({ size }: P) => svg(<><path d="M4 4h11a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H4z" /><path d="M20 20V7" /></>, size);
export const IconDaten = ({ size }: P) => svg(<><ellipse cx="12" cy="5" rx="8" ry="3" /><path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" /></>, size);
export const IconPlay = ({ size = 16 }: P) => svg(<><path d="M6 4l14 8-14 8z" fill="currentColor" stroke="none" /></>, size);
