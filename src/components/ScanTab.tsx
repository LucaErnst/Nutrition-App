import { lazy, Suspense, useState, type FormEvent } from 'react';
import { db } from '../db/db';
import { addMealEntry } from '../db/hooks';
import type { FoodItem, MealType } from '../db/types';
import { lookupBarcode, offProductToFoodItem } from '../lib/openfoodfacts';
const BarcodeScanner = lazy(() => import('./BarcodeScanner').then((m) => ({ default: m.BarcodeScanner })));
import { ManualEntryForm } from './ManualEntryForm';
import { ProductResult } from './ProductResult';

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
        backLabel="‹ Nochmals scannen"
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
        <Suspense fallback={<div className="scanner skeleton-card"><p className="scanner-status">Scanner wird geladen…</p></div>}>
          <BarcodeScanner onDetected={(code) => void handleCode(code)} paused={busy} />
        </Suspense>
      ) : null}
      <button type="button" className="btn-link" onClick={() => setShowCamera((v) => !v)}>
        {showCamera ? 'Kamera ausblenden' : 'Kamera einblenden'}
      </button>
      {isIosStandalone() && (
        <p className="search-hint">
          Fragt iOS bei jedem Start nach der Kamera? In Safari die App-Adresse öffnen → „aA“ → Website-Einstellungen → Kamera: Erlauben.
        </p>
      )}

      <form className="scan-code-form" onSubmit={submitCode}>
        <input
          className="search-input"
          inputMode="numeric"
          pattern="[0-9 ]*"
          placeholder="Barcode eingeben (EAN)"
          value={codeInput}
          onChange={(e) => setCodeInput(e.target.value)}
          aria-label="Barcode manuell eingeben"
        />
        <button type="submit" className="btn-primary" disabled={busy || !codeInput.trim()}>
          Suchen
        </button>
      </form>

      {state.kind === 'loading' && <p className="search-hint">Suche {state.code} bei Open Food Facts…</p>}

      {state.kind === 'not_found' && (
        <div className="scan-notice">
          <p>
            <strong>{state.code}</strong> ist bei Open Food Facts nicht bekannt.
          </p>
          <button className="btn-secondary" onClick={() => setState({ kind: 'manual', code: state.code })}>
            Nährwerte manuell eingeben
          </button>
        </div>
      )}

      {state.kind === 'error' && (
        <div className="scan-notice">
          <p role="alert">{state.message}</p>
          <div className="form-actions" style={{ justifyContent: 'flex-start' }}>
            <button className="btn-secondary" onClick={() => void handleCode(state.code)}>
              Erneut versuchen
            </button>
            <button className="btn-secondary" onClick={() => setState({ kind: 'manual', code: state.code })}>
              Manuell eingeben
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
