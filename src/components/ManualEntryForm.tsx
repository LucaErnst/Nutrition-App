import { useState, type FormEvent } from 'react';
import { db } from '../db/db';
import { addMealEntry } from '../db/hooks';
import type { FoodItem, MealType, Unit } from '../db/types';
import { useT } from '../i18n';
import { unitLabel } from './FoodSearch';

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
  const t = useT();
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
    if (amt <= 0) return setError(t('manual.errAmount'));
    if (num(kcal) <= 0 && num(protein) <= 0 && num(fat) <= 0 && num(carbs) <= 0) return setError(t('manual.errValues'));
    // Ohne Namen: Schnell-Eintrag, landet nicht in der Datenbank.
    const quick = !name.trim();

    // Gewicht pro Stück: falls nicht angegeben, 100 g annehmen, damit
    // "pro Stück" und "pro 100 g" identisch sind.
    const pw = isPiece ? num(pieceWeight) || 100 : undefined;
    const grams = isPiece ? amt * pw! : amt;

    // Alles auf 100 g normalisieren.
    const factor = effectiveBasis === 'per100' ? 1 : 100 / grams;

    const item: FoodItem = {
      name: quick ? t('manual.quickEntry') : name.trim(),
      kcal_per_100g: num(kcal) * factor,
      protein_per_100g: num(protein) * factor,
      fat_per_100g: num(fat) * factor,
      carbs_per_100g: num(carbs) * factor,
      unit_type: isPiece ? 'piece' : unit === 'ml' ? 'volume' : 'weight',
      piece_weight_g: pw,
      default_amount: amt,
      source: 'manual',
      barcode,
      saved: save && !quick ? 1 : 0,
      created_at: Date.now(),
    };

    const foodId = (await db.foodItems.add(item)) as number;
    await addMealEntry({ date, meal_type: mealType, food_item_id: foodId, amount: amt, unit }, { ...item, id: foodId });
    onDone();
  }

  const baseUnit = unit === 'ml' ? 'ml' : 'g';
  const basisLabel =
    effectiveBasis === 'per100' ? t('manual.per100', { unit: baseUnit }) : t('manual.forAmount', { amount: amount || '…', unit: unitLabel(t, unit) });
  const numInput = (value: string, set: (v: string) => void) => (
    <input type="number" inputMode="decimal" min={0} step="any" value={value} onChange={(e) => set(e.target.value)} />
  );

  return (
    <form className="form" onSubmit={submit}>
      {barcode && <p className="search-hint">{t('manual.barcodeKept', { code: barcode })}</p>}
      <label className="field">
        <span>{t('manual.nameHint')}</span>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('manual.namePlaceholder')} />
      </label>

      <div className="field-row">
        <label className="field">
          <span>{t('common.amount')}</span>
          <input type="number" inputMode="decimal" min={0} step="any" value={amount} onChange={(e) => setAmount(e.target.value)} required />
        </label>
        <label className="field">
          <span>{t('common.unit')}</span>
          <select value={unit} onChange={(e) => setUnit(e.target.value as Unit)}>
            <option value="g">g</option>
            <option value="ml">ml</option>
            <option value="Stück">{t('unit.piece')}</option>
          </select>
        </label>
        {isPiece && (
          <label className="field">
            <span>{t('manual.gPerPiece')}</span>
            <input type="number" inputMode="decimal" min={0} step="any" value={pieceWeight} onChange={(e) => setPieceWeight(e.target.value)} placeholder={t('common.optional')} />
          </label>
        )}
      </div>

      <fieldset className="field">
        <legend>{t('manual.valuesFor', { basis: basisLabel })}</legend>
        <div className="segmented" role="radiogroup" aria-label={t('manual.basis')}>
          <label className={effectiveBasis === 'per100' ? 'active' : ''}>
            <input type="radio" name="basis" checked={effectiveBasis === 'per100'} onChange={() => setBasis('per100')} disabled={!per100Allowed} />
            {t('manual.basisPer100', { unit: baseUnit })}
          </label>
          <label className={effectiveBasis === 'portion' ? 'active' : ''}>
            <input type="radio" name="basis" checked={effectiveBasis === 'portion'} onChange={() => setBasis('portion')} />
            {t('manual.basisPortion')}
          </label>
        </div>
        <div className="field-row macros-row">
          <label className="field">
            <span>kcal</span>
            {numInput(kcal, setKcal)}
          </label>
          <label className="field">
            <span>{t('manual.proteinG')}</span>
            {numInput(protein, setProtein)}
          </label>
          <label className="field">
            <span>{t('manual.fatG')}</span>
            {numInput(fat, setFat)}
          </label>
          <label className="field">
            <span>{t('manual.carbsG')}</span>
            {numInput(carbs, setCarbs)}
          </label>
        </div>
      </fieldset>

      <label className="checkbox">
        <input type="checkbox" checked={save && !!name.trim()} disabled={!name.trim()} onChange={(e) => setSave(e.target.checked)} />
        {t('manual.saveToDb')}
        {!name.trim() && t('manual.needsName')}
      </label>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <div className="form-actions">
        <button type="button" className="btn-secondary" onClick={onCancel ?? onDone}>
          {t('common.cancel')}
        </button>
        <button type="submit" className="btn-primary">
          {t('common.add')}
        </button>
      </div>
    </form>
  );
}
