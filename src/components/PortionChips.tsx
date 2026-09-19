import type { FoodItem, Unit } from '../db/types';
import { fmt } from '../lib/nutrition';

interface Chip {
  label: string;
  amount: number;
  unit: Unit;
}

interface Props {
  food: Pick<FoodItem, 'portions' | 'default_amount' | 'last_amount' | 'last_unit' | 'unit_type'>;
  baseUnit: Unit;
  current: { amount: number; unit: Unit };
  onPick: (amount: number, unit: Unit) => void;
}

/** Schnellwahl: zuletzt verwendet, übliche Portion, eigene Portionsgrössen. */
export function PortionChips({ food, baseUnit, current, onPick }: Props) {
  const chips: Chip[] = [];
  const seen = new Set<string>();
  const add = (c: Chip) => {
    const key = `${c.amount}|${c.unit}`;
    if (c.amount > 0 && !seen.has(key)) {
      seen.add(key);
      chips.push(c);
    }
  };

  if (food.last_amount && food.last_unit) add({ label: `Zuletzt ${fmt(food.last_amount, food.last_amount % 1 ? 1 : 0)} ${food.last_unit}`, amount: food.last_amount, unit: food.last_unit });
  if (food.default_amount) add({ label: `Üblich ${fmt(food.default_amount, food.default_amount % 1 ? 1 : 0)} ${baseUnit}`, amount: food.default_amount, unit: baseUnit });
  const gramUnit: Unit = food.unit_type === 'volume' ? 'ml' : 'g';
  for (const p of food.portions ?? []) add({ label: `${p.label} (${fmt(p.grams)} ${gramUnit})`, amount: p.grams, unit: gramUnit });

  if (chips.length === 0) return null;

  return (
    <div className="chips" role="group" aria-label="Schnellwahl Menge">
      {chips.map((c) => {
        const active = c.amount === current.amount && c.unit === current.unit;
        return (
          <button key={`${c.amount}|${c.unit}`} type="button" className={`chip ${active ? 'active' : ''}`} onClick={() => onPick(c.amount, c.unit)}>
            {c.label}
          </button>
        );
      })}
    </div>
  );
}
