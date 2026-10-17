import { useState } from 'react';
import type { FoodItem, Unit } from '../db/types';
import { isPieceUnit } from '../lib/units';
import { useT } from '../i18n';

/**
 * „Stück“ steht bei jedem Lebensmittel zur Wahl (Wunsch Luca, 1.3). Ohne bekanntes Stückgewicht
 * fragt das Formular einmal nach den Gramm pro Stück; der Wert wird beim Lebensmittel gespeichert.
 */
export function usePieceWeight(food: FoodItem, unit: Unit) {
  const [input, setInput] = useState(food.piece_weight_g ? String(food.piece_weight_g) : '');
  const needs = isPieceUnit(unit) && !food.piece_weight_g;
  const grams = Number(input.replace(',', '.'));
  const ok = !needs || (Number.isFinite(grams) && grams > 0);
  /** Lebensmittel mit dem eingegebenen Stückgewicht, für Vorschau und Eintrag */
  const effective: FoodItem = needs && ok ? { ...food, piece_weight_g: grams } : food;
  return { needs, ok, input, setInput, effective, newWeight: needs && ok ? grams : undefined };
}

export function PieceWeightField({ input, setInput }: { input: string; setInput: (v: string) => void }) {
  const t = useT();
  return (
    <label className="field">
      <span>{t('unit.pieceWeight')}</span>
      <input
        type="number"
        inputMode="decimal"
        min={1}
        step={1}
        placeholder="50"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        aria-label={t('unit.pieceWeight')}
      />
      <span className="search-hint">{t('unit.pieceWeightHint')}</span>
    </label>
  );
}
