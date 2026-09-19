import { useState } from 'react';
import type { FoodItem, Unit } from '../db/types';
import { fmt, macrosFor } from '../lib/nutrition';
import { AmountStepper } from './AmountStepper';
import { PortionChips } from './PortionChips';

/** Ergebniskarte für ein Open-Food-Facts-Produkt (Scan oder Textsuche): Menge wählen, speichern. */
interface ResultProps {
  item: FoodItem;
  fromLocal: boolean;
  backLabel: string;
  onBack: () => void;
  onConfirm: (amount: number, unit: Unit, save: boolean) => Promise<void>;
}

export function ProductResult({ item, fromLocal, backLabel, onBack, onConfirm }: ResultProps) {
  const unit: Unit = item.unit_type === 'volume' ? 'ml' : 'g';
  const [amount, setAmount] = useState(String(item.last_amount ?? item.default_amount ?? 100));
  const [save, setSave] = useState(true);
  const n = Number(amount.replace(',', '.'));
  const valid = Number.isFinite(n) && n > 0;
  const m = macrosFor(item, valid ? n : 0, unit);
  const incomplete = item.kcal_per_100g === 0;

  return (
    <form
      className="form"
      onSubmit={(e) => {
        e.preventDefault();
        if (valid) void onConfirm(n, unit, save);
      }}
    >
      <button type="button" className="btn-link" onClick={onBack}>
        {backLabel}
      </button>
      <div>
        <div className="picker-name">{item.name}</div>
        <div className="search-item-brand">
          {item.brand && <>{item.brand} · </>}
          {fromLocal ? 'aus deiner Datenbank' : 'Open Food Facts'} · {item.barcode}
        </div>
      </div>
      <div className="scan-per100">
        pro 100 {unit}: {fmt(item.kcal_per_100g)} kcal · P {fmt(item.protein_per_100g, 1)} · F {fmt(item.fat_per_100g, 1)} · KH {fmt(item.carbs_per_100g, 1)}
      </div>
      {incomplete && (
        <p className="form-error">Für dieses Produkt sind keine Kalorien hinterlegt – Werte bitte in der Datenbank prüfen.</p>
      )}
      <div className="field-row">
        <div className="field" style={{ flex: 2 }}>
          <span>Menge</span>
          <AmountStepper value={amount} onChange={setAmount} unit={unit} />
        </div>
        <label className="field">
          <span>Einheit</span>
          <select value={unit} disabled>
            <option value={unit}>{unit}</option>
          </select>
        </label>
      </div>
      <PortionChips food={item} baseUnit={unit} current={{ amount: n, unit }} onPick={(a) => setAmount(String(a))} />
      <div className="picker-preview">
        <span className="picker-kcal">{fmt(m.kcal)} kcal</span>
        <span>P {fmt(m.protein)} g</span>
        <span>F {fmt(m.fat)} g</span>
        <span>KH {fmt(m.carbs)} g</span>
      </div>
      {!fromLocal && (
        <label className="checkbox">
          <input type="checkbox" checked={save} onChange={(e) => setSave(e.target.checked)} />
          In meiner Referenzdatenbank speichern
        </label>
      )}
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
