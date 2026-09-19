import { useMemo, useState } from 'react';
import { db } from '../db/db';
import type { FoodItem, MealType, Unit } from '../db/types';
import { addMealEntry, toggleFavorite, useFoodUsage, useSavedFoods } from '../db/hooks';
import { defaultUnit, fmt, macrosFor } from '../lib/nutrition';
import { offProductToFoodItem, searchProducts, type OffProduct } from '../lib/openfoodfacts';
import { useT } from '../i18n';
import { ProductResult } from './ProductResult';
import { AmountStepper } from './AmountStepper';
import { PortionChips } from './PortionChips';

interface Props {
  date: string;
  mealType: MealType;
  onAdded: () => void;
}

export function normalize(s: string): string {
  return s.toLowerCase().replace(/ß/g, 'ss').normalize('NFD').replace(/[̀-ͯ]/g, '');
}

/** Anzeige-Einheit (Stück wird übersetzt, g/ml bleiben) */
export function unitLabel(t: ReturnType<typeof useT>, unit: Unit): string {
  return unit === 'Stück' ? t('unit.piece') : unit;
}

type OffState =
  | { kind: 'idle' }
  | { kind: 'loading'; query: string }
  | { kind: 'results'; query: string; products: OffProduct[]; total: number }
  | { kind: 'error'; message: string };

