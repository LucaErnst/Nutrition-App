import { useState } from 'react';
import type { FoodItem, Unit } from '../db/types';
import { defaultUnit, fmt, macrosFor } from '../lib/nutrition';
import { useT } from '../i18n';
import { useUnitSystem } from '../db/hooks';
import { UnitSelect } from './UnitSelect';
import { convertAmount } from '../lib/units';
import { AmountStepper } from './AmountStepper';
import { PortionChips } from './PortionChips';

interface ResultProps {
  item: FoodItem;
  fromLocal: boolean;
  backLabel: string;
  onBack: () => void;
  onConfirm: (amount: number, unit: Unit, save: boolean) => Promise<void>;
}

/** Ergebniskarte für ein Open-Food-Facts-Produkt (Scan oder Textsuche): Menge wählen, speichern. */
export function ProductResult({ item, fromLocal, backLabel, onBack, onConfirm }: ResultProps) {
  const t = useT();
  const system = useUnitSystem();
  const baseUnit = defaultUnit(item, 'metric');
  const [unit, setUnit] = useState<Unit>(item.last_unit ?? defaultUnit(item, system));
  const [amount, setAmount] = useState(() => {
    const u = item.last_unit ?? defaultUnit(item, system);
    if (item.last_amount !== undefined) return String(item.last_amount);
    return String(convertAmount(item.default_amount ?? 100, baseUnit, u));
  });
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
          {fromLocal ? t('product.fromLocal') : t('product.fromOff')} · {item.barcode}
        </div>
      </div>
      <div className="scan-per100">
        {t('search.per100', { unit })}: {fmt(item.kcal_per_100g)} kcal · {t('macro.p')} {fmt(item.protein_per_100g, 1)} · {t('macro.f')} {fmt(item.fat_per_100g, 1)} · {t('macro.c')} {fmt(item.carbs_per_100g, 1)}
      </div>
      {incomplete && <p className="form-error">{t('product.noKcal')}</p>}
      <div className="field-row">
        <div className="field" style={{ flex: 2 }}>
          <span>{t('common.amount')}</span>
          <AmountStepper value={amount} onChange={setAmount} unit={unit} />
        </div>
        <label className="field">
          <span>{t('common.unit')}</span>
          <UnitSelect kind={item.unit_type} value={unit} onChange={setUnit} />
        </label>
      </div>
      <PortionChips
        food={item}
        baseUnit={baseUnit}
        current={{ amount: n, unit }}
        onPick={(a, u) => {
          setAmount(String(a));
          setUnit(u);
        }}
      />
      <div className="picker-preview">
        <span className="picker-kcal">{fmt(m.kcal)} kcal</span>
        <span>{t('macro.p')} {fmt(m.protein)} g</span>
        <span>{t('macro.f')} {fmt(m.fat)} g</span>
        <span>{t('macro.c')} {fmt(m.carbs)} g</span>
      </div>
      {!fromLocal && (
        <label className="checkbox">
          <input type="checkbox" checked={save} onChange={(e) => setSave(e.target.checked)} />
          {t('product.saveToDb')}
        </label>
      )}
      <div className="form-actions">
        <button type="button" className="btn-secondary" onClick={onBack}>
          {t('common.cancel')}
        </button>
        <button type="submit" className="btn-primary" disabled={!valid}>
          {t('common.add')}
        </button>
      </div>
    </form>
  );
}
