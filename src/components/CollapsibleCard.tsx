import { useState, type ReactNode } from 'react';
import { useT } from '../i18n';
import { SettingIcon, type SettingKind } from './Icons';

interface Props {
  title: string;
  /** Eine Zeile, die auch zugeklappt sichtbar bleibt – der Blick soll den Abschnitt nicht öffnen müssen. */
  summary?: ReactNode;
  children: ReactNode;
  className?: string;
  defaultOpen?: boolean;
  /** Farbiges Symbol links vom Titel (Einstellungsliste unter „Mehr“) */
  icon?: SettingKind;
}

/**
 * Karte unter „Mehr“, die sich über denselben Pfeil öffnet wie die Erinnerungen.
 * Einstellungen, die man selten anfasst, sollen die Ansicht nicht vollstellen.
 */
export function CollapsibleCard({ title, summary, children, className, defaultOpen = false, icon }: Props) {
  const t = useT();
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className={`card section ${className ?? ''}`}>
      <div className="section-head section-head-tap" onClick={() => setOpen((v) => !v)}>
        {icon && <SettingIcon kind={icon} />}
        <h2>{title}</h2>
        <div className="meal-header-right">
          <button
            className={`btn-icon meal-chevron ${open ? 'open' : ''}`}
            onClick={(ev) => {
              ev.stopPropagation();
              setOpen((v) => !v);
            }}
            aria-expanded={open}
            aria-label={open ? t('slot.collapse') : t('slot.expand')}
          >
            <svg viewBox="0 0 8 13" width="8" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M1.5 1.5 6.5 6.5l-5 5" />
            </svg>
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
