import { useState, type FormEvent } from 'react';
import { db } from '../db/db';
import type { FoodItem, Portion, UnitType } from '../db/types';

interface Props {
  item?: FoodItem;
  onDone: () => void;
}

function num(v: string): number {
  const n = Number(v.replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
}

/** Anlegen/Bearbeiten eines Referenz-Lebensmittels, Werte pro 100 g. */
export function FoodItemForm({ item, onDone }: Props) {
  const [name, setName] = useState(item?.name ?? '');
  const [brand, setBrand] = useState(item?.brand ?? '');
  const [unitType, setUnitType] = useState<UnitType>(item?.unit_type ?? 'weight');
  const [pieceWeight, setPieceWeight] = useState(item?.piece_weight_g ? String(item.piece_weight_g) : '');
  const [defaultAmount, setDefaultAmount] = useState(item?.default_amount ? String(item.default_amount) : '');
  const [kcal, setKcal] = useState(item ? String(round(item.kcal_per_100g)) : '');
  const [protein, setProtein] = useState(item ? String(round(item.protein_per_100g)) : '');
  const [fat, setFat] = useState(item ? String(round(item.fat_per_100g)) : '');
  const [carbs, setCarbs] = useState(item ? String(round(item.carbs_per_100g)) : '');
  const [portions, setPortions] = useState<{ label: string; grams: string }[]>(
    (item?.portions ?? []).map((p) => ({ label: p.label, grams: String(p.grams) })),
  );
  const [error, setError] = useState<string | null>(null);

  function setPortion(i: number, patch: Partial<{ label: string; grams: string }>) {
    setPortions((list) => list.map((p, j) => (j === i ? { ...p, ...patch } : p)));
  }

  async function submit(ev: FormEvent) {
    ev.preventDefault();
    if (!name.trim()) return setError('Name fehlt.');
    if (unitType === 'piece' && num(pieceWeight) <= 0) return setError('Stückgewicht fehlt.');

    const data: Omit<FoodItem, 'id' | 'created_at' | 'source' | 'saved'> = {
      name: name.trim(),
      brand: brand.trim() || undefined,
      kcal_per_100g: num(kcal),
      protein_per_100g: num(protein),
      fat_per_100g: num(fat),
      carbs_per_100g: num(carbs),
      unit_type: unitType,
      piece_weight_g: unitType === 'piece' ? num(pieceWeight) : undefined,
      default_amount: num(defaultAmount) || undefined,
      barcode: item?.barcode,
      portions: portions
        .map((p): Portion => ({ label: p.label.trim(), grams: num(p.grams) }))
        .filter((p) => p.label && p.grams > 0),
    };

    if (item?.id) {
      await db.foodItems.update(item.id, data);
    } else {
      await db.foodItems.add({ ...data, source: 'manual', saved: 1, created_at: Date.now() });
    }
    onDone();
  }

  const per = unitType === 'volume' ? '100 ml' : '100 g';

  return (
    <form className="form" onSubmit={submit}>
      <label className="field">
        <span>Name</span>
        <input value={name} onChange={(e) => setName(e.target.value)} required />
      </label>
      <label className="field">
        <span>Marke (optional)</span>
        <input value={brand} onChange={(e) => setBrand(e.target.value)} />
      </label>
      <div className="field-row">
        <label className="field">
          <span>Einheit</span>
          <select value={unitType} onChange={(e) => setUnitType(e.target.value as UnitType)}>
            <option value="weight">Gramm</option>
            <option value="volume">Milliliter</option>
            <option value="piece">Stück</option>
          </select>
        </label>
        {unitType === 'piece' && (
          <label className="field">
            <span>g / Stück</span>
            <input type="number" inputMode="decimal" min={0} step="any" value={pieceWeight} onChange={(e) => setPieceWeight(e.target.value)} required />
          </label>
        )}
        <label className="field">
          <span>Übliche Portion</span>
          <input type="number" inputMode="decimal" min={0} step="any" value={defaultAmount} onChange={(e) => setDefaultAmount(e.target.value)} placeholder={unitType === 'piece' ? '1' : '100'} />
        </label>
      </div>
      <fieldset className="field">
        <legend>Nährwerte pro {per}</legend>
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
      <fieldset className="field">
        <legend>Portionsgrössen (optional, z.B. „1 EL“ = 14 g)</legend>
        <ul className="portion-list">
          {portions.map((p, i) => (
            <li key={i} className="portion-row">
              <input value={p.label} onChange={(e) => setPortion(i, { label: e.target.value })} placeholder="z.B. 1 Handvoll" aria-label="Bezeichnung" />
              <input type="number" inputMode="decimal" min={0} step="any" value={p.grams} onChange={(e) => setPortion(i, { grams: e.target.value })} placeholder={unitType === 'volume' ? 'ml' : 'g'} aria-label="Gewicht" />
              <button type="button" className="btn-icon" onClick={() => setPortions((l) => l.filter((_, j) => j !== i))} aria-label="Portion entfernen">
                ×
              </button>
            </li>
          ))}
        </ul>
        <button type="button" className="btn-link" onClick={() => setPortions((l) => [...l, { label: '', grams: '' }])} style={{ marginTop: 6 }}>
          + Portionsgrösse
        </button>
      </fieldset>
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="form-actions">
        <button type="button" className="btn-secondary" onClick={onDone}>
          Abbrechen
        </button>
        <button type="submit" className="btn-primary">
          {item ? 'Speichern' : 'Anlegen'}
        </button>
      </div>
    </form>
  );
}

function round(n: number): number {
  return Math.round(n * 10) / 10;
}
