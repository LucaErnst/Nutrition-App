import { useMemo, useState } from 'react';
import type { FoodItem, MealType, Unit } from '../db/types';
import { addMealEntry, useFoodUsage, useSavedFoods } from '../db/hooks';
import { defaultUnit, fmt, macrosFor } from '../lib/nutrition';

interface Props {
  date: string;
  mealType: MealType;
  onAdded: () => void;
}

export function normalize(s: string): string {
  return s.toLowerCase().replace(/ß/g, 'ss').normalize('NFD').replace(/[̀-ͯ]/g, '');
}

export function FoodSearch({ date, mealType, onAdded }: Props) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<FoodItem | null>(null);
  const foods = useSavedFoods() ?? [];
  const usage = useFoodUsage();

  const results = useMemo(() => {
    const q = normalize(query.trim());
    if (q) {
      const terms = q.split(/\s+/);
      return foods.filter((f) => {
        const hay = normalize(`${f.name} ${f.brand ?? ''}`);
        return terms.every((t) => hay.includes(t));
      });
    }
    // Ohne Suchbegriff: häufig genutzte zuerst, dann alphabetisch.
    return [...foods].sort((a, b) => {
      const ua = usage?.get(a.id!)?.count ?? 0;
      const ub = usage?.get(b.id!)?.count ?? 0;
      if (ua !== ub) return ub - ua;
      return a.name.localeCompare(b.name, 'de');
    });
  }, [foods, query, usage]);

  if (selected) {
    return (
      <AmountPicker
        food={selected}
        onBack={() => setSelected(null)}
        onConfirm={async (amount, unit) => {
          await addMealEntry({ date, meal_type: mealType, food_item_id: selected.id!, amount, unit });
          onAdded();
        }}
      />
    );
  }

  return (
    <div className="search">
      <input
        className="search-input"
        type="search"
        placeholder="Lebensmittel suchen…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}

        aria-label="Lebensmittel suchen"
      />
      {!query && foods.length > 0 && (
        <p className="search-hint">Häufig verwendet zuerst</p>
      )}
      {results.length === 0 ? (
        <p className="search-empty">
          {foods.length === 0 ? 'Datenbank ist leer.' : `Nichts gefunden für „${query}“.`}
        </p>
      ) : (
        <ul className="search-list">
          {results.map((f) => {
            const unit = defaultUnit(f);
            const amount = f.default_amount ?? (unit === 'Stück' ? 1 : 100);
            const m = macrosFor(f, amount, unit);
            return (
              <li key={f.id}>
                <button className="search-item" onClick={() => setSelected(f)}>
                  <span className="search-item-main">
                    <span className="search-item-name">{f.name}</span>
                    {f.brand && <span className="search-item-brand">{f.brand}</span>}
                    <span className="search-item-portion">
                      {fmt(amount, amount % 1 ? 1 : 0)} {unit} · P {fmt(m.protein)} · F {fmt(m.fat)} · KH {fmt(m.carbs)}
                    </span>
                  </span>
                  <span className="search-item-kcal">{fmt(m.kcal)} kcal</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

interface PickerProps {
  food: FoodItem;
  onBack: () => void;
  onConfirm: (amount: number, unit: Unit) => void | Promise<void>;
}

function AmountPicker({ food, onBack, onConfirm }: PickerProps) {
  const baseUnit = defaultUnit(food);
  const [unit, setUnit] = useState<Unit>(baseUnit);
  const [amount, setAmount] = useState(String(food.default_amount ?? (baseUnit === 'Stück' ? 1 : 100)));
  const n = Number(amount.replace(',', '.'));
  const valid = Number.isFinite(n) && n > 0;
  const m = macrosFor(food, valid ? n : 0, unit);

  // Bei Stück-Artikeln zusätzlich Gramm-Eingabe erlauben, sonst nur die Basis-Einheit.
  const units: Unit[] = food.unit_type === 'piece' ? ['Stück', 'g'] : [baseUnit];

  return (
    <form
      className="form"
      onSubmit={(e) => {
        e.preventDefault();
        if (valid) void onConfirm(n, unit);
      }}
    >
      <button type="button" className="btn-link" onClick={onBack}>
        ‹ Zurück zur Suche
      </button>
      <div>
        <div className="picker-name">{food.name}</div>
        {food.brand && <div className="search-item-brand">{food.brand}</div>}
      </div>
      <div className="field-row">
        <label className="field">
          <span>Menge</span>
          <input
            type="number"
            inputMode="decimal"
            min={0}
            step="any"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}

            onFocus={(e) => e.target.select()}
          />
        </label>
        <label className="field">
          <span>Einheit</span>
          <select value={unit} onChange={(e) => setUnit(e.target.value as Unit)} disabled={units.length === 1}>
            {units.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="picker-preview">
        <span className="picker-kcal">{fmt(m.kcal)} kcal</span>
        <span>P {fmt(m.protein)} g</span>
        <span>F {fmt(m.fat)} g</span>
        <span>KH {fmt(m.carbs)} g</span>
      </div>
      <div className="form-actions">
        <button type="button" className="btn-secondary" onClick={onBack}>
          Abbrechen
        </button>
        <button type="submit" className="btn-primary" disabled={!valid}>
          Hinzufügen
        </button>
      </div>
    </form>
  );
}
