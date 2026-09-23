import { saveSettings, useSettings, useUnitSystem } from '../db/hooks';
import { useT } from '../i18n';
import { bodyWeightUnitFor, defaultUnitFor, heightUnitFor, labelFor, type UnitSystem } from '../lib/units';

const SYSTEMS: { id: UnitSystem; key: 'units.metric' | 'units.us' | 'units.uk' }[] = [
  { id: 'metric', key: 'units.metric' },
  { id: 'us', key: 'units.us' },
  { id: 'uk', key: 'units.uk' },
];

/**
 * Mehr → Einheiten. Die Wahl bestimmt nur Reihenfolge und Vorgabe im Auswahlmenü; jede
 * Einheit bleibt erreichbar, und bereits eingetragene Mengen ändern sich nie.
 */
export function UnitsSection() {
  const t = useT();
  const settings = useSettings();
  const system = useUnitSystem();

  return (
    <section className="card section">
      <h2>{t('units.title')}</h2>
      <div className="chips" role="radiogroup" aria-label={t('units.title')}>
        {SYSTEMS.map((s) => (
          <button
            key={s.id}
            type="button"
            role="radio"
            aria-checked={system === s.id}
            className={`chip ${system === s.id ? 'active' : ''}`}
            onClick={() => void saveSettings({ units_system: s.id })}
            disabled={!settings}
          >
            {t(s.key)}
          </button>
        ))}
      </div>
      <p className="search-hint">
        {t('units.example', {
          weight: labelFor(defaultUnitFor('weight', system), t('unit.piece')),
          volume: labelFor(defaultUnitFor('volume', system), t('unit.piece')),
        })}
      </p>
      <p className="search-hint">
        {t('units.body', {
          bodyWeight: bodyWeightUnitFor(system) === 'st' ? 'st / lb' : bodyWeightUnitFor(system),
          height: heightUnitFor(system) === 'cm' ? 'cm' : 'ft / in',
        })}
      </p>
      <p className="search-hint">{t('units.hint')}</p>
    </section>
  );
}
