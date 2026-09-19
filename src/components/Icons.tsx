import type { SVGProps } from 'react';

type P = SVGProps<SVGSVGElement>;
const base: P = { width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true };

/** Tagebuch: Notizbuch */
export const IconDiary = (p: P) => (
  <svg {...base} {...p}>
    <path d="M5 4h11a2 2 0 0 1 2 2v14H7a2 2 0 0 1-2-2V4z" />
    <path d="M9 4v16M12 8h3M12 11h3" />
  </svg>
);

/** Woche: Kalenderraster */
export const IconWeek = (p: P) => (
  <svg {...base} {...p}>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M3 10h18M8 3v4M16 3v4M8 14h2M12 14h2M16 14h2M8 18h2M12 18h2" />
  </svg>
);

/** Gewicht: Waage/Trend */
export const IconWeight = (p: P) => (
  <svg {...base} {...p}>
    <path d="M3 17l5-6 4 3 5-7 4 4" />
    <path d="M3 21h18" />
  </svg>
);

/** Datenbank: Apfel */
export const IconFood = (p: P) => (
  <svg {...base} {...p}>
    <path d="M12 7c-1.5-1.5-4-1.5-5.5 0C4 9.5 4.5 15 7.5 19c1 1.4 2 1.5 3 1s2 0 3 .5 2-.1 3-1.5c3-4 3.5-9.5 1-12-1.5-1.5-4-1.5-5.5 0z" />
    <path d="M12 7c0-2 1-3.5 3-4" />
  </svg>
);

/** Mehr: drei Punkte */
export const IconMore = (p: P) => (
  <svg {...base} {...p}>
    <circle cx="5" cy="12" r="1.6" fill="currentColor" stroke="none" />
    <circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" />
    <circle cx="19" cy="12" r="1.6" fill="currentColor" stroke="none" />
  </svg>
);
