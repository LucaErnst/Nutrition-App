import { useState, type ReactNode } from 'react';
import { useT } from '../i18n';

interface Props {
  title: string;
  /** Eine Zeile, die auch zugeklappt sichtbar bleibt – der Blick soll den Abschnitt nicht öffnen müssen. */
  summary?: ReactNode;
  children: ReactNode;
  className?: string;
  defaultOpen?: boolean;
}

/**
 * Karte unter „Mehr“, die sich über denselben Pfeil öffnet wie die Erinnerungen.
 * Einstellungen, die man selten anfasst, sollen die Ansicht nicht vollstellen.
 */
export function CollapsibleCard({ title, summary, children, className, defaultOpen = false }: Props) {
  const t = useT();
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className={`card section ${className ?? ''}`}>
      <div className="section-head">
        <h2>{title}</h2>
        <div className="meal-header-right">
          <button
            className={`btn-icon meal-chevron ${open ? 'open' : ''}`}
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? t('slot.collapse') : t('slot.expand')}
          >
            ›
          </button>
        </div>
      </div>
      {summary !== undefined && <p className="search-hint">{summary}</p>}
      <div className={`collapse ${open ? 'open' : ''}`} aria-hidden={!open}>
        <div className="collapse-inner">{children}</div>
      </div>
    </section>
  );
}
