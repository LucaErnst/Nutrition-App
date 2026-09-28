import { useMemo, useState } from 'react';
import { db } from '../db/db';
import type { FoodItem, MealType, Unit } from '../db/types';
import { addMealEntry, toggleFavorite, useFoodUsage, useSavedFoods } from '../db/hooks';
import { defaultUnit, fmt, macrosFor } from '../lib/nutrition';
import { offProductToFoodItem, searchProducts, type OffProduct } from '../lib/openfoodfacts';
import { useT } from '../i18n';
import { rankFoods } from '../lib/foodRank';
import { useUnitSystem } from '../db/hooks';
import { convertAmount, fmtAmount, isPieceUnit, labelFor } from '../lib/units';
import { UnitSelect } from './UnitSelect';
import { ProductResult } from './ProductResult';
import { AmountStepper } from './AmountStepper';
import { PortionChips } from './PortionChips';

interface Props {
  date: string;
  mealType: MealType;
  onAdded: () => void;
}

/** Anzahl angezeigter Treffer aus der eigenen Datenbank. */
const MAX_RESULTS = 40;

/** Anzeige-Einheit (Stück wird übersetzt, g/ml bleiben) */
export function unitLabel(t: ReturnType<typeof useT>, unit: Unit): string {
  return labelFor(unit, t('unit.piece'));
}

type OffState =
  | { kind: 'idle' }
  | { kind: 'loading'; query: string }
  | { kind: 'results'; query: string; products: OffProduct[]; total: number; page: number; hasMore: boolean; loadingMore?: boolean }
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
    if (res.status === 'found') setOff({ kind: 'results', query: q, products: res.products, total: res.total, page: res.page, hasMore: res.hasMore });
    else setOff({ kind: 'error', message: res.message });
  }

  /** Nächste Seite anhängen – vorher sah man nur die ersten Treffer und sonst nichts. */
  async function loadMoreOff() {
    if (off.kind !== 'results' || off.loadingMore) return;
    const current = off;
    setOff({ ...current, loadingMore: true });
    const res = await searchProducts(current.query, { country: worldwide ? null : 'switzerland', page: current.page + 1 });
    if (res.status === 'found') {
      const seen = new Set(current.products.map((p) => p.barcode));
      setOff({
        ...current,
        products: [...current.products, ...res.products.filter((p) => !seen.has(p.barcode))],
        total: res.total,
        page: res.page,
        hasMore: res.hasMore,
        loadingMore: false,
      });
    } else {
      setOff({ kind: 'error', message: res.message });
    }
  }

  async function pickOff(p: OffProduct) {
    // Bereits gespeichert (z.B. früher gescannt)? Dann das lokale Item nehmen.
    const local = await db.foodItems.where('barcode').equals(p.barcode).first();
    setOffProduct(local ?? offProductToFoodItem(p, true));
  }

  // Eigene Lebensmittel: gescannt oder von Hand angelegt, nicht mitgeliefert.
  const own = useMemo(() => foods.filter((f) => f.source !== 'reference'), [foods]);
  const ownCount = own.length;
  // Die Datenbank enthält über sechstausend Grundnahrungsmittel – ohne Rangfolge wäre die
  // Liste unbrauchbar. Angezeigt wird nur der Anfang, der Rest wäre ohnehin nicht gelesen.
  // Ohne Suchbegriff stehen nur die eigenen da: was man selbst isst, nicht das Alphabet.
  const ranked = useMemo(
    () => rankFoods(query.trim() ? foods : own, query, usage),
    [foods, own, query, usage],
  );
  const results = useMemo(() => ranked.slice(0, MAX_RESULTS), [ranked]);

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
      {!query && ownCount > 0 && <p className="search-hint">{t('search.hint')}</p>}
      {/* Solange kaum eigene Lebensmittel da sind: erklären, dass die Datenbank mitwächst.
          Wer das weiss, scannt in den ersten Wochen mehr – und tippt danach fast nichts mehr. */}
      {!query && ownCount > 0 && ownCount < 12 && <p className="search-hint">{t('search.ownHint')}</p>}
      {results.length === 0 ? (
        <p className="search-empty">{q ? t('search.noneFor', { q }) : t('search.empty')}</p>
      ) : (
        <ul className="search-list">
          {results.map((f) => {
            const unit = defaultUnit(f, 'metric');
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
                      {fmtAmount(amount, unit)} {unitLabel(t, unit)} · {t('macro.p')} {fmt(m.protein)} · {t('macro.f')} {fmt(m.fat)} · {t('macro.c')} {fmt(m.carbs)}
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
              {off.hasMore && (
                <button type="button" className="btn-link btn-centered" onClick={() => void loadMoreOff()} disabled={off.loadingMore}>
                  {off.loadingMore ? t('search.offLoading') : t('search.offMore')}
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

/** Vorgeschlagene Menge in der Einheit, die im Feld steht. */
function initialAmount(food: FoodItem, baseUnit: Unit, unit: Unit): number {
  if (food.last_amount !== undefined) return food.last_amount;
  if (food.default_amount !== undefined) return convertAmount(food.default_amount, baseUnit, unit);
  return isPieceUnit(unit) ? 1 : convertAmount(100, baseUnit, unit);
}

interface PickerProps {
  food: FoodItem;
  onBack: () => void;
  onConfirm: (amount: number, unit: Unit) => void | Promise<void>;
}

function AmountPicker({ food, onBack, onConfirm }: PickerProps) {
  const t = useT();
  const system = useUnitSystem();
  // Einheit, in der die gespeicherten Mengen des Lebensmittels stehen (g, ml oder Stück)
  const baseUnit = defaultUnit(food, 'metric');
  // Vorschlag: zuletzt verwendete Menge, sonst die übliche Portion – umgerechnet in die Einheit,
  // in der dieser Nutzer einträgt. 30 g dürfen nicht als 30 oz im Feld landen.
  const initialUnit = food.last_unit ?? defaultUnit(food, system);
  const [unit, setUnit] = useState<Unit>(initialUnit);
  const [amount, setAmount] = useState(String(initialAmount(food, baseUnit, initialUnit)));
  const n = Number(amount.replace(',', '.'));
  const valid = Number.isFinite(n) && n > 0;
  const m = macrosFor(food, valid ? n : 0, unit);

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
          <UnitSelect kind={food.unit_type} value={unit} onChange={setUnit} />
        </label>
      </div>
      <PortionChips
        food={food}
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
