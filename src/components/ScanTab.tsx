import { lazy, Suspense, useState, type FormEvent } from 'react';
import { db } from '../db/db';
import { addMealEntry } from '../db/hooks';
import type { FoodItem, MealType } from '../db/types';
import { lookupBarcode, offProductToFoodItem } from '../lib/openfoodfacts';
const BarcodeScanner = lazy(() => import('./BarcodeScanner').then((m) => ({ default: m.BarcodeScanner })));
import { ManualEntryForm } from './ManualEntryForm';
import { ProductResult } from './ProductResult';
import { useT } from '../i18n';

interface Props {
  date: string;
  mealType: MealType;
  onDone: () => void;
}

type State =
  | { kind: 'scanning' }
  | { kind: 'loading'; code: string }
  | { kind: 'found'; item: FoodItem; fromLocal: boolean }
  | { kind: 'not_found'; code: string }
  | { kind: 'error'; code: string; message: string }
  | { kind: 'manual'; code: string };

export function ScanTab({ date, mealType, onDone }: Props) {
  const t = useT();
  const [state, setState] = useState<State>({ kind: 'scanning' });
  const [codeInput, setCodeInput] = useState('');
  const [showCamera, setShowCamera] = useState(true);

  async function handleCode(raw: string) {
    const code = raw.replace(/\D/g, '');
    if (!code) return;
    setState({ kind: 'loading', code });

    // Zuerst lokal nachsehen – spart den API-Call und respektiert eigene Korrekturen.
    const local = await db.foodItems.where('barcode').equals(code).first();
    if (local) {
      setState({ kind: 'found', item: local, fromLocal: true });
      return;
    }

    const res = await lookupBarcode(code);
    if (res.status === 'found') {
      setState({ kind: 'found', item: offProductToFoodItem(res.product, true), fromLocal: false });
    } else if (res.status === 'not_found') {
      setState({ kind: 'not_found', code });
    } else {
      setState({ kind: 'error', code, message: res.message });
    }
  }

  function submitCode(ev: FormEvent) {
    ev.preventDefault();
    void handleCode(codeInput);
  }

  if (state.kind === 'manual') {
    return (
      <ManualEntryForm
        date={date}
        mealType={mealType}
        onDone={onDone}
        barcode={state.code}
        onCancel={() => setState({ kind: 'scanning' })}
      />
    );
  }

  if (state.kind === 'found') {
    return (
      <ProductResult
        item={state.item}
        fromLocal={state.fromLocal}
        backLabel={t('product.backScan')}
        onBack={() => setState({ kind: 'scanning' })}
        onConfirm={async (amount, unit, save) => {
          let food = state.item;
          if (!food.id) {
            const id = (await db.foodItems.add({ ...food, saved: save ? 1 : 0 })) as number;
            food = { ...food, id };
          }
          await addMealEntry({ date, meal_type: mealType, food_item_id: food.id!, amount, unit }, food);
          onDone();
        }}
      />
    );
  }

  const busy = state.kind === 'loading';

  return (
    <div className="scan">
      {showCamera ? (
        <Suspense fallback={<div className="scanner skeleton-card"><p className="scanner-status">{t('scan.loading')}</p></div>}>
          <BarcodeScanner onDetected={(code) => void handleCode(code)} paused={busy} />
        </Suspense>
      ) : null}
      <button type="button" className="btn-link" onClick={() => setShowCamera((v) => !v)}>
        {showCamera ? t('scan.hideCamera') : t('scan.showCamera')}
      </button>
      {isIosStandalone() && (
        <p className="search-hint">{t('scan.iosHint')}</p>
      )}

      <form className="scan-code-form" onSubmit={submitCode}>
        <input
          className="search-input"
          inputMode="numeric"
          pattern="[0-9 ]*"
          placeholder={t('scan.enterBarcode')}
          value={codeInput}
          onChange={(e) => setCodeInput(e.target.value)}
          aria-label={t('scan.enterBarcodeLabel')}
        />
        <button type="submit" className="btn-primary" disabled={busy || !codeInput.trim()}>
          {t('common.search')}
        </button>
      </form>

      {state.kind === 'loading' && <p className="search-hint">{t('scan.looking', { code: state.code })}</p>}

      {state.kind === 'not_found' && (
        <div className="scan-notice">
          <p>{t('scan.notFound', { code: state.code })}</p>
          <button className="btn-secondary" onClick={() => setState({ kind: 'manual', code: state.code })}>
            {t('scan.enterManually')}
          </button>
        </div>
      )}

      {state.kind === 'error' && (
        <div className="scan-notice">
          <p role="alert">{state.message}</p>
          <div className="form-actions" style={{ justifyContent: 'flex-start' }}>
            <button className="btn-secondary" onClick={() => void handleCode(state.code)}>
              {t('common.retry')}
            </button>
            <button className="btn-secondary" onClick={() => setState({ kind: 'manual', code: state.code })}>
              {t('scan.manual')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/** true, wenn die App auf iOS vom Home-Bildschirm läuft. */
function isIosStandalone(): boolean {
  return (navigator as Navigator & { standalone?: boolean }).standalone === true;
}
