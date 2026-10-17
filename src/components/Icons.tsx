import type { ReactNode, SVGProps } from 'react';

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

export type SettingKind = 'reminders' | 'health' | 'backup' | 'units' | 'diag' | 'water' | 'tips' | 'language' | 'legal';

const SETTING: Record<SettingKind, { bg: string; path: ReactNode }> = {
  reminders: { bg: '#ff3b30', path: <><path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15Z" /><path d="M10 21h4" /></> },
  health: { bg: '#ff2d55', path: <path d="M12 20.5 4.9 13.6A4.6 4.6 0 0 1 12 7.4a4.6 4.6 0 0 1 7.1 6.2Z" fill="currentColor" stroke="none" /> },
  backup: { bg: '#34c759', path: <><path d="M12 4v11M7.5 10.5 12 15l4.5-4.5" /><path d="M5 19h14" /></> },
  units: { bg: '#8e8e93', path: <><rect x="3" y="8" width="18" height="8" rx="1.5" /><path d="M7 8v3M11 8v4M15 8v3M19 8v3" /></> },
  diag: { bg: '#8e8e93', path: <path d="M5 7h14M5 12h14M5 17h9" /> },
  water: { bg: '#0a9fdb', path: <path d="M12 3.5s6 6.4 6 10.7a6 6 0 0 1-12 0C6 9.9 12 3.5 12 3.5Z" fill="currentColor" stroke="none" /> },
  tips: { bg: '#af52de', path: <><circle cx="12" cy="12" r="8" /><path d="M12 11v5M12 8v.1" /></> },
  language: { bg: '#007aff', path: <><circle cx="12" cy="12" r="8" /><path d="M4 12h16M12 4c2.5 2.4 2.5 13.6 0 16M12 4c-2.5 2.4-2.5 13.6 0 16" /></> },
  legal: { bg: '#8e8e93', path: <><rect x="6" y="3.5" width="12" height="17" rx="2" /><path d="M9 8h6M9 12h6M9 16h3" /></> },
};

/** Farbiges Quadrat mit Symbol wie in den iOS-Einstellungen. */
export const SettingIcon = ({ kind }: { kind: SettingKind }) => (
  <span className="setting-icon" style={{ background: SETTING[kind].bg }} aria-hidden="true">
    <svg {...base} width={17} height={17} stroke="#fff" strokeWidth={2}>
      {SETTING[kind].path}
    </svg>
  </span>
);
