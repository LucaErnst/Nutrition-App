import { useState, type FormEvent } from 'react';
import { db } from '../db/db';
import { addMealEntry } from '../db/hooks';
import type { FoodItem, MealType, Unit } from '../db/types';
import { fmt, macrosFor } from '../lib/nutrition';
import { lookupBarcode, offProductToFoodItem } from '../lib/openfoodfacts';
import { BarcodeScanner } from './BarcodeScanner';
import { ManualEntryForm } from './ManualEntryForm';

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
        onBack={() => setState({ kind: 'scanning' })}
        onConfirm={async (amount, unit, save) => {
          let foodId = state.item.id;
          if (!foodId) {
            foodId = (await db.foodItems.add({ ...state.item, saved: save ? 1 : 0 })) as number;
          }
          await addMealEntry({ date, meal_type: mealType, food_item_id: foodId, amount, unit });
          onDone();
        }}
      />
    );
  }

  const busy = state.kind === 'loading';

  return (
    <div className="scan">
      {showCamera ? (
        <BarcodeScanner onDetected={(code) => void handleCode(code)} paused={busy} />
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

interface ResultProps {
  item: FoodItem;
  fromLocal: boolean;
  onBack: () => void;
  onConfirm: (amount: number, unit: Unit, save: boolean) => Promise<void>;
}

function ProductResult({ item, fromLocal, onBack, onConfirm }: ResultProps) {
  const unit: Unit = item.unit_type === 'volume' ? 'ml' : 'g';
  const [amount, setAmount] = useState(String(item.default_amount ?? 100));
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
        ‹ Nochmals scannen
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
        <label className="field">
          <span>Menge</span>
          <input
            type="number"
            inputMode="decimal"
            min={0}
            step="any"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            autoFocus
            onFocus={(e) => e.target.select()}
          />
        </label>
        <label className="field">
          <span>Einheit</span>
          <select value={unit} disabled>
            <option value={unit}>{unit}</option>
          </select>
        </label>
      </div>
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
