import { useState, type FormEvent } from 'react';
import { db } from '../db/db';
import { addMealEntry } from '../db/hooks';
import type { FoodItem, MealType, Unit } from '../db/types';

interface Props {
  date: string;
  mealType: MealType;
  onDone: () => void;
  /** Abbrechen-Verhalten, falls abweichend von onDone (z.B. zurück zum Scanner) */
  onCancel?: () => void;
  /** Barcode, der am neuen Item gespeichert wird (Fallback nach erfolglosem Scan) */
  barcode?: string;
}

type Basis = 'per100' | 'portion';

function num(v: string): number {
  const n = Number(v.replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
}

export function ManualEntryForm({ date, mealType, onDone, onCancel, barcode }: Props) {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('100');
  const [unit, setUnit] = useState<Unit>('g');
  const [pieceWeight, setPieceWeight] = useState('');
  const [basis, setBasis] = useState<Basis>('per100');
  const [kcal, setKcal] = useState('');
  const [protein, setProtein] = useState('');
  const [fat, setFat] = useState('');
  const [carbs, setCarbs] = useState('');
  const [save, setSave] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isPiece = unit === 'Stück';
  // Ohne Stückgewicht ist "pro 100 g" nicht sinnvoll – dann zählt die Portion.
  const per100Allowed = !isPiece || num(pieceWeight) > 0;
  const effectiveBasis: Basis = per100Allowed ? basis : 'portion';

  async function submit(ev: FormEvent) {
    ev.preventDefault();
    const amt = num(amount);
    if (!name.trim()) return setError('Name fehlt.');
    if (amt <= 0) return setError('Menge muss grösser als 0 sein.');

    // Gewicht pro Stück: falls nicht angegeben, 100 g annehmen, damit
    // "pro Stück" und "pro 100 g" identisch sind.
    const pw = isPiece ? num(pieceWeight) || 100 : undefined;
    const grams = isPiece ? amt * pw! : amt;

    // Alles auf 100 g normalisieren.
    const factor = effectiveBasis === 'per100' ? 1 : 100 / grams;

    const item: FoodItem = {
      name: name.trim(),
      kcal_per_100g: num(kcal) * factor,
      protein_per_100g: num(protein) * factor,
      fat_per_100g: num(fat) * factor,
      carbs_per_100g: num(carbs) * factor,
      unit_type: isPiece ? 'piece' : unit === 'ml' ? 'volume' : 'weight',
      piece_weight_g: pw,
      default_amount: amt,
      source: 'manual',
      barcode,
      saved: save ? 1 : 0,
      created_at: Date.now(),
    };

    const foodId = (await db.foodItems.add(item)) as number;
    await addMealEntry({ date, meal_type: mealType, food_item_id: foodId, amount: amt, unit });
    onDone();
  }

  const basisLabel = effectiveBasis === 'per100' ? (unit === 'ml' ? 'pro 100 ml' : 'pro 100 g') : `für ${amount || '…'} ${unit}`;

  return (
    <form className="form" onSubmit={submit}>
      {barcode && <p className="search-hint">Barcode {barcode} wird mitgespeichert.</p>}
      <label className="field">
        <span>Name</span>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="z.B. Magerquark"
          required
        />
      </label>

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
            required
          />
        </label>
        <label className="field">
          <span>Einheit</span>
          <select value={unit} onChange={(e) => setUnit(e.target.value as Unit)}>
            <option value="g">g</option>
            <option value="ml">ml</option>
            <option value="Stück">Stück</option>
          </select>
        </label>
        {isPiece && (
          <label className="field">
            <span>g / Stück</span>
            <input
              type="number"
              inputMode="decimal"
              min={0}
              step="any"
              value={pieceWeight}
              onChange={(e) => setPieceWeight(e.target.value)}
              placeholder="optional"
            />
          </label>
        )}
      </div>

      <fieldset className="field">
        <legend>Nährwerte {basisLabel}</legend>
        <div className="segmented" role="radiogroup" aria-label="Bezugsbasis">
          <label className={effectiveBasis === 'per100' ? 'active' : ''}>
            <input
              type="radio"
              name="basis"
              checked={effectiveBasis === 'per100'}
              onChange={() => setBasis('per100')}
              disabled={!per100Allowed}
            />
            pro 100 {unit === 'ml' ? 'ml' : 'g'}
          </label>
          <label className={effectiveBasis === 'portion' ? 'active' : ''}>
            <input
              type="radio"
              name="basis"
              checked={effectiveBasis === 'portion'}
              onChange={() => setBasis('portion')}
            />
            für die Menge
          </label>
        </div>
        <div className="field-row macros-row">
          <label className="field">
            <span>kcal</span>
            <input type="number" inputMode="decimal" min={0} step="any" value={kcal} onChange={(e) => setKcal(e.target.value)} required />
          </label>
          <label className="field">
            <span>Protein g</span>
            <input type="number" inputMode="decimal" min={0} step="any" value={protein} onChange={(e) => setProtein(e.target.value)} />
          </label>
          <label className="field">
            <span>Fett g</span>
            <input type="number" inputMode="decimal" min={0} step="any" value={fat} onChange={(e) => setFat(e.target.value)} />
          </label>
          <label className="field">
            <span>KH g</span>
            <input type="number" inputMode="decimal" min={0} step="any" value={carbs} onChange={(e) => setCarbs(e.target.value)} />
          </label>
        </div>
      </fieldset>

      <label className="checkbox">
        <input type="checkbox" checked={save} onChange={(e) => setSave(e.target.checked)} />
        In meiner Referenzdatenbank speichern
      </label>

      {error && <p className="form-error" role="alert">{error}</p>}

      <div className="form-actions">
        <button type="button" className="btn-secondary" onClick={onCancel ?? onDone}>
          Abbrechen
        </button>
        <button type="submit" className="btn-primary">
          Hinzufügen
        </button>
      </div>
    </form>
  );
}