export function FoodSearch({ date, mealType, onAdded }: Props) {
  const t = useT();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<FoodItem | null>(null);
  const [offProduct, setOffProduct] = useState<FoodItem | null>(null);
  const [off, setOff] = useState<OffState>({ kind: 'idle' });
  const [worldwide, setWorldwide] = useState(false);
  const foods = useSavedFoods() ?? [];
  const usage = useFoodUsage();

  async function searchOff() {
    const q = query.trim();
    setOff({ kind: 'loading', query: q });
    const res = await searchProducts(q, { country: worldwide ? null : 'switzerland' });
    if (res.status === 'found') setOff({ kind: 'results', query: q, products: res.products, total: res.total });
    else setOff({ kind: 'error', message: res.message });
  }

  async function pickOff(p: OffProduct) {
    // Bereits gespeichert (z.B. früher gescannt)? Dann das lokale Item nehmen.
    const local = await db.foodItems.where('barcode').equals(p.barcode).first();
    setOffProduct(local ?? offProductToFoodItem(p, true));
  }

  const results = useMemo(() => {
    const q = normalize(query.trim());
    if (q) {
      const terms = q.split(/\s+/);
      return foods.filter((f) => {
        const hay = normalize(`${f.name} ${f.brand ?? ''}`);
        return terms.every((tm) => hay.includes(tm));
      });
    }
    // Ohne Suchbegriff: Favoriten, dann häufig genutzte, dann alphabetisch.
    return [...foods].sort((a, b) => {
      const fa = a.favorite ?? 0;
      const fb = b.favorite ?? 0;
      if (fa !== fb) return fb - fa;
      const ua = usage?.get(a.id!)?.count ?? 0;
      const ub = usage?.get(b.id!)?.count ?? 0;
      if (ua !== ub) return ub - ua;
      return a.name.localeCompare(b.name);
    });
  }, [foods, query, usage]);

  if (offProduct) {
    return (
      <ProductResult
        item={offProduct}
        fromLocal={!!offProduct.id}
        backLabel={t('product.backResults')}
        onBack={() => setOffProduct(null)}
        onConfirm={async (amount, unit, save) => {
          let food = offProduct;
          if (!food.id) {
            const id = (await db.foodItems.add({ ...food, saved: save ? 1 : 0 })) as number;
            food = { ...food, id };
          }
          await addMealEntry({ date, meal_type: mealType, food_item_id: food.id!, amount, unit }, food);
          onAdded();
        }}
      />
    );
  }

  if (selected) {
    return (
      <AmountPicker
        food={selected}
        onBack={() => setSelected(null)}
        onConfirm={async (amount, unit) => {
          await addMealEntry({ date, meal_type: mealType, food_item_id: selected.id!, amount, unit }, selected);
          onAdded();
        }}
      />
    );
  }

  const q = query.trim();

  return (
    <div className="search">
      <form
        className="scan-code-form"
        onSubmit={(e) => {
          e.preventDefault();
          if (q.length >= 2) void searchOff();
        }}
      >
        <input
          className="search-input"
          type="search"
          placeholder={t('search.placeholder')}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (off.kind !== 'idle') setOff({ kind: 'idle' });
          }}
          aria-label={t('search.label')}
        />
      </form>
      {!query && foods.length > 0 && <p className="search-hint">{t('search.hint')}</p>}
      {results.length === 0 ? (
        <p className="search-empty">{foods.length === 0 ? t('search.empty') : t('search.noneFor', { q })}</p>
      ) : (
        <ul className="search-list">
          {results.map((f) => {
            const unit = defaultUnit(f);
            const amount = f.default_amount ?? (unit === 'Stück' ? 1 : 100);
            const m = macrosFor(f, amount, unit);
            return (
              <li key={f.id} className="search-row">
                <button
                  className={`btn-icon star ${f.favorite ? 'on' : ''}`}
                  onClick={() => void toggleFavorite(f)}
                  aria-label={f.favorite ? t('search.favRemove', { name: f.name }) : t('search.favAdd', { name: f.name })}
                  aria-pressed={!!f.favorite}
                  title={t('db.favorite')}
                >
                  {f.favorite ? '★' : '☆'}
                </button>
                <button className="search-item" onClick={() => setSelected(f)}>
                  <span className="search-item-main">
                    <span className="search-item-name">{f.name}</span>
                    {f.brand && <span className="search-item-brand">{f.brand}</span>}
                    <span className="search-item-portion">
                      {fmt(amount, amount % 1 ? 1 : 0)} {unitLabel(t, unit)} · {t('macro.p')} {fmt(m.protein)} · {t('macro.f')} {fmt(m.fat)} · {t('macro.c')} {fmt(m.carbs)}
                    </span>
                  </span>
                  <span className="search-item-kcal">{fmt(m.kcal)} kcal</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {q.length >= 2 && (
        <div className="off-search">
          {off.kind === 'idle' && (
            <div className="off-search-row">
              <button type="button" className="btn-secondary" onClick={() => void searchOff()}>
                {t('search.offButton', { q })}
              </button>
              <label className="checkbox">
                <input type="checkbox" checked={worldwide} onChange={(e) => setWorldwide(e.target.checked)} />
                {t('search.offWorldwide')}
              </label>
            </div>
          )}
          {off.kind === 'loading' && <p className="search-hint">{t('search.offSearching', { q: off.query })}</p>}
          {off.kind === 'error' && (
            <p className="form-error" role="alert">
              {off.message}
            </p>
          )}
          {off.kind === 'results' && (
            <>
              <p className="search-hint">
                {off.products.length === 0
                  ? t('search.offNone', { scope: worldwide ? '' : t('search.offScopeCH') })
                  : t('search.offResults', { scope: worldwide ? '' : t('search.offScopeCH'), shown: off.products.length, total: fmt(off.total) })}
                {off.query !== q && t('search.offFor', { q: off.query })}
              </p>
              {off.products.length === 0 && !worldwide && (
                <button
                  type="button"
                  className="btn-link"
                  onClick={() => {
                    setWorldwide(true);
                    setOff({ kind: 'idle' });
                  }}
                >
                  {t('search.offSearchWorldwide')}
                </button>
              )}
              <ul className="search-list">
                {off.products.map((p) => (
                  <li key={p.barcode}>
                    <button className="search-item" onClick={() => void pickOff(p)}>
                      <span className="search-item-main">
                        <span className="search-item-name">{p.name}</span>
                        <span className="search-item-portion">
                          {p.brand && `${p.brand} · `}
                          {t('search.per100', { unit: p.is_liquid ? 'ml' : 'g' })} · {t('macro.p')} {fmt(p.protein_per_100g)} · {t('macro.f')} {fmt(p.fat_per_100g)} · {t('macro.c')} {fmt(p.carbs_per_100g)}
                          {p.incomplete && ` · ${t('search.incomplete')}`}
                        </span>
                      </span>
                      <span className="search-item-kcal">{fmt(p.kcal_per_100g)} kcal</span>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
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
  const t = useT();
  const baseUnit = defaultUnit(food);
  // Vorschlag: zuletzt verwendete Menge, sonst übliche Portion
  const initialUnit = food.last_unit ?? baseUnit;
  const [unit, setUnit] = useState<Unit>(initialUnit);
  const [amount, setAmount] = useState(String(food.last_amount ?? food.default_amount ?? (baseUnit === 'Stück' ? 1 : 100)));
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
        {t('search.backToSearch')}
      </button>
      <div>
        <div className="picker-name">{food.name}</div>
        {food.brand && <div className="search-item-brand">{food.brand}</div>}
      </div>
      <div className="field-row">
        <div className="field" style={{ flex: 2 }}>
          <span>{t('common.amount')}</span>
          <AmountStepper value={amount} onChange={setAmount} unit={unit} />
        </div>
        <label className="field">
          <span>{t('common.unit')}</span>
          <select value={unit} onChange={(e) => setUnit(e.target.value as Unit)} disabled={units.length === 1}>
            {units.map((u) => (
              <option key={u} value={u}>
                {unitLabel(t, u)}
              </option>
            ))}
          </select>
        </label>
      </div>
      <PortionChips
        food={food}
        baseUnit={baseUnit}
        current={{ amount: n, unit }}
        onPick={(a, u) => {
          setAmount(String(a));
          if (units.includes(u)) setUnit(u);
        }}
      />
      <div className="picker-preview">
        <span className="picker-kcal">{fmt(m.kcal)} kcal</span>
        <span>{t('macro.p')} {fmt(m.protein)} g</span>
        <span>{t('macro.f')} {fmt(m.fat)} g</span>
        <span>{t('macro.c')} {fmt(m.carbs)} g</span>
      </div>
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
