import { useMemo, useState } from 'react';
import type { FoodItem } from '../db/types';
import { deleteFoodItem, useSavedFoods } from '../db/hooks';
import { fmt } from '../lib/nutrition';
import { FoodItemForm } from './FoodItemForm';
import { Modal } from './Modal';
import { normalize } from './FoodSearch';

const SOURCE_LABEL: Record<FoodItem['source'], string> = {
  reference: 'Referenz',
  manual: 'Manuell',
  openfoodfacts: 'Open Food Facts',
};

export function FoodDatabase() {
  const foods = useSavedFoods();
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<FoodItem | 'new' | null>(null);

  const results = useMemo(() => {
    const q = normalize(query.trim());
    if (!foods) return [];
    if (!q) return foods;
    return foods.filter((f) => normalize(`${f.name} ${f.brand ?? ''}`).includes(q));
  }, [foods, query]);

  async function remove(item: FoodItem) {
    if (!confirm(`„${item.name}“ aus der Datenbank entfernen?`)) return;
    await deleteFoodItem(item.id!);
  }

  return (
    <div className="database">
      <div className="db-toolbar">
        <input
          className="search-input"
          type="search"
          placeholder="Suchen…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Datenbank durchsuchen"
        />
        <button className="btn-primary" onClick={() => setEditing('new')}>
          + Neu
        </button>
      </div>
      <p className="search-hint">
        {foods ? `${results.length} von ${foods.length} Einträgen` : 'Lade…'} · Werte pro 100 g / ml
      </p>
      <ul className="db-list card">
        {results.map((f) => (
          <li key={f.id} className="db-item">
            <div className="db-item-main">
              <span className="search-item-name">{f.name}</span>
              <span className="db-item-meta">
                {f.brand && <>{f.brand} · </>}
                {SOURCE_LABEL[f.source]}
                {f.unit_type === 'piece' && ` · ${fmt(f.piece_weight_g ?? 0)} g/Stück`}
              </span>
            </div>
            <div className="db-item-macros">
              <span className="entry-kcal">{fmt(f.kcal_per_100g)} kcal</span>
              <span>P {fmt(f.protein_per_100g, 1)}</span>
              <span>F {fmt(f.fat_per_100g, 1)}</span>
              <span>KH {fmt(f.carbs_per_100g, 1)}</span>
            </div>
            <div className="db-item-actions">
              <button className="btn-link" onClick={() => setEditing(f)}>
                Bearbeiten
              </button>
              <button className="btn-link danger" onClick={() => void remove(f)}>
                Entfernen
              </button>
            </div>
          </li>
        ))}
        {foods && results.length === 0 && <li className="search-empty">Nichts gefunden.</li>}
      </ul>

      {editing && (
        <Modal title={editing === 'new' ? 'Neues Lebensmittel' : 'Lebensmittel bearbeiten'} onClose={() => setEditing(null)}>
          <FoodItemForm item={editing === 'new' ? undefined : editing} onDone={() => setEditing(null)} />
        </Modal>
      )}
    </div>
  );
}
