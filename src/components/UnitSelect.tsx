import type { Unit, UnitType } from '../db/types';
import { useUnitSystem } from '../db/hooks';
import { useT } from '../i18n';
import { labelFor, unitChoicesForFood, type UnitGroup } from '../lib/units';

export const GROUP_KEYS: Record<UnitGroup, 'unit.groupPiece' | 'unit.groupMetric' | 'unit.groupImperial' | 'unit.groupUs' | 'unit.groupUk'> = {
  piece: 'unit.groupPiece',
  metric: 'unit.groupMetric',
  imperial: 'unit.groupImperial',
  us: 'unit.groupUs',
  uk: 'unit.groupUk',
};

interface Props {
  kind: UnitType;
  value: Unit;
  onChange: (u: Unit) => void;
  disabled?: boolean;
  ariaLabel?: string;
}

/**
 * Einheiten-Auswahl, nach Herkunft gruppiert und nach dem System des Nutzers sortiert.
 * Alle Einheiten bleiben erreichbar – wer in den USA ein Etikett in Gramm liest, findet Gramm.
 */
export function UnitSelect({ kind, value, onChange, disabled, ariaLabel }: Props) {
  const t = useT();
  const system = useUnitSystem();
  const groups = unitChoicesForFood(kind, system);
  const single = groups.length === 1 && groups[0].units.length === 1;

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as Unit)}
      disabled={disabled || single}
      aria-label={ariaLabel}
    >
      {groups.map((g) => (
        <optgroup key={g.group} label={t(GROUP_KEYS[g.group])}>
          {g.units.map((u) => (
            <option key={u} value={u}>
              {labelFor(u, t('unit.piece'))}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}
